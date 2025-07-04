import { Router } from 'express';
import { PrismaClient } from '../generated/prisma';
import { JordiAgent } from '../agents/jordi-agent';
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

// POST /api/jordi/chat - Send message to Jordi
router.post('/chat', async (req, res) => {
  try {
    const { message, projectId = 'default', userId } = chatSchema.parse(req.body);

    // Check user's token balance
    const tokenBalance = await prisma.tokenBalance.findUnique({
      where: { userId }
    });

    if (!tokenBalance || tokenBalance.balance < 10) {
      return res.status(402).json({
        error: 'Insufficient tokens',
        message: 'Please purchase more tokens to continue'
      });
    }

    // Process message with Jordi
    const result = await jordiAgent.processMessage(projectId, message, userId);

    // Track token usage - Fix metadata type issue
    await prisma.tokenUsage.create({
      data: {
        userId,
        tokensUsed: result.tokenUsage,
        operation: 'jordi_conversation',
        projectId,
        metadata: JSON.stringify({
          message: message.substring(0, 100), // First 100 chars for reference
          artifactsGenerated: result.artifacts.length,
          reasoningSteps: result.reasoning.length
        })
      }
    });

    // Update user's token balance
    await prisma.tokenBalance.update({
      where: { userId },
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

    // Save conversation to database
    await jordiAgent.saveMemoryToDatabase(projectId, userId);

    return res.json({
      success: true,
      data: {
        response: result.response,
        reasoning: result.reasoning,
        artifacts: result.artifacts,
        tokenUsage: result.tokenUsage
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

// GET /api/jordi/health - Check Jordi health status
router.get('/health', async (req, res) => {
  try {
    const mistralStatus = await mistralService.checkModelAvailability();
    const dbStatus = await prisma.$queryRaw`SELECT 1` ? true : false;

    res.json({
      success: true,
      data: {
        mistral: mistralStatus,
        database: dbStatus,
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

    await jordiAgent.clearMemory(projectId);

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