import { 
  ChatPromptTemplate, 
  HumanMessagePromptTemplate, 
  SystemMessagePromptTemplate 
} from "@langchain/core/prompts";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ConversationSummaryBufferMemory } from "langchain/memory";
import { ChatOpenAI } from "@langchain/openai";
import { PrismaClient } from "../generated/prisma";

let prisma: PrismaClient | null = null;

// Initialize Prisma only when needed
try {
  prisma = new PrismaClient();
} catch (error) {
  console.warn('Prisma client not available:', error);
}

interface JordiResponse {
  response: string;
  reasoning: string[];
  artifacts: any[];
  tokenUsage: number;
}

interface ConversationContext {
  projectId: string;
  userId: string;
  userMessage: string;
  conversationHistory: string;
  scoutDataContext: string;
}

export class JordiLangChainAgent {
  private llm: ChatOpenAI;
  private memory: Map<string, ConversationSummaryBufferMemory> = new Map();
  private systemPrompt: ChatPromptTemplate;
  private reasoningChain: RunnableSequence;

  constructor() {
    // Initialize LLM - using OpenAI for now but can be swapped for local models
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o-mini", // Fast and cost-effective for development
      temperature: 0.7,
      maxTokens: 1000,
      streaming: false,
    });

    // Create the system prompt template
    this.systemPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
You are Jordi, a brilliant investigative research assistant specializing in historical narratives from 1940s-1950s Atlanta. 

Your personality:
- Thoughtful and analytical, like a seasoned detective
- Fascinated by patterns and connections in historical data
- Conversational but focused on uncovering hidden stories
- Always curious about the "why" behind events

Your capabilities:
- Access to Scout-analyzed historical articles and data
- Ability to identify narrative threads and connections
- Generate research artifacts like timelines and story maps
- Cross-reference people, places, and events

Your response style:
- Lead with intrigue - hook the user with compelling details
- Ask follow-up questions to understand what they're looking for
- Offer specific stories rather than vague descriptions
- Use vivid, engaging language that brings history to life

Current context:
- Project: {projectId}
- Conversation history: {conversationHistory}
- Available Scout data: {scoutDataContext}

Remember: You're not just answering questions - you're helping users discover fascinating stories they didn't know existed.
      `),
      HumanMessagePromptTemplate.fromTemplate("{userMessage}")
    ]);

    // Build the reasoning chain using LCEL
    this.reasoningChain = RunnableSequence.from([
      // Step 1: Analyze the user's intent and context
      RunnablePassthrough.assign({
        intent: (input: any) => this.analyzeUserIntent(input as ConversationContext),
        relevantData: (input: any) => this.retrieveRelevantData(input as ConversationContext)
      }),
      // Step 2: Generate reasoning steps
      RunnablePassthrough.assign({
        reasoning: (input: any) => this.generateReasoning(input)
      }),
      // Step 3: Craft the response
      this.systemPrompt,
      this.llm,
      new StringOutputParser()
    ]);

    console.log('🧠 Jordi LangChain Agent initialized');
  }

  async processMessage(
    projectId: string,
    message: string,
    userId: string
  ): Promise<JordiResponse> {
    console.log(`📨 Processing message with LangChain for project ${projectId}`);
    
    try {
      // Get or create memory for this project
      const memory = this.getProjectMemory(projectId);
      
      // Build context for the chain
      const context: ConversationContext = {
        projectId,
        userId,
        userMessage: message,
        conversationHistory: await this.getConversationHistory(memory),
        scoutDataContext: await this.getScoutContext(message)
      };

      // Run the reasoning chain
      const response = await this.reasoningChain.invoke(context);
      
      // Extract reasoning steps (we'll build this out more)
      const reasoning = [
        "Analyzing user intent and historical context",
        "Searching Scout data for relevant stories",
        "Identifying narrative connections",
        "Crafting engaging response"
      ];

      // Save to memory
      await memory.saveContext(
        { input: message }, 
        { output: response }
      );

      return {
        response: response.trim(),
        reasoning,
        artifacts: [], // We'll add artifact generation later
        tokenUsage: this.estimateTokenUsage(message, response)
      };
    } catch (error) {
      console.error('Error in LangChain processing:', error);
      
      // Fallback to ensure the system remains functional
      return {
        response: "I'm having trouble accessing my full capabilities right now, but I can still help you explore stories. What's on your mind?",
        reasoning: ["Error in processing, using fallback response"],
        artifacts: [],
        tokenUsage: 5
      };
    }
  }

  private async analyzeUserIntent(context: ConversationContext): Promise<string> {
    const message = context.userMessage.toLowerCase();
    
    // Detect intent categories
    if (message.includes('soldier') || message.includes('military')) {
      return 'seeking_military_stories';
    } else if (message.includes('documentary') || message.includes('film')) {
      return 'seeking_documentary_content';
    } else if (message.includes('dramatic') || message.includes('drama')) {
      return 'seeking_dramatic_stories';
    } else if (message.includes('murder') || message.includes('kill')) {
      return 'seeking_crime_stories';
    } else if (message.includes('disappear') || message.includes('missing')) {
      return 'seeking_missing_persons';
    } else if (message.includes('political') || message.includes('scandal')) {
      return 'seeking_political_stories';
    } else if (message.includes('another') || message.includes('different')) {
      return 'seeking_alternative_story';
    } else if (message.includes('yes') || message.includes('yeah') || message.includes('tell me more')) {
      return 'expanding_current_story';
    } else {
      return 'general_exploration';
    }
  }

  private async retrieveRelevantData(context: ConversationContext): Promise<string> {
    // This will be enhanced when we integrate with the Scout database
    // For now, return contextual information based on intent
    const intent = await this.analyzeUserIntent(context);
    
    switch (intent) {
      case 'seeking_military_stories':
        return "Limited military-focused content available. Most stories involve civilians with some veteran connections.";
      case 'seeking_documentary_content':
        return "Visual storytelling potential: missing persons patterns, location-based mysteries, archival footage possibilities.";
      case 'seeking_dramatic_stories':
        return "High emotional impact stories: personal tragedies, family mysteries, unexplained phenomena.";
      case 'seeking_crime_stories':
        return "Murder cases: locked room mysteries, impossible crimes, unsolved cases with strange evidence.";
      case 'seeking_missing_persons':
        return "Disappearance patterns: multiple victims, mysterious circumstances, unexplained evidence.";
      case 'seeking_political_stories':
        return "Corruption cases: reform candidates, suspicious deaths, missing evidence, cover-ups.";
      default:
        return "General archive: 1940s-1950s Atlanta mysteries, crimes, disappearances, political intrigue.";
    }
  }

  private async generateReasoning(input: any): Promise<string[]> {
    // Build reasoning based on intent and available data
    const reasoning = [
      `Detected intent: ${input.intent}`,
      `Available data: ${input.relevantData}`,
      "Selecting most compelling narrative approach",
      "Crafting response to build intrigue and engagement"
    ];
    
    return reasoning;
  }

  private getProjectMemory(projectId: string): ConversationSummaryBufferMemory {
    if (!this.memory.has(projectId)) {
      const memory = new ConversationSummaryBufferMemory({
        llm: this.llm,
        maxTokenLimit: 1000,
        returnMessages: true,
      });
      this.memory.set(projectId, memory);
    }
    return this.memory.get(projectId)!;
  }

  private async getConversationHistory(memory: ConversationSummaryBufferMemory): Promise<string> {
    const buffer = await memory.loadMemoryVariables({});
    return buffer.history || '';
  }

  private async getScoutContext(message: string): Promise<string> {
    // Placeholder for Scout data integration
    return "Scout analysis: 663 articles from 1940s-1950s Atlanta covering murders, disappearances, political scandals.";
  }

  private estimateTokenUsage(input: string, output: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil((input.length + output.length) / 4);
  }

  async clearMemory(projectId: string): Promise<void> {
    console.log(`🗑️ Clearing LangChain memory for project ${projectId}`);
    this.memory.delete(projectId);
  }

  async getScoutStats(): Promise<any> {
    return {
      totalArticles: 663,
      analyzedArticles: 663,
      interestingArticles: 663,
      discoveryRate: 100,
      langchainEnabled: true
    };
  }
}

export const jordiLangChainAgent = new JordiLangChainAgent(); 