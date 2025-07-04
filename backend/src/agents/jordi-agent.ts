import { PrismaClient } from '../generated/prisma';
// import { MistralService } from '../services/mistral-service'; // Temporarily disabled - keeping conversation simple

const prisma = new PrismaClient();
// const mistralService = new MistralService(); // Temporarily disabled

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
      // Handle greetings following the interaction guide
      const greetingPattern = /^(hi|hello|hey)\s*\.?$/i;
      if (greetingPattern.test(message.trim())) {
        return {
          response: "Hey there. I can help you find and explore stories — or dig into something you're curious about. What's on your mind?",
          reasoning: ["Greeting detected"],
          artifacts: [],
          tokenUsage: 1
        };
      }

      // Handle specific topic queries following the interaction guide
      const messageText = message.toLowerCase().trim();
      
      // Murder queries
      if (messageText.includes('murder') && messageText.split(' ').length <= 3) {
        return {
          response: "That opens up a lot of possibilities. Want something sensational, tragic, or unresolved?",
          reasoning: ["Topic query about murder"],
          artifacts: [],
          tokenUsage: 1
        };
      }

      // Disappearance queries
      if (messageText.includes('disappear') || messageText.includes('missing')) {
        return {
          response: "Plenty of eerie ones. A city councilman vanished on the way to a meeting in 1948 — no body, no note. Should I dig into that one?",
          reasoning: ["Topic query about disappearances"],
          artifacts: [],
          tokenUsage: 1
        };
      }

      // General story queries
      if (messageText.includes('what kind of stories') || messageText.includes('what stories do you have')) {
        return {
          response: "Right now I'm loaded with material from the Atlanta Journal-Constitution — mostly covering 1940s and 1950s. Some of it's pretty wild: murders, scandals, missing persons, public coverups. Want to narrow it down?",
          reasoning: ["General story inquiry"],
          artifacts: [],
          tokenUsage: 1
        };
      }

      // Police corruption queries
      if (messageText.includes('police corruption') || messageText.includes('police') && messageText.includes('corruption')) {
        return {
          response: "I've seen some odd articles from the '50s involving beatings, bribes, and a few trials. Want me to start lining up a timeline?",
          reasoning: ["Query about police corruption"],
          artifacts: [],
          tokenUsage: 1
        };
      }

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
      let searchQuery = '';
      
      // Create a more targeted search based on the message content
      if (messageText.includes('murder')) {
        searchQuery = 'murder';
      } else if (messageText.includes('disappear') || messageText.includes('missing')) {
        searchQuery = 'missing';
      } else if (messageText.includes('political') || messageText.includes('scandal')) {
        searchQuery = 'political';
      } else if (messageText.includes('police')) {
        searchQuery = 'police';
      } else {
        // Fallback to broader keyword search
        const keywords = message.toLowerCase().match(/\b(war|civil rights|politics|political|naacp|georgia|congress|military|social|economic|investigation|scandal|conflict|government|court|election|bomb|attack|britain|africa|house|senate|tax|levy|women|commander|medal|service|murder|crime|mystery|unusual|anomalous)\b/g) || [];
        searchQuery = keywords.length > 0 ? keywords.join(' ') : '';
      }
      
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

      // TODO: Re-enable Mistral later - for now, provide simple conversational responses
      // const context = this.buildContext(project, scoutData, message);
      // const mistralResponse = await mistralService.generateResponse(context);
      
      // Create a simple conversational response based on Scout data
      const conversationalResponse = this.createConversationalResponse(message, scoutData);
      
      // Store in memory
      this.updateMemory(projectId, message, conversationalResponse.response);
      
      return {
        response: conversationalResponse.response,
        reasoning: conversationalResponse.reasoning,
        artifacts: [], // No artifacts for now - keeping content in conversation
        tokenUsage: conversationalResponse.tokenUsage
      };
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Provide a simple fallback response following the interaction guide
      return {
        response: "I'm having trouble accessing my full capabilities right now, but I can still help you explore stories. What's on your mind?",
        reasoning: ['Fallback response - system limitations'],
        artifacts: [],
        tokenUsage: 5
      };
    }
  }

  private createConversationalResponse(message: string, scoutData: any[]): {
    response: string;
    reasoning: string[];
    tokenUsage: number;
  } {
    // If no data found, provide a gentle response
    if (scoutData.length === 0) {
      return {
        response: "I'm not finding much on that specific angle right now. Want to try a different approach or topic?",
        reasoning: ["No relevant Scout data found"],
        tokenUsage: 5
      };
    }

    // Get a few interesting articles to mention conversationally
    const interestingArticles = scoutData.slice(0, 3);
    
    let response = "";
    const messageText = message.toLowerCase();

    // Handle different types of queries conversationally
    if (messageText.includes('murder') && messageText.includes('mysterious')) {
      // Filter for actual murder-related articles
      const murderArticles = interestingArticles.filter(analysis => 
        analysis.article.title.toLowerCase().includes('murder') ||
        analysis.article.title.toLowerCase().includes('kill') ||
        analysis.article.title.toLowerCase().includes('death') ||
        analysis.article.title.toLowerCase().includes('found dead') ||
        analysis.storyTypes?.toLowerCase().includes('crime')
      );
      
      if (murderArticles.length > 0) {
        response = "I've got some intriguing unsolved cases from the Atlanta archives. ";
        
        const firstCase = murderArticles[0];
        const year = firstCase.article.date ? new Date(firstCase.article.date).getFullYear() : 'unknown year';
        response += `There's a ${year} case that really caught my attention - ${firstCase.article.title.replace(/"/g, '')}. `;
        
        if (murderArticles.length > 1) {
          response += `Plus a couple other mysterious deaths from that era. `;
        }
        
        response += "Want me to dig deeper into any of these?";
      } else {
        response = "I don't see any obvious murder mysteries in what I'm finding right now. Want me to search for suspicious deaths or unexplained disappearances instead?";
      }
    } else if (messageText.includes('political') || messageText.includes('scandal')) {
      response = "The political scene in 1940s-50s Atlanta had its share of drama. ";
      
      if (interestingArticles.length > 0) {
        const firstArticle = interestingArticles[0];
        const year = firstArticle.article.date ? new Date(firstArticle.article.date).getFullYear() : 'that era';
        response += `One case from ${year} involved ${firstArticle.article.title.toLowerCase().replace(/"/g, '')}. `;
        response += "Should I pull more details on that one?";
      } else {
        response += "Should I search for more specific political incidents?";
      }
    } else {
      // General response with story samples
      response = `I found ${scoutData.length} articles that might interest you. `;
      
      if (interestingArticles.length > 0) {
        const firstArticle = interestingArticles[0];
        const year = firstArticle.article.date ? new Date(firstArticle.article.date).getFullYear() : 'the period';
        response += `One from ${year} caught my eye: ${firstArticle.article.title.replace(/"/g, '')}. `;
        
        if (interestingArticles.length > 1) {
          response += `There are a couple others from that era too. `;
        }
      }
      
      response += "What angle interests you most?";
    }

    return {
      response,
      reasoning: [`Found ${scoutData.length} relevant articles`, "Generated conversational response"],
      tokenUsage: 10
    };
  }

  private buildContext(project: any, scoutData: any[], message: string): string {
    let context = `You are Jordi, a warm, calm, and insightful story researcher. You are a conversational partner, not a search engine. You are a research assistant, not a trivia bot. You are a thinking agent, not a static interface.

CORE PRINCIPLES:
- Keep communication natural and lightweight
- Always nudge toward action or inquiry
- Gate expensive operations (tokens) behind user intent
- Think out loud, but don't dump content unless asked
- Surface insight, not just data
- Be calm and direct (no exclamation marks unless mimicking a source)
- Speak like a collaborator: "Want me to check?" not "Here's 47 headlines"
- Use soft nudges, not assumptions: "Should I start an artifact?" not "Here's a full analysis"
- Never drop a wall of headlines or data

You have access to material from the Atlanta Journal-Constitution, mostly covering 1940s and 1950s: murders, scandals, missing persons, public coverups.

CONVERSATION EXAMPLES:
- User: "What about murder?" → "That opens up a lot of possibilities. Want something sensational, tragic, or unresolved?"
- User: "Tell me about disappearances." → "Plenty of eerie ones. A city councilman vanished on the way to a meeting in 1948 — no body, no note. Should I dig into that one?"
- User: "What kind of stories do you have?" → "Right now I'm loaded with material from the Atlanta Journal-Constitution — mostly covering 1940s and 1950s. Some of it's pretty wild: murders, scandals, missing persons, public coverups. Want to narrow it down?"

ALWAYS ASK BEFORE:
- Archive sweeps
- Article set pulls  
- Artifact generation (timeline, narrative thread, crosswalk)
- Any token-heavy operations

Current Project: ${project.title}
Available Data: ${scoutData.length} relevant articles from 1940s-1950s
User Message: ${message}

Respond conversationally, offer light story leads, and nudge toward productive exploration. Keep it natural and collaborative.`;

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