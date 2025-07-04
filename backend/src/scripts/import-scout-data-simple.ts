import { PrismaClient } from '../generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ScoutData {
  processing_info: {
    total_articles: number;
    interesting_articles: number;
    processing_date: string;
    scout_version: string;
    model_used: string;
  };
  analysis_results: ScoutAnalysis[];
}

interface ScoutAnalysis {
  article_id: string;
  is_interesting: boolean;
  confidence: number;
  story_types: string[];
  narrative_strength: number;
  documentary_potential: string;
  reasoning: string;
  unusualness: string;
  emotional_engagement: string;
  modern_relevance: string;
  entities: any;
  relationships: any;
  article_data: {
    title: string;
    content: string;
    date: string;
    publication: string;
    page?: string;
    section?: string;
    url?: string;
  };
}

async function main() {
  console.log('🚀 Starting Scout data import...');
  
  // Read the Scout data file
  const scoutFilePath = path.join(__dirname, '../../../..', 'Scout to StoryMine', 'scout_complete_analysis.json');
  
  if (!fs.existsSync(scoutFilePath)) {
    console.error('❌ Scout data file not found at:', scoutFilePath);
    return;
  }
  
  console.log('📖 Reading Scout data file...');
  const scoutDataRaw = fs.readFileSync(scoutFilePath, 'utf8');
  const scoutData: ScoutData = JSON.parse(scoutDataRaw);
  
  console.log(`📊 Processing ${scoutData.processing_info.total_articles} articles...`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  // Clear existing data first
  console.log('🧹 Clearing existing Scout data...');
  await prisma.scoutAnalysis.deleteMany({});
  await prisma.sourceArticle.deleteMany({});
  
  // Process each article
  for (const analysis of scoutData.analysis_results) {
    try {
      // Create or update the source article
      const sourceArticle = await prisma.sourceArticle.upsert({
        where: { articleId: analysis.article_id },
        update: {
          title: analysis.article_data.title,
          content: analysis.article_data.content,
          date: analysis.article_data.date ? new Date(analysis.article_data.date) : null,
          publication: analysis.article_data.publication,
          page: analysis.article_data.page,
          section: analysis.article_data.section,
          url: analysis.article_data.url,
          metadata: JSON.stringify({
            imported: true,
            source: 'scout_complete_analysis.json'
          })
        },
        create: {
          articleId: analysis.article_id,
          title: analysis.article_data.title,
          content: analysis.article_data.content,
          date: analysis.article_data.date ? new Date(analysis.article_data.date) : null,
          publication: analysis.article_data.publication,
          page: analysis.article_data.page,
          section: analysis.article_data.section,
          url: analysis.article_data.url,
          metadata: JSON.stringify({
            imported: true,
            source: 'scout_complete_analysis.json'
          })
        }
      });
      
      // Create the Scout analysis
      await prisma.scoutAnalysis.create({
        data: {
          articleId: sourceArticle.id,
          isInteresting: analysis.is_interesting,
          confidence: analysis.confidence,
          narrativeStrength: analysis.narrative_strength,
          documentaryPotential: analysis.documentary_potential,
          reasoning: analysis.reasoning,
          unusualness: analysis.unusualness,
          emotionalEngagement: analysis.emotional_engagement,
          modernRelevance: analysis.modern_relevance,
          storyTypes: JSON.stringify(analysis.story_types),
          processingTimestamp: new Date(scoutData.processing_info.processing_date),
          scoutVersion: scoutData.processing_info.scout_version
        }
      });
      
      imported++;
      
      if (imported % 50 === 0) {
        console.log(`✅ Imported ${imported} articles...`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing article ${analysis.article_id}:`, error);
      errors++;
    }
  }
  
  console.log('\n🎉 Import completed!');
  console.log(`✅ Successfully imported: ${imported} articles`);
  console.log(`⚠️  Skipped: ${skipped} articles`);
  console.log(`❌ Errors: ${errors} articles`);
  
  // Show final statistics
  const stats = await prisma.scoutAnalysis.groupBy({
    by: ['isInteresting'],
    _count: {
      isInteresting: true
    }
  });
  
  console.log('\n📊 Final Statistics:');
  stats.forEach(stat => {
    console.log(`- ${stat.isInteresting ? 'Interesting' : 'Not interesting'}: ${stat._count.isInteresting} articles`);
  });
}

main()
  .then(() => {
    console.log('✅ Import process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Import process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  }); 