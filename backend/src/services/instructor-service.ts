import Instructor from '@instructor-ai/instructor';
import OpenAI from 'openai';
import { z } from 'zod';
import { 
  JordiResponseSchema, 
  JordiInputSchema, 
  ConversationContextSchema,
  type JordiResponse,
  type JordiInput,
  type ConversationContext
} from '../models/jordi-personality';

// OpenAI client configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Instructor client with structured output support
const instructor = Instructor({
  client: openai,
  mode: "TOOLS"
});

// Core personality instructions for Jordi
const JORDI_PERSONALITY_PROMPT = `
You are Jordi, an expert investigative research assistant specializing in discovering hidden narratives from historical records. 

PERSONALITY REQUIREMENTS:
- Always maintain a professional yet curious tone
- Show your analytical reasoning process step by step
- Be encouraging about the user's research journey
- Acknowledge uncertainty when appropriate
- Focus on investigative leads and connections

BEHAVIORAL GUIDELINES:
- Always provide visible reasoning steps
- Reference specific data sources when available
- Suggest follow-up questions to deepen investigation
- Identify potential research directions
- Assess confidence levels honestly
- Maintain consistency with your investigative researcher persona

RESPONSE STRUCTURE:
You must respond with a structured format that includes:
1. A clear, helpful message
2. Your personality traits for this response
3. Visible reasoning steps
4. Data sources used
5. Follow-up questions
6. Investigative leads
7. Confidence assessment with limitations
`;

export class InstructorService {
  /**
   * Generate a structured response from Jordi with personality control
   */
  async generateJordiResponse(input: JordiInput): Promise<JordiResponse> {
    try {
      // Build context-aware prompt
      const contextPrompt = this.buildContextPrompt(input);
      
      const response = await instructor.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: JORDI_PERSONALITY_PROMPT
          },
          {
            role: "user",
            content: contextPrompt
          }
        ],
        response_model: {
          schema: JordiResponseSchema,
          name: "JordiResponse"
        },
        max_tokens: 2000,
        temperature: 0.7,
      });

      // Validate the response maintains personality consistency
      this.validatePersonalityConsistency(response);

      return response;
    } catch (error) {
      console.error('Instructor service error:', error);
      throw new Error('Failed to generate structured response');
    }
  }

  /**
   * Analyze conversation context and suggest personality adjustments
   */
  async analyzeConversationContext(
    messages: Array<{role: string, content: string}>,
    project_context: any
  ): Promise<ConversationContext> {
    const contextAnalysisPrompt = `
    Analyze this conversation and determine:
    1. User expertise level (novice, intermediate, expert)
    2. Current conversation stage (opening, exploration, deep_dive, synthesis)
    3. Research focus areas
    4. User intent (general_inquiry, specific_research, story_development, fact_checking)
    
    Recent messages:
    ${messages.slice(-5).map(msg => `${msg.role}: ${msg.content}`).join('\n')}
    
    Project: ${project_context.name}
    `;

    const context = await instructor.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert conversation analyst. Analyze the conversation context accurately."
        },
        {
          role: "user",
          content: contextAnalysisPrompt
        }
      ],
      response_model: {
        schema: ConversationContextSchema,
        name: "ConversationContext"
      },
      max_tokens: 500,
      temperature: 0.3,
    });

    return context;
  }

  /**
   * Generate follow-up questions based on current conversation
   */
  async generateFollowUpQuestions(
    context: ConversationContext,
    recent_response: JordiResponse
  ): Promise<string[]> {
    const followUpSchema = z.object({
      questions: z.array(z.string()).describe("Relevant follow-up questions")
    });

    const prompt = `
    Based on this conversation context and recent response, generate 3-5 thoughtful follow-up questions
    that would help advance the investigative research.
    
    Context: ${JSON.stringify(context)}
    Recent response: ${recent_response.message}
    
    Focus on:
    - Deepening the investigation
    - Exploring new angles
    - Connecting different data points
    - Addressing gaps in knowledge
    `;

    const result = await instructor.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Generate insightful follow-up questions for investigative research."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_model: {
        schema: followUpSchema,
        name: "FollowUpQuestions"
      },
      max_tokens: 300,
      temperature: 0.8,
    });

    return result.questions;
  }

  /**
   * Build context-aware prompt for Jordi
   */
  private buildContextPrompt(input: JordiInput): string {
    const { user_message, conversation_context, available_data, project_context } = input;
    
    let prompt = `User Message: "${user_message}"\n\n`;
    
    prompt += `Project Context: ${project_context.name}\n`;
    prompt += `Description: ${project_context.description}\n`;
    prompt += `Research Goals: ${project_context.research_goals.join(', ')}\n\n`;
    
    prompt += `Conversation Context:\n`;
    prompt += `- User Expertise: ${conversation_context.user_expertise}\n`;
    prompt += `- Conversation Stage: ${conversation_context.conversation_stage}\n`;
    prompt += `- Research Focus: ${conversation_context.research_focus.join(', ')}\n`;
    prompt += `- User Intent: ${conversation_context.user_intent}\n\n`;
    
    if (available_data.length > 0) {
      prompt += `Available Data Sources:\n`;
      available_data.forEach((data, index) => {
        prompt += `${index + 1}. ${data.source} (${data.type}, relevance: ${data.relevance_score})\n`;
        prompt += `   Summary: ${data.summary}\n`;
      });
      prompt += '\n';
    }
    
    prompt += `Please provide a structured response that maintains your investigative researcher persona.`;
    
    return prompt;
  }

  /**
   * Validate that the response maintains personality consistency
   */
  private validatePersonalityConsistency(response: JordiResponse): void {
    // Check for required personality traits
    if (!response.personality) {
      throw new Error('Response missing personality traits');
    }

    // Ensure reasoning steps are present
    if (!response.reasoning_steps || response.reasoning_steps.length === 0) {
      throw new Error('Response missing reasoning steps');
    }

    // Validate confidence assessment
    if (!response.confidence_assessment) {
      throw new Error('Response missing confidence assessment');
    }

    // Ensure investigative elements are present
    if (!response.investigative_leads || response.investigative_leads.length === 0) {
      console.warn('Response missing investigative leads');
    }
  }
}

export const instructorService = new InstructorService(); 