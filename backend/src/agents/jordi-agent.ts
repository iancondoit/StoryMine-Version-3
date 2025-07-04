import { PrismaClient } from '../generated/prisma';
import { MistralService } from '../services/mistral-service';

const prisma = new PrismaClient();
const mistralService = new MistralService();

interface JordiResponse {
  response: string;
  reasoning: string[];
  artifacts: any[];
  tokenUsage: number;
}

export class JordiAgent {
  private projectMemory: Map<string, any> = new Map();

  constructor() {
    console.log('🧠 Jordi Agent initialized');
  }

  async processMessage(
    projectId: string,
    message: string,
    userId: string
  ): Promise<JordiResponse> {
    console.log(`📨 Processing message for project ${projectId}`);
    
    try {
      // Get project context
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          artifacts: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Get some Scout data for context
      const scoutData = await prisma.scoutAnalysis.findMany({
        where: { isInteresting: true },
        include: {
          article: {
            select: {
              title: true,
              content: true,
              date: true,
              publication: true
            }
          }
        },
        orderBy: { confidence: 'desc' },
        take: 3
      });

      // Build context for Mistral
      const context = this.buildContext(project, scoutData, message);
      
      // Get response from Mistral
      const mistralResponse = await mistralService.generateResponse(context);
      
      // Store in memory
      this.updateMemory(projectId, message, mistralResponse.content);
      
      return {
        response: mistralResponse.content,
        reasoning: mistralResponse.reasoning,
        artifacts: mistralResponse.artifacts,
        tokenUsage: mistralResponse.tokenUsage.total
      };
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Return a fallback response
      return {
        response: `I apologize, but I'm having trouble accessing my full capabilities right now. However, I can tell you that I'm designed to help you discover hidden narratives in historical records. 

Based on the sample data I have access to, I can see there were some interesting political tensions in 1957, including conflicts between civil rights organizations and state governments. 

What specific aspect of historical research would you like to explore? I can help you with:
- Analyzing historical events and their connections
- Identifying patterns in political and social movements  
- Exploring documentary potential in historical records
- Building timelines and narrative threads

Please let me know what interests you most!`,
        reasoning: ['Fallback response due to system limitations'],
        artifacts: [],
        tokenUsage: 50
      };
    }
  }

  private buildContext(project: any, scoutData: any[], message: string): string {
    let context = `You are Jordi, an AI investigative research assistant specializing in discovering hidden narratives from historical records.

Current Project: ${project.title}
Project Description: ${project.description}

Recent Artifacts:
${project.artifacts.map((artifact: any) => 
  `- ${artifact.type}: ${artifact.title}`
).join('\n')}

Sample Historical Data:
${scoutData.map(analysis => 
  `- ${analysis.article.title} (${analysis.article.date?.toLocaleDateString()}) - ${analysis.documentaryPotential} documentary potential`
).join('\n')}

User Message: ${message}

Please provide a thoughtful response that helps the user discover connections and narratives in historical data.`;

    return context;
  }



  private updateMemory(projectId: string, message: string, response: string): void {
    const memory = this.projectMemory.get(projectId) || { messages: [] };
    memory.messages.push(
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: response, timestamp: new Date().toISOString() }
    );
    this.projectMemory.set(projectId, memory);
  }

  private estimateTokenUsage(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  async clearMemory(projectId: string): Promise<void> {
    console.log(`🗑️ Clearing memory for project ${projectId}`);
    this.projectMemory.delete(projectId);
    
    // Also clear from database
    await prisma.conversation.deleteMany({
      where: { projectId }
    });
  }

  async saveMemoryToDatabase(projectId: string, userId: string): Promise<void> {
    const memory = this.projectMemory.get(projectId);
    if (!memory) return;

         try {
       // Find existing conversation
       const existing = await prisma.conversation.findFirst({
         where: { projectId, userId }
       });

       if (existing) {
         await prisma.conversation.update({
           where: { id: existing.id },
           data: {
             messages: JSON.stringify(memory.messages),
             context: JSON.stringify(memory.context || {}),
             updatedAt: new Date()
           }
         });
       } else {
         await prisma.conversation.create({
           data: {
             projectId,
             userId,
             messages: JSON.stringify(memory.messages),
             context: JSON.stringify(memory.context || {})
           }
         });
       }
     } catch (error) {
       console.error('Error saving memory to database:', error);
     }
  }

  async getScoutStats(): Promise<any> {
    try {
      const totalArticles = await prisma.sourceArticle.count();
      const analyzedArticles = await prisma.scoutAnalysis.count();
      const interestingArticles = await prisma.scoutAnalysis.count({
        where: { isInteresting: true }
      });

      return {
        totalArticles,
        analyzedArticles,
        interestingArticles,
        interestingPercentage: analyzedArticles > 0 ? 
          ((interestingArticles / analyzedArticles) * 100).toFixed(1) : '0'
      };
    } catch (error) {
      console.error('Error getting Scout stats:', error);
      return null;
    }
  }
}

export const jordiAgent = new JordiAgent(); 