import fs from 'fs';
import path from 'path';
import { PrismaClient, DocumentaryPotential, Unusualness, EmotionalEngagement, ModernRelevance, EntityType } from '../generated/prisma';

const prisma = new PrismaClient();

interface ScoutData {
  processing_info: {
    total_articles: number;
    interesting_articles: number;
    processing_date: string;
    scout_version: string;
    model_used: string;
  };
  analysis_results: ScoutAnalysisResult[];
}

interface ScoutAnalysisResult {
  article_id: string;
  is_interesting: boolean;
  confidence: number;
  story_types: string[];
  narrative_strength: number;
  entities: {
    people: string[];
    places: string[];
    organizations: string[];
    events: string[];
  };
  relationships: string[];
  documentary_potential: 'YES' | 'MAYBE' | 'NO';
  reasoning: string;
  unusualness: 'ANOMALOUS' | 'NOTABLE' | 'ROUTINE';
  emotional_engagement: 'STRONG' | 'MODERATE' | 'WEAK';
  modern_relevance: 'HIGH' | 'MEDIUM' | 'LOW';
  processing_timestamp: string;
}

// Map Scout enums to Prisma enums
const mapDocumentaryPotential = (value: string): DocumentaryPotential => {
  switch (value) {
    case 'YES': return DocumentaryPotential.YES;
    case 'MAYBE': return DocumentaryPotential.MAYBE;
    case 'NO': return DocumentaryPotential.NO;
    default: return DocumentaryPotential.NO;
  }
};

const mapUnusualness = (value: string): Unusualness => {
  switch (value) {
    case 'ANOMALOUS': return Unusualness.ANOMALOUS;
    case 'NOTABLE': return Unusualness.NOTABLE;
    case 'ROUTINE': return Unusualness.ROUTINE;
    default: return Unusualness.ROUTINE;
  }
};

const mapEmotionalEngagement = (value: string): EmotionalEngagement => {
  switch (value) {
    case 'STRONG': return EmotionalEngagement.STRONG;
    case 'MODERATE': return EmotionalEngagement.MODERATE;
    case 'WEAK': return EmotionalEngagement.WEAK;
    default: return EmotionalEngagement.WEAK;
  }
};

const mapModernRelevance = (value: string): ModernRelevance => {
  switch (value) {
    case 'HIGH': return ModernRelevance.HIGH;
    case 'MEDIUM': return ModernRelevance.MEDIUM;
    case 'LOW': return ModernRelevance.LOW;
    default: return ModernRelevance.LOW;
  }
};

const mapEntityType = (type: string): EntityType => {
  switch (type.toLowerCase()) {
    case 'people': return EntityType.PERSON;
    case 'places': return EntityType.PLACE;
    case 'organizations': return EntityType.ORGANIZATION;
    case 'events': return EntityType.EVENT;
    default: return EntityType.CONCEPT;
  }
};

// Extract date from article ID if possible
const extractDateFromArticleId = (articleId: string): Date | null => {
  const match = articleId.match(/(\d{4}-\d{2}-\d{2})/);
  if (match && match[1]) {
    return new Date(match[1]);
  }
  return null;
};

// Extract publication info from article ID
const extractPublicationInfo = (articleId: string) => {
  // For now, we'll use a placeholder since we don't have the actual article content
  // In a real implementation, this would be extracted from the full article data
  return {
    publication: 'Unknown Publication',
    page: null,
    section: null
  };
};

async function importScoutData() {
  try {
    console.log('🚀 Starting Scout data import...');
    
    // Load Scout data
    const scoutDataPath = path.join(__dirname, '../../../Scout to StoryMine/scout_complete_analysis.json');
    const scoutDataRaw = fs.readFileSync(scoutDataPath, 'utf8');
    const scoutData: ScoutData = JSON.parse(scoutDataRaw);
    
    console.log(`📊 Processing ${scoutData.processing_info.total_articles} articles...`);
    
    // Track progress
    let processed = 0;
    let created = 0;
    let skipped = 0;
    const batchSize = 100;
    
    // Process story types first
    const storyTypes = new Set<string>();
    scoutData.analysis_results.forEach(result => {
      result.story_types.forEach(type => storyTypes.add(type));
    });
    
    console.log(`📝 Creating ${storyTypes.size} story types...`);
    for (const typeName of storyTypes) {
      await prisma.storyType.upsert({
        where: { name: typeName },
        update: {},
        create: {
          name: typeName,
          description: `Story type: ${typeName}`
        }
      });
    }
    
    // Process articles in batches
    const articles = scoutData.analysis_results;
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      
      for (const analysisResult of batch) {
        try {
          // Create or update source article
          const articleDate = extractDateFromArticleId(analysisResult.article_id);
          const publicationInfo = extractPublicationInfo(analysisResult.article_id);
          
          const sourceArticle = await prisma.sourceArticle.upsert({
            where: { articleId: analysisResult.article_id },
            update: {},
            create: {
              articleId: analysisResult.article_id,
              title: `Article ${analysisResult.article_id}`, // Placeholder title
              content: 'Content not yet imported', // Placeholder content
              date: articleDate,
              publication: publicationInfo.publication,
              page: publicationInfo.page,
              section: publicationInfo.section,
              metadata: {
                originalId: analysisResult.article_id,
                imported: true,
                source: 'Scout'
              }
            }
          });
          
          // Create Scout analysis
          const scoutAnalysis = await prisma.scoutAnalysis.create({
            data: {
              articleId: sourceArticle.id,
              isInteresting: analysisResult.is_interesting,
              confidence: analysisResult.confidence,
              narrativeStrength: analysisResult.narrative_strength,
              documentaryPotential: mapDocumentaryPotential(analysisResult.documentary_potential),
              reasoning: analysisResult.reasoning,
              unusualness: mapUnusualness(analysisResult.unusualness),
              emotionalEngagement: mapEmotionalEngagement(analysisResult.emotional_engagement),
              modernRelevance: mapModernRelevance(analysisResult.modern_relevance),
              processingTimestamp: new Date(analysisResult.processing_timestamp),
              scoutVersion: scoutData.processing_info.scout_version
            }
          });
          
          // Link story types
          for (const storyTypeName of analysisResult.story_types) {
            const storyType = await prisma.storyType.findUnique({
              where: { name: storyTypeName }
            });
            
            if (storyType) {
              await prisma.scoutStoryType.create({
                data: {
                  analysisId: scoutAnalysis.id,
                  storyTypeId: storyType.id
                }
              });
            }
          }
          
          // Process entities
          const entityTypes = ['people', 'places', 'organizations', 'events'] as const;
          for (const entityType of entityTypes) {
            const entities = analysisResult.entities[entityType];
            for (const entityName of entities) {
              if (entityName && entityName.trim()) {
                // Create or get entity
                const entity = await prisma.entity.upsert({
                  where: { name: entityName },
                  update: {},
                  create: {
                    name: entityName,
                    type: mapEntityType(entityType),
                    description: `${entityType.slice(0, -1)}: ${entityName}`,
                    metadata: {
                      source: 'Scout',
                      type: entityType
                    }
                  }
                });
                
                // Link entity to article
                await prisma.articleEntity.upsert({
                  where: {
                    articleId_entityId: {
                      articleId: sourceArticle.id,
                      entityId: entity.id
                    }
                  },
                  update: {},
                  create: {
                    articleId: sourceArticle.id,
                    entityId: entity.id,
                    context: `Found in ${entityType}`,
                    relevance: analysisResult.confidence
                  }
                });
              }
            }
          }
          
          // Process relationships
          for (const relationship of analysisResult.relationships) {
            if (relationship && relationship.trim()) {
              // For now, create a generic relationship entity
              const relationshipEntity = await prisma.entity.upsert({
                where: { name: relationship },
                update: {},
                create: {
                  name: relationship,
                  type: EntityType.CONCEPT,
                  description: `Relationship: ${relationship}`,
                  metadata: {
                    source: 'Scout',
                    type: 'relationship'
                  }
                }
              });
              
              await prisma.scoutRelationship.create({
                data: {
                  analysisId: scoutAnalysis.id,
                  entityId: relationshipEntity.id,
                  relationship: relationship,
                  confidence: analysisResult.confidence
                }
              });
            }
          }
          
          created++;
          
        } catch (error) {
          console.error(`❌ Error processing article ${analysisResult.article_id}:`, error);
          skipped++;
        }
        
        processed++;
        
        if (processed % 50 === 0) {
          console.log(`📈 Progress: ${processed}/${articles.length} articles processed`);
        }
      }
    }
    
    console.log('✅ Import complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Total processed: ${processed}`);
    console.log(`   - Successfully created: ${created}`);
    console.log(`   - Skipped/errors: ${skipped}`);
    console.log(`   - Story types created: ${storyTypes.size}`);
    
    // Print some statistics
    const stats = await prisma.scoutAnalysis.groupBy({
      by: ['documentaryPotential'],
      _count: {
        documentaryPotential: true
      }
    });
    
    console.log('\n📈 Documentary Potential Distribution:');
    stats.forEach(stat => {
      console.log(`   - ${stat.documentaryPotential}: ${stat._count.documentaryPotential}`);
    });
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importScoutData().catch(console.error); 