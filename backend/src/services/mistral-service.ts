import { Ollama } from "@langchain/community/llms/ollama";
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";

interface MistralConfig {
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface JordiResponse {
  content: string;
  reasoning: string[];
  artifacts: Array<{
    type: string;
    title: string;
    content: string;
  }>;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export class MistralService {
  private ollama: Ollama;
  private config: MistralConfig;

  constructor(config?: Partial<MistralConfig>) {
    this.config = {
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      model: process.env.MISTRAL_MODEL || "mistral",
      temperature: 0.7,
      maxTokens: 4000,
      ...config
    };

    this.ollama = new Ollama({
      baseUrl: this.config.baseUrl,
      model: this.config.model,
      temperature: this.config.temperature,
    });
  }

  async generateResponse(
    prompt: string,
    context?: string,
    previousMessages?: BaseMessage[]
  ): Promise<JordiResponse> {
    try {
      const systemPrompt = this.buildSystemPrompt();
      const fullPrompt = this.buildFullPrompt(prompt, context, previousMessages);

      const response = await this.ollama.invoke(fullPrompt);
      
      // Parse the response to extract reasoning and artifacts
      const parsedResponse = this.parseJordiResponse(response);
      
      return {
        content: parsedResponse.content,
        reasoning: parsedResponse.reasoning,
        artifacts: parsedResponse.artifacts,
        tokenUsage: {
          prompt: this.estimateTokens(fullPrompt),
          completion: this.estimateTokens(response),
          total: this.estimateTokens(fullPrompt + response)
        }
      };
    } catch (error) {
      console.error('Error generating Mistral response:', error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildSystemPrompt(): string {
    return `You are Jordi, an investigative research agent for StoryMine. You help users discover hidden narratives from historical archives.

Your capabilities:
- Analyze historical articles and documents
- Identify narrative threads and connections
- Generate research artifacts (timelines, crosswalks, hypothesis trees)
- Provide transparent reasoning for your analysis
- Surface compelling stories from archival data

Response format:
Always structure your responses with:
1. Clear reasoning steps (marked with ✅, 🔍, 🧠 icons)
2. Specific findings and observations
3. Artifact recommendations when appropriate

Show your thinking process transparently. Users trust you because they can see how you reach conclusions.

When generating artifacts, use this format:
[Artifact: TYPE - TITLE]
Content here...
[/Artifact]

Available artifact types:
- Timeline: Chronological sequence of events
- Narrative Thread: Connected story elements
- Source Crosswalk: Comparison across sources
- Hypothesis Tree: Branching investigation paths
- Entity Profile: Person, place, or organization analysis
- Summary: Key findings synthesis`;
  }

  private buildFullPrompt(
    prompt: string,
    context?: string,
    previousMessages?: BaseMessage[]
  ): string {
    const systemPrompt = this.buildSystemPrompt();
    
    let conversationHistory = '';
    if (previousMessages && previousMessages.length > 0) {
      conversationHistory = '\n\nConversation History:\n' + 
        previousMessages.map(msg => `${msg._getType()}: ${msg.content}`).join('\n');
    }

    let contextSection = '';
    if (context) {
      contextSection = `\n\nProject Context:\n${context}`;
    }

    return `${systemPrompt}${conversationHistory}${contextSection}

User Request: ${prompt}

Please provide a detailed response with clear reasoning steps and any relevant artifacts.`;
  }

  private parseJordiResponse(response: string): {
    content: string;
    reasoning: string[];
    artifacts: Array<{
      type: string;
      title: string;
      content: string;
    }>;
  } {
    const reasoning: string[] = [];
    const artifacts: Array<{
      type: string;
      title: string;
      content: string;
    }> = [];

    // Extract reasoning steps (lines starting with ✅, 🔍, 🧠)
    const reasoningPattern = /^[✅🔍🧠].*$/gm;
    const reasoningMatches = response.match(reasoningPattern);
    if (reasoningMatches) {
      reasoning.push(...reasoningMatches);
    }

    // Extract artifacts
    const artifactPattern = /\[Artifact: ([^-]+) - ([^\]]+)\](.*?)\[\/Artifact\]/gs;
    let artifactMatch;
    while ((artifactMatch = artifactPattern.exec(response)) !== null) {
      if (artifactMatch[1] && artifactMatch[2] && artifactMatch[3]) {
        artifacts.push({
          type: artifactMatch[1].trim(),
          title: artifactMatch[2].trim(),
          content: artifactMatch[3].trim()
        });
      }
    }

    // Clean the content by removing artifact blocks
    const cleanContent = response
      .replace(/\[Artifact:.*?\[\/Artifact\]/gs, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    return {
      content: cleanContent,
      reasoning,
      artifacts
    };
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.ollama.invoke("Hello");
      return true;
    } catch (error) {
      console.error('Mistral health check failed:', error);
      return false;
    }
  }

  // Method to check if Mistral model is available
  async checkModelAvailability(): Promise<{
    available: boolean;
    model: string;
    error?: string;
  }> {
    try {
      const isHealthy = await this.healthCheck();
      return {
        available: isHealthy,
        model: this.config.model
      };
    } catch (error) {
      return {
        available: false,
        model: this.config.model,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export a singleton instance
export const mistralService = new MistralService(); 