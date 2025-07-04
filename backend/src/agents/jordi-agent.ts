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

      // Get diverse Scout data for context based on message keywords
      const keywords = message.toLowerCase().match(/\b(war|civil rights|politics|political|naacp|georgia|congress|military|social|economic|investigation|scandal|conflict|government|court|election|bomb|attack|britain|africa|house|senate|tax|levy|women|commander|medal|service|murder|crime|mystery|unusual|anomalous)\b/g) || [];
      const searchQuery = keywords.length > 0 ? keywords.join(' ') : '';
      
      const scoutData = await this.searchScoutData(searchQuery);
      
      // If no specific results, get a diverse sample
      if (scoutData.length === 0) {
        const diverseData = await prisma.scoutAnalysis.findMany({
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
          orderBy: [
            { confidence: 'desc' },
            { narrativeStrength: 'desc' }
          ],
          take: 15
        });
        scoutData.push(...diverseData);
      }

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
      
      // Try to provide a useful fallback response with actual data
      try {
        // Check if the user is asking about something specific
        // Extract key terms for better search
        const keywords = message.toLowerCase().match(/\b(war|civil rights|politics|political|naacp|georgia|congress|military|social|economic|investigation|scandal|conflict|government|court|election|bomb|attack|britain|africa|house|senate|tax|levy|women|commander|medal|service)\b/g) || [];
        const searchQuery = keywords.length > 0 ? keywords.join(' ') : '';
        
        const searchResults = await this.searchScoutData(searchQuery);
        
        if (searchResults.length > 0) {
          // User seems to be asking about something we have data for
          let response = `Great question! I found ${searchResults.length} relevant articles that caught my attention:

`;
          
          searchResults.slice(0, 5).forEach((analysis, index) => {
            const date = analysis.article.date ? new Date(analysis.article.date).getFullYear() : 'Unknown';
            const potentialText = analysis.documentaryPotential === 'YES' ? '🎬 High documentary potential' : 
                                  analysis.documentaryPotential === 'MAYBE' ? '📽️ Some documentary potential' : 
                                  '📄 Interesting for context';
            
            response += `**${index + 1}. "${analysis.article.title}" (${date})**
${potentialText} • ${analysis.article.publication}
`;
            
            if (analysis.reasoning && analysis.reasoning.length > 50) {
              const reasoning = analysis.reasoning.substring(0, 120);
              response += `💡 *${reasoning}${reasoning.length === 120 ? '...' : ''}*

`;
            }
          });

          if (searchResults.length > 5) {
            response += `...and ${searchResults.length - 5} more articles I could explore!

`;
          }

          response += `What catches your eye? I can dive deeper into any of these stories, look for connections between them, or search for different angles on this topic. What would you find most interesting?`;

          return {
            response,
            reasoning: [`Found ${searchResults.length} relevant articles in database`, 'Fallback mode - full AI capabilities unavailable'],
            artifacts: [],
            tokenUsage: 60
          };
        } else {
          // No specific search results, provide general overview
          const stats = await this.getScoutStats();
          const interestingArticles = await prisma.scoutAnalysis.findMany({
            where: { isInteresting: true },
            include: {
              article: {
                select: {
                  title: true,
                  date: true,
                  publication: true
                }
              }
            },
            orderBy: { confidence: 'desc' },
            take: 3
          });

          let response = `I apologize, but I'm having trouble accessing my full capabilities right now. However, I can still help you explore the historical data I have access to.

**Current Dataset:**`;

          if (stats) {
            response += `
- ${stats.totalArticles} total articles analyzed
- ${stats.interestingArticles} articles identified as particularly interesting (${stats.interestingPercentage}%)
- Articles span various historical periods and topics`;
          }

          if (interestingArticles.length > 0) {
            response += `

**Some interesting articles I can help you explore:**`;
            interestingArticles.forEach((analysis, index) => {
              const date = analysis.article.date ? new Date(analysis.article.date).getFullYear() : 'Unknown';
              response += `
${index + 1}. "${analysis.article.title}" (${date}) - ${analysis.article.publication}`;
            });
          }

          response += `

**What I can help you with:**
- Analyzing historical events and their connections
- Identifying patterns in political and social movements  
- Exploring documentary potential in historical records
- Building timelines and narrative threads
- Searching through analyzed articles by topic, time period, or theme

What specific aspect of historical research would you like to explore? I can search through the available data to find relevant articles and patterns.`;

          return {
            response,
            reasoning: ['Fallback response with actual database content'],
            artifacts: [],
            tokenUsage: 75
          };
        }
      } catch (fallbackError) {
        console.error('Fallback response also failed:', fallbackError);
        
        return {
          response: `I apologize, but I'm having trouble accessing my full capabilities right now. However, I can tell you that I'm designed to help you discover hidden narratives in historical records. 

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
  }

  private buildContext(project: any, scoutData: any[], message: string): string {
    let context = `You are Jordi, a friendly and curious AI investigative research assistant. You love digging into historical mysteries and helping people discover fascinating stories from the past.

You have access to ${scoutData.length} relevant articles about various historical events from the 1940s-1950s, including WWII, civil rights movements, political developments, and human interest stories.

Your personality:
- Conversational and engaging, like talking to a knowledgeable friend
- Curious about patterns and connections in history
- Excited to share interesting discoveries
- Ask follow-up questions to understand what the user finds most intriguing
- Use natural language, not academic jargon

Current Project: ${project.title}
Project Description: ${project.description}

Available Historical Data (${scoutData.length} articles):
${scoutData.slice(0, 12).map(analysis => 
  `- "${analysis.article.title}" (${analysis.article.date ? new Date(analysis.article.date).getFullYear() : 'Unknown'}) - ${analysis.documentaryPotential === 'YES' ? 'High' : analysis.documentaryPotential === 'MAYBE' ? 'Medium' : 'Low'} documentary potential`
).join('\n')}${scoutData.length > 12 ? `\n...and ${scoutData.length - 12} more articles` : ''}

User Message: ${message}

Respond conversationally and help the user explore these historical narratives. If they're asking about topics, suggest specific articles or themes they might find interesting. Generate artifacts when it would help visualize patterns or connections.`;

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

  async searchScoutData(query: string): Promise<any[]> {
    try {
      let searchResults;
      
      if (!query || query.trim().length === 0) {
        // If no specific query, return a diverse sample of interesting articles
        searchResults = await prisma.scoutAnalysis.findMany({
          where: {
            isInteresting: true,
            documentaryPotential: {
              in: ['YES', 'MAYBE']
            }
          },
          include: {
            article: {
              select: {
                title: true,
                date: true,
                publication: true,
                content: true
              }
            }
          },
          orderBy: [
            { confidence: 'desc' },
            { narrativeStrength: 'desc' }
          ],
          take: 30
        });
      } else {
        // Search with keywords (SQLite case-insensitive search)
        searchResults = await prisma.scoutAnalysis.findMany({
          where: {
            OR: [
              {
                article: {
                  title: {
                    contains: query
                  }
                }
              },
              {
                article: {
                  content: {
                    contains: query
                  }
                }
              },
              {
                reasoning: {
                  contains: query
                }
              },
              {
                storyTypes: {
                  contains: query
                }
              }
            ]
          },
          include: {
            article: {
              select: {
                title: true,
                date: true,
                publication: true,
                content: true
              }
            }
          },
          orderBy: { confidence: 'desc' },
          take: 25
        });
      }

      return searchResults;
    } catch (error) {
      console.error('Error searching Scout data:', error);
      return [];
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