import { Router } from 'express';
import { PrismaClient } from '../generated/prisma';
import { JordiAgent } from '../agents/jordi-agent';
import { MistralService } from '../services/mistral-service';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const jordiAgent = new JordiAgent();
const mistralService = new MistralService();

// Request validation schemas
const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  projectId: z.string().min(1, 'Project ID is required'),
  userId: z.string().min(1, 'User ID is required')
});

const clearMemorySchema = z.object({
  projectId: z.string().min(1, 'Project ID is required')
});

// POST /api/jordi/chat - Send message to Jordi
router.post('/chat', async (req, res) => {
  try {
    const { message, projectId, userId } = chatRequestSchema.parse(req.body);

    // Verify project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: userId
      }
    });

    if (!project) {
      return res.status(404).json({
        error: 'Project not found or access denied'
      });
    }

    // Process message with Jordi
    const result = await jordiAgent.processMessage(projectId, message, userId);

    // Track token usage
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
    const stats = await prisma.scoutAnalysis.groupBy({
      by: ['documentaryPotential', 'unusualness', 'modernRelevance'],
      _count: {
        documentaryPotential: true
      }
    });

    const totalArticles = await prisma.sourceArticle.count();
    const analyzedArticles = await prisma.scoutAnalysis.count();
    const interestingArticles = await prisma.scoutAnalysis.count({
      where: { isInteresting: true }
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
        distributionStats: stats,
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
      storyType, 
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

    if (storyType) {
      searchConditions.storyTypes = {
        contains: storyType as string
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

    const results = await prisma.scoutAnalysis.findMany({
      where: searchConditions,
      include: {
        article: {
          select: {
            id: true,
            articleId: true,
            title: true,
            date: true,
            publication: true
          }
        }
      },
      orderBy: {
        confidence: 'desc'
      },
      take: Math.min(parseInt(limit as string) || 20, 100)
    });

    res.json({
      success: true,
      data: {
        results,
        count: results.length,
        query: req.query
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