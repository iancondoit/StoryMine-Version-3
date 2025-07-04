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
  article_data?: {
    title: string;
    content: string;
    date: string;
    publication: string;
    source_url: string;
  };
}

interface SourceArticle {
  id: string;
  title: string;
  content: string;
  date?: string;
  year?: number;
  publication?: string;
  source_url?: string;
  confidence_score?: number;
  quality_score?: number;
  word_count?: number;
  tier?: number;
  collection?: string;
  source?: string;
}

async function importScoutData() {
  try {
    console.log('🚀 Starting Scout data import...');
    
    // Load Scout analysis results
    const scoutAnalysisPath = path.join(__dirname, '../../../../Scout to StoryMine/scout_complete_analysis.json');
    const scoutHocrPath = path.join(__dirname, '../../../../Scout to StoryMine/scout_hocr_articles.json');
    const scoutV3Path = path.join(__dirname, '../../../../Scout to StoryMine/scout_v3_articles.json');
    
    if (!fs.existsSync(scoutAnalysisPath)) {
      throw new Error(`Scout analysis file not found: ${scoutAnalysisPath}`);
    }
    
    if (!fs.existsSync(scoutHocrPath)) {
      throw new Error(`Scout HOCR file not found: ${scoutHocrPath}`);
    }
    
    if (!fs.existsSync(scoutV3Path)) {
      throw new Error(`Scout V3 file not found: ${scoutV3Path}`);
    }
    
    console.log('📊 Loading Scout analysis results...');
    const scoutData: ScoutData = JSON.parse(fs.readFileSync(scoutAnalysisPath, 'utf8'));
    
    console.log('📄 Loading HOCR articles...');
    const hocrData: { articles: SourceArticle[] } = JSON.parse(fs.readFileSync(scoutHocrPath, 'utf8'));
    
    console.log('📄 Loading V3 articles...');
    const v3Data: { articles: SourceArticle[] } = JSON.parse(fs.readFileSync(scoutV3Path, 'utf8'));
    
    // Create article lookup dictionary
    const articleLookup: { [key: string]: SourceArticle } = {};
    
    // Add HOCR articles
    hocrData.articles.forEach(article => {
      articleLookup[article.id] = article;
    });
    
    // Add V3 articles (may override HOCR if same ID)
    v3Data.articles.forEach(article => {
      articleLookup[article.id] = article;
    });
    
    console.log(`📚 Total articles available: ${Object.keys(articleLookup).length}`);
    console.log(`🔍 Total analysis results: ${scoutData.analysis_results.length}`);
    
    // Stats tracking
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    // Process each analysis result
    for (const analysis of scoutData.analysis_results) {
      try {
        const sourceArticle = articleLookup[analysis.article_id];
        
        if (!sourceArticle) {
          console.log(`⚠️  No source article found for ID: ${analysis.article_id}`);
          skipped++;
          continue;
        }
        
        // Skip very low quality articles
        if (sourceArticle.confidence_score !== undefined && sourceArticle.confidence_score < 10) {
          console.log(`⚠️  Skipping low quality article: ${sourceArticle.title} (confidence: ${sourceArticle.confidence_score})`);
          skipped++;
          continue;
        }
        
        // Check if article already exists
        const existingArticle = await prisma.sourceArticle.findUnique({
          where: { articleId: analysis.article_id }
        });
        
        if (existingArticle) {
          console.log(`⚠️  Article already exists: ${analysis.article_id}`);
          skipped++;
          continue;
        }
        
        // Clean and prepare data
        const cleanTitle = sourceArticle.title?.trim() || 'Untitled';
        const cleanContent = sourceArticle.content?.trim() || '';
        const cleanDate = sourceArticle.date || '';
        const publication = sourceArticle.publication || 'Atlanta Constitution';
        
        // Parse date safely
        let parsedDate: Date | null = null;
        if (cleanDate) {
          try {
            parsedDate = new Date(cleanDate);
            // Check if date is valid
            if (isNaN(parsedDate.getTime())) {
              parsedDate = null;
            }
          } catch (error) {
            parsedDate = null;
          }
        }
        
        // Create source article record
        const createdArticle = await prisma.sourceArticle.create({
          data: {
            articleId: analysis.article_id,
            title: cleanTitle,
            content: cleanContent,
            date: parsedDate,
            publication: publication,
            url: sourceArticle.source_url || '',
            metadata: JSON.stringify({
              confidence_score: sourceArticle.confidence_score || 0,
              word_count: sourceArticle.word_count || cleanContent.split(' ').length,
              tier: sourceArticle.tier || 1,
              collection: sourceArticle.collection || 'Historical',
              source: sourceArticle.source || 'hocr_dataset'
            })
          }
        });
        
        // Create Scout analysis record
        await prisma.scoutAnalysis.create({
          data: {
            articleId: createdArticle.id,
            isInteresting: analysis.is_interesting,
            confidence: analysis.confidence,
            narrativeStrength: analysis.narrative_strength,
            documentaryPotential: analysis.documentary_potential,
            reasoning: analysis.reasoning || '',
            unusualness: analysis.unusualness || '',
            emotionalEngagement: analysis.emotional_engagement || '',
            modernRelevance: analysis.modern_relevance || '',
            storyTypes: JSON.stringify(analysis.story_types || []),
            processingTimestamp: new Date(),
            scoutVersion: '1.0.0'
          }
        });
        
        imported++;
        
        if (imported % 50 === 0) {
          console.log(`📈 Progress: ${imported} articles imported...`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing article ${analysis.article_id}:`, error);
        errors++;
      }
    }
    
    console.log('\n✅ Import complete!');
    console.log(`📊 Statistics:`);
    console.log(`   - Imported: ${imported}`);
    console.log(`   - Skipped: ${skipped}`);
    console.log(`   - Errors: ${errors}`);
    console.log(`   - Total processed: ${imported + skipped + errors}`);
    
    // Final stats
    const totalArticles = await prisma.sourceArticle.count();
    const totalAnalysis = await prisma.scoutAnalysis.count();
    const interestingArticles = await prisma.scoutAnalysis.count({
      where: { isInteresting: true }
    });
    
    console.log(`\n📈 Final database stats:`);
    console.log(`   - Total articles: ${totalArticles}`);
    console.log(`   - Total analysis: ${totalAnalysis}`);
    console.log(`   - Interesting articles: ${interestingArticles}`);
    console.log(`   - Interesting rate: ${((interestingArticles / totalAnalysis) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importScoutData().catch(console.error); 