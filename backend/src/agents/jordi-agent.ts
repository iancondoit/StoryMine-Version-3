import { PrismaClient } from '../generated/prisma';
import { instructorService } from '../services/instructor-service';
import { 
  type JordiResponse, 
  type JordiInput, 
  type ConversationContext 
} from '../models/jordi-personality';

const prisma = new PrismaClient();

interface ConversationMemory {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  context: ConversationContext | null;
  research_focus: string[];
  entity_tracking: Map<string, number>;
}

interface ScoutData {
  articles: Array<{
    id: string;
    title: string;
    summary: string;
    relevance_score: number;
  }>;
  entities: Array<{
    name: string;
    type: string;
    relevance_score: number;
  }>;
}

export class JordiAgent {
  private memory: Map<string, ConversationMemory> = new Map();
  private maxMemorySize = 20;

  /**
   * Main chat method with structured personality control
   */
  async chat(
    message: string,
    projectId: string,
    userId: string
  ): Promise<{
    response: string;
    reasoning_steps: Array<{
      step_number: number;
      description: string;
      type: string;
      confidence: number;
    }>;
    follow_up_questions: string[];
    investigative_leads: string[];
    confidence_assessment: {
      overall_confidence: number;
      reasoning: string;
      limitations: string[];
    };
  }> {
    try {
      // Get or create conversation memory
      const conversationKey = `${projectId}-${userId}`;
      let memory = this.memory.get(conversationKey);
      
      if (!memory) {
        memory = {
          messages: [],
          context: null,
          research_focus: [],
          entity_tracking: new Map()
        };
        this.memory.set(conversationKey, memory);
      }

      // Add user message to memory
      memory.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // Get project context
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          artifacts: {
            select: {
              id: true,
              title: true,
              type: true,
              content: true
            }
          }
        }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Analyze conversation context using Instructor
      const conversationContext = await instructorService.analyzeConversationContext(
        memory.messages,
        {
          name: project.title,
          description: project.description || '',
          research_goals: [project.title] // Simple goal for now
        }
      );

      // Update memory context
      memory.context = conversationContext;

      // Query Scout data based on message
      const scoutData = await this.queryScoutData(message, projectId);

      // Build structured input for Instructor
      const jordiInput: JordiInput = {
        user_message: message,
        conversation_context: conversationContext,
        available_data: scoutData.articles.map(article => ({
          source: article.title,
          type: 'article' as const,
          relevance_score: article.relevance_score,
          summary: article.summary
        })),
        project_context: {
          name: project.title,
          description: project.description || '',
          research_goals: [project.title]
        }
      };

      // Generate response - try Instructor first, fallback if needed
      let jordiResponse: any;
      try {
        jordiResponse = await instructorService.generateJordiResponse(jordiInput);
      } catch (instructorError) {
        console.log('Instructor service unavailable, using fallback response');
        
        // Create fallback response with Scout data
        let responseMessage = '';
        if (scoutData.articles.length > 0) {
          responseMessage = `I've found ${scoutData.articles.length} relevant articles from 1940s-50s Atlanta that match your query. Here are some promising leads:\n\n`;
          
          // Use the actual article content, not just titles
          scoutData.articles.slice(0, 3).forEach((article, index) => {
            responseMessage += `${index + 1}. **${article.title}**\n`;
            responseMessage += `   ${article.summary}\n\n`;
          });
          
          responseMessage += `These articles from the Scout database could provide excellent documentary material. Which of these stories would you like me to investigate further?`;
        } else {
          responseMessage = 'I searched through 568 analyzed articles from 1940s-50s Atlanta but didn\'t find specific matches for your query. Let me try a broader search approach.';
        }
          
        jordiResponse = {
          message: responseMessage,
          reasoning_steps: [{
            step_number: 1,
            description: `Searched Scout database for keywords: ${this.extractKeywords(message).join(', ')}`,
            type: 'analysis',
            confidence: 0.8
          }, {
            step_number: 2,
            description: `Found ${scoutData.articles.length} relevant articles with content analysis`,
            type: 'evidence_review',
            confidence: 0.9
          }],
          follow_up_questions: scoutData.articles.length > 0 ? [
            "Which of these stories interests you most?",
            "Would you like me to look for connections between these stories?",
            "Are you interested in the social context of these events?"
          ] : [
            "What specific topics or themes should I search for?",
            "Are you interested in crime, politics, social issues, or other areas?"
          ],
          investigative_leads: scoutData.articles.slice(0, 3).map(a => `Deep dive: ${a.title}`),
          confidence_assessment: {
            overall_confidence: scoutData.articles.length > 0 ? 0.8 : 0.5,
            reasoning: `Working with historical Scout data from 568 analyzed articles, found ${scoutData.articles.length} relevant matches`,
            limitations: ["Limited to available historical records", "Analysis based on text patterns", "Some articles may have incomplete content"]
          }
        };
      }

      // Add assistant message to memory
      memory.messages.push({
        role: 'assistant',
        content: jordiResponse.message,
        timestamp: new Date()
      });

      // Store conversation in database
      await this.storeConversation(projectId, userId, message, jordiResponse.message);

      // Update research focus based on response
      this.updateResearchFocus(memory, jordiResponse);

      // Maintain memory size
      this.maintainMemorySize(memory);

      return {
        response: jordiResponse.message,
        reasoning_steps: jordiResponse.reasoning_steps,
        follow_up_questions: jordiResponse.follow_up_questions,
        investigative_leads: jordiResponse.investigative_leads,
        confidence_assessment: jordiResponse.confidence_assessment
      };

    } catch (error) {
      console.error('Jordi Agent error:', error);
      
      // Fallback response with basic personality
      return {
        response: "I apologize, but I'm having trouble processing your request right now. Let me try to help you with what I can gather from our conversation so far.",
        reasoning_steps: [{
          step_number: 1,
          description: "Encountered technical difficulty, providing fallback response",
          type: "analysis",
          confidence: 0.3
        }],
        follow_up_questions: ["Could you rephrase your question?", "What specific aspect would you like me to focus on?"],
        investigative_leads: ["Technical issue to investigate", "User query context to review"],
        confidence_assessment: {
          overall_confidence: 0.3,
          reasoning: "Technical error occurred during processing",
          limitations: ["Unable to access full analytical capabilities", "Limited context processing"]
        }
      };
    }
  }

  /**
   * Query Scout data for relevant context
   */
  private async queryScoutData(message: string, projectId: string): Promise<ScoutData> {
    try {
      // Simple keyword extraction for now
      const keywords = this.extractKeywords(message);
      
      // Query articles that might be relevant (SQLite doesn't support mode: 'insensitive')
      const searchConditions: any[] = [];
      keywords.forEach(keyword => {
        searchConditions.push(
          { title: { contains: keyword } },
          { title: { contains: keyword.toUpperCase() } },
          { title: { contains: keyword.toLowerCase() } },
          { content: { contains: keyword } },
          { content: { contains: keyword.toUpperCase() } },
          { content: { contains: keyword.toLowerCase() } }
        );
      });

      const articles = await prisma.sourceArticle.findMany({
        where: {
          OR: searchConditions
        },
        include: {
          scoutAnalysis: true
        },
        take: 10
      });

      // Convert to ScoutData format
      const scoutData: ScoutData = {
        articles: articles.map((article: any) => ({
          id: article.id,
          title: article.title || 'Untitled Article',
          summary: article.content ? article.content.substring(0, 300) + '...' : 'No content available',
          relevance_score: article.scoutAnalysis?.confidence || 0.5
        })),
        entities: [] // Could be expanded later
      };

      console.log(`Found ${articles.length} relevant articles for keywords: ${keywords.join(', ')}`);
      
      return scoutData;
    } catch (error) {
      console.error('Scout data query error:', error);
      return { articles: [], entities: [] };
    }
  }

  /**
   * Extract keywords from user message
   */
  private extractKeywords(message: string): string[] {
    // Simple keyword extraction - could be improved with NLP
    const words = message.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Remove common words
    const commonWords = ['that', 'this', 'with', 'have', 'will', 'from', 'they', 'been', 'said', 'each', 'which', 'there', 'what', 'were', 'could', 'would', 'should'];
    
    return words.filter(word => !commonWords.includes(word));
  }

  /**
   * Store conversation in database
   */
  private async storeConversation(
    projectId: string,
    userId: string,
    userMessage: string,
    assistantMessage: string
  ): Promise<void> {
    try {
      // Ensure project exists, create if it doesn't
      await prisma.project.upsert({
        where: { id: projectId },
        update: {},
        create: {
          id: projectId,
          title: `Project ${projectId}`,
          description: 'Auto-created project',
          userId,
          status: 'ACTIVE'
        }
      });

      // Create conversation
      await prisma.conversation.create({
        data: {
          projectId,
          userId,
          messages: JSON.stringify([
            { role: 'user', content: userMessage, timestamp: new Date() },
            { role: 'assistant', content: assistantMessage, timestamp: new Date() }
          ])
        }
      });
    } catch (error) {
      console.error('Failed to store conversation:', error);
      // Don't throw - conversation storage is not critical
    }
  }

  /**
   * Update research focus based on Jordi's response
   */
  private updateResearchFocus(memory: ConversationMemory, response: JordiResponse): void {
    // Add investigative leads to research focus
    response.investigative_leads.forEach(lead => {
      if (!memory.research_focus.includes(lead)) {
        memory.research_focus.push(lead);
      }
    });

    // Keep only recent focus areas
    if (memory.research_focus.length > 10) {
      memory.research_focus = memory.research_focus.slice(-10);
    }
  }

  /**
   * Maintain memory size limits
   */
  private maintainMemorySize(memory: ConversationMemory): void {
    if (memory.messages.length > this.maxMemorySize) {
      // Keep system messages and recent messages
      const systemMessages = memory.messages.filter(msg => msg.role === 'system');
      const recentMessages = memory.messages.slice(-this.maxMemorySize + systemMessages.length);
      memory.messages = [...systemMessages, ...recentMessages];
    }
  }

  /**
   * Clear conversation memory for a project
   */
  async clearMemory(projectId: string, userId: string): Promise<void> {
    const conversationKey = `${projectId}-${userId}`;
    this.memory.delete(conversationKey);
  }

  /**
   * Get conversation history
   */
  getConversationHistory(projectId: string, userId: string): Array<{role: string, content: string, timestamp: Date}> {
    const conversationKey = `${projectId}-${userId}`;
    const memory = this.memory.get(conversationKey);
    return memory?.messages || [];
  }

  /**
   * Get current research focus
   */
  getResearchFocus(projectId: string, userId: string): string[] {
    const conversationKey = `${projectId}-${userId}`;
    const memory = this.memory.get(conversationKey);
    return memory?.research_focus || [];
  }

  /**
   * Health check for the agent
   */
  async healthCheck(): Promise<{
    status: string;
    memory_usage: number;
    instructor_available: boolean;
  }> {
    try {
      // Test Instructor service
      const testInput: JordiInput = {
        user_message: "Hello, this is a test",
        conversation_context: {
          user_expertise: 'novice',
          conversation_stage: 'opening',
          research_focus: [],
          user_intent: 'general_inquiry'
        },
        available_data: [],
        project_context: {
          name: "Test Project",
          description: "Test description",
          research_goals: ["Test goal"]
        }
      };

      await instructorService.generateJordiResponse(testInput);

      return {
        status: 'healthy',
        memory_usage: this.memory.size,
        instructor_available: true
      };
    } catch (error) {
      return {
        status: 'degraded',
        memory_usage: this.memory.size,
        instructor_available: false
      };
    }
  }
}

export const jordiAgent = new JordiAgent(); 