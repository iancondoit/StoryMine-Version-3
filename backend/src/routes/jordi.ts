import { Router } from 'express';
import { PrismaClient } from '../generated/prisma';
import { JordiAgent } from '../agents/jordi-agent';
import { jordiLangChainAgent } from '../agents/jordi-langchain-agent';
import { MistralService } from '../services/mistral-service';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const jordiAgent = new JordiAgent();
const mistralService = new MistralService();

// Request schemas
const chatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  projectId: z.string().optional(),
  userId: z.string().default('demo-user') // For development
});

const clearMemorySchema = z.object({
  projectId: z.string()
});

// POST /api/jordi/chat - Send message to Jordi with structured personality control
router.post('/chat', async (req, res) => {
  try {
    const { message, projectId = 'default', userId } = chatSchema.parse(req.body);

    // Handle demo user case - look up by email if userId is 'demo-user'
    let actualUserId = userId;
    if (userId === 'demo-user') {
      const demoUser = await prisma.user.findFirst({
        where: { email: 'demo@storymine.com' }
      });
      
      if (!demoUser) {
        return res.status(404).json({
          error: 'Demo user not found',
          message: 'Please contact support'
        });
      }
      actualUserId = demoUser.id;
    }

    // Check user's token balance
    const tokenBalance = await prisma.tokenBalance.findUnique({
      where: { userId: actualUserId }
    });

    if (!tokenBalance || tokenBalance.balance < 10) {
      return res.status(402).json({
        error: 'Insufficient tokens',
        message: 'Please purchase more tokens to continue'
      });
    }

    // Process message with Instructor-enhanced Jordi
    const result = await jordiAgent.chat(message, projectId, actualUserId);

    // Estimate token usage (improved calculation)
    const estimatedTokens = Math.ceil(
      (message.length + result.response.length + 
       result.reasoning_steps.length * 50) / 4
    );

    // Track token usage with structured metadata
    await prisma.tokenUsage.create({
      data: {
        userId: actualUserId,
        tokensUsed: estimatedTokens,
        operation: 'jordi_instructor_conversation',
        projectId,
        metadata: JSON.stringify({
          message: message.substring(0, 100),
          reasoning_steps: result.reasoning_steps.length,
          follow_up_questions: result.follow_up_questions.length,
          investigative_leads: result.investigative_leads.length,
          confidence: result.confidence_assessment.overall_confidence,
          instructor_enabled: true
        })
      }
    });

    // Update user's token balance
    await prisma.tokenBalance.update({
      where: { userId: actualUserId },
      data: {
        totalUsed: {
          increment: estimatedTokens
        },
        balance: {
          decrement: estimatedTokens
        },
        lastUsed: new Date()
      }
    });

    return res.json({
      success: true,
      data: {
        response: result.response,
        reasoning_steps: result.reasoning_steps,
        follow_up_questions: result.follow_up_questions,
        investigative_leads: result.investigative_leads,
        confidence_assessment: result.confidence_assessment,
        tokenUsage: estimatedTokens,
        instructor_enabled: true
      }
    });

  } catch (error) {
    console.error('Error in Jordi chat:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: error.errors
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/jordi/chat-langchain - Send message to Jordi using LangChain
router.post('/chat-langchain', async (req, res) => {
  try {
    const { message, projectId = 'default', userId } = chatSchema.parse(req.body);

    // Handle demo user case - look up by email if userId is 'demo-user'
    let actualUserId = userId;
    if (userId === 'demo-user') {
      const demoUser = await prisma.user.findFirst({
        where: { email: 'demo@storymine.com' }
      });
      
      if (!demoUser) {
        return res.status(404).json({
          error: 'Demo user not found',
          message: 'Please contact support'
        });
      }
      actualUserId = demoUser.id;
    }

    // Check user's token balance
    const tokenBalance = await prisma.tokenBalance.findUnique({
      where: { userId: actualUserId }
    });

    if (!tokenBalance || tokenBalance.balance < 10) {
      return res.status(402).json({
        error: 'Insufficient tokens',
        message: 'Please purchase more tokens to continue'
      });
    }

    // Process message with LangChain Jordi
    const result = await jordiLangChainAgent.processMessage(projectId, message, actualUserId);

    // Track token usage
    await prisma.tokenUsage.create({
      data: {
        userId: actualUserId,
        tokensUsed: result.tokenUsage,
        operation: 'jordi_langchain_conversation',
        projectId,
        metadata: JSON.stringify({
          message: message.substring(0, 100), // First 100 chars for reference
          artifactsGenerated: result.artifacts.length,
          reasoningSteps: result.reasoning.length,
          langchainEnabled: true
        })
      }
    });

    // Update user's token balance
    await prisma.tokenBalance.update({
      where: { userId: actualUserId },
      data: {
        totalUsed: {
          increment: result.tokenUsage
        },
        balance: {
          decrement: result.tokenUsage
        },
        lastUsed: new Date()
      }
    });

    return res.json({
      success: true,
      data: {
        response: result.response,
        reasoning: result.reasoning,
        artifacts: result.artifacts,
        tokenUsage: result.tokenUsage,
        langchainEnabled: true
      }
    });

  } catch (error) {
    console.error('Error in Jordi LangChain chat:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: error.errors
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/jordi/health - Check Jordi health status with Instructor integration
router.get('/health', async (req, res) => {
  try {
    const mistralStatus = await mistralService.checkModelAvailability();
    const dbStatus = await prisma.$queryRaw`SELECT 1` ? true : false;
    const jordiHealthStatus = await jordiAgent.healthCheck();

    res.json({
      success: true,
      data: {
        mistral: mistralStatus,
        database: dbStatus,
        jordi: jordiHealthStatus,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error checking Jordi health:', error);
    res.status(500).json({
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/jordi/clear-memory - Clear conversation memory for a project
router.post('/clear-memory', async (req, res) => {
  try {
    const { projectId } = clearMemorySchema.parse(req.body);
    
    // Use demo user for clear memory - could be enhanced to accept userId
    const demoUser = await prisma.user.findFirst({
      where: { email: 'demo@storymine.com' }
    });
    
    if (!demoUser) {
      return res.status(404).json({
        error: 'Demo user not found',
        message: 'Please contact support'
      });
    }

    await jordiAgent.clearMemory(projectId, demoUser.id);

    return res.json({
      success: true,
      message: 'Memory cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing memory:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: error.errors
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/jordi/scout/stats - Get Scout data statistics
router.get('/scout/stats', async (req, res) => {
  try {
    // Get basic counts using the correct model names
    const totalArticles = await prisma.sourceArticle.count();
    const analyzedArticles = await prisma.scoutAnalysis.count();
    const interestingArticles = await prisma.scoutAnalysis.count({
      where: { isInteresting: true }
    });

    // Get distribution stats using the correct fields
    const documentaryPotentialStats = await prisma.scoutAnalysis.groupBy({
      by: ['documentaryPotential'],
      _count: {
        documentaryPotential: true
      }
    });

    const unusualnessStats = await prisma.scoutAnalysis.groupBy({
      by: ['unusualness'],
      _count: {
        unusualness: true
      }
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalArticles,
          analyzedArticles,
          interestingArticles,
          interestingPercentage: analyzedArticles > 0 ? ((interestingArticles / analyzedArticles) * 100).toFixed(1) : '0'
        },
        documentaryPotential: documentaryPotentialStats,
        unusualness: unusualnessStats,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching Scout stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/jordi/scout/search - Search Scout data
router.get('/scout/search', async (req, res) => {
  try {
    const { 
      query, 
      documentaryPotential, 
      minConfidence, 
      startDate, 
      endDate,
      limit = 20 
    } = req.query;

    const searchConditions: any = {};

    if (query) {
      searchConditions.article = {
        OR: [
          { title: { contains: query as string } },
          { content: { contains: query as string } }
        ]
      };
    }

    if (documentaryPotential) {
      searchConditions.documentaryPotential = documentaryPotential;
    }

    if (minConfidence) {
      searchConditions.confidence = {
        gte: parseFloat(minConfidence as string)
      };
    }

    if (startDate || endDate) {
      searchConditions.article = {
        ...searchConditions.article,
        date: {
          ...(startDate && { gte: new Date(startDate as string) }),
          ...(endDate && { lte: new Date(endDate as string) })
        }
      };
    }

    const analyses = await prisma.scoutAnalysis.findMany({
      where: searchConditions,
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
      take: parseInt(limit as string),
      orderBy: { confidence: 'desc' }
    });

    res.json({
      success: true,
      data: {
        results: analyses,
        count: analyses.length
      }
    });
  } catch (error) {
    console.error('Error searching Scout data:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 