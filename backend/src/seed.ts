import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample user
  const user = await prisma.user.create({
    data: {
      email: 'demo@storymine.com',
      password: 'demo123', // In real app, this would be hashed
      name: 'Demo User',
      avatar: null
    }
  });

  console.log('👤 Created user:', user.email);

  // Create token balance for user
  await prisma.tokenBalance.create({
    data: {
      userId: user.id,
      balance: 1000,
      totalPurchased: 1000,
      totalUsed: 0
    }
  });

  console.log('💰 Created token balance');

  // Create sample project
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      title: 'The 1957 Political Mysteries',
      description: 'Investigating political events and personalities from 1957',
      status: 'ACTIVE',
      isExclusive: false,
      memoryOn: true
    }
  });

  console.log('📁 Created project:', project.title);

  // Create sample artifacts
  await prisma.artifact.create({
    data: {
      projectId: project.id,
      title: 'June 1957 Timeline',
      content: `## Timeline: June 1957 Political Events

**June 8, 1957**
- Congress debates foreign aid allocations
- Unexpected funding for Latin-American aid programs
- Military assistance to Communist Yugoslavia approved

**June 22, 1957** 
- Georgia imposes 11-year tax levy on NAACP
- Significant escalation in civil rights tensions
- State government vs. civil rights organization conflict

**Key Questions:**
- What drove the Yugoslavia aid decision?
- How did the NAACP respond to Georgia's actions?
- Were these events connected to broader Cold War strategy?`,
      type: 'TIMELINE',
      metadata: JSON.stringify({
        dateRange: '1957-06-01 to 1957-06-30',
        sources: ['Congressional Records', 'Georgia State Archives'],
        confidence: 0.85
      }),
      isPinned: true
    }
  });

  await prisma.artifact.create({
    data: {
      projectId: project.id,
      title: 'NAACP vs Georgia: Power Struggle Analysis',
      content: `## Narrative Thread: Civil Rights Under Siege

The 11-year tax levy imposed on the NAACP by Georgia represents a calculated strategy to financially cripple civil rights organizations. This wasn't just about taxes - it was about systematic dismantling of opposition.

**Key Players:**
- Georgia State Government
- NAACP Leadership  
- Federal Civil Rights Advocates

**The Pattern:**
1. Legal harassment through taxation
2. Financial pressure to force closure
3. Removal of civil rights infrastructure

**Modern Parallels:**
This strategy of using administrative and financial tools to suppress opposition movements has been repeated throughout history and continues today.

**Documentary Potential: HIGH**
- Strong emotional engagement
- Clear protagonist/antagonist dynamic
- Relevant to contemporary civil rights issues`,
      type: 'NARRATIVE_THREAD',
      metadata: JSON.stringify({
        theme: 'Civil Rights Suppression',
        emotionalWeight: 'High',
        modernRelevance: 'High',
        documentaryPotential: 'YES'
      }),
      isPinned: false
    }
  });

  console.log('📄 Created sample artifacts');

  // Create sample Scout articles
  const article1 = await prisma.sourceArticle.create({
    data: {
      articleId: 'hocr_1957-06-08_89_302_08',
      title: 'Congress Approves Foreign Aid Package',
      content: 'Congressional debate reveals unexpected allocations for Latin-American aid and military assistance to Communist Yugoslavia. The decision marks a significant shift in foreign policy priorities during the Cold War era.',
      date: new Date('1957-06-08'),
      publication: 'Washington Herald',
      page: '1',
      section: 'Politics',
      metadata: JSON.stringify({
        source: 'StoryDredge Archive',
        digitizationDate: '2024-01-15',
        ocrConfidence: 0.92
      })
    }
  });

  await prisma.scoutAnalysis.create({
    data: {
      articleId: article1.id,
      isInteresting: true,
      confidence: 0.8,
      narrativeStrength: 4,
      documentaryPotential: 'YES',
      reasoning: 'The article highlights political decisions regarding foreign aid, including unexpected allocations for Latin-American aid and military assistance to Communist Yugoslavia. This political intrigue and the implications for international relations could make for a compelling documentary exploring the complexities of foreign policy during that era.',
      unusualness: 'NOTABLE',
      emotionalEngagement: 'MODERATE',
      modernRelevance: 'MEDIUM',
      storyTypes: JSON.stringify(['POLITICAL', 'CONFLICT']),
      processingTimestamp: new Date('2025-07-02T16:34:52.824Z'),
      scoutVersion: '1.0.0'
    }
  });

  const article2 = await prisma.sourceArticle.create({
    data: {
      articleId: 'hocr_1957-06-22_90_6_20',
      title: 'Georgia Imposes Tax Levy on NAACP',
      content: 'In a dramatic escalation of tensions, Georgia state government has imposed an 11-year tax levy on the NAACP, marking a significant confrontation between state authorities and civil rights organizations.',
      date: new Date('1957-06-22'),
      publication: 'Atlanta Constitution',
      page: '1',
      section: 'State News',
      metadata: JSON.stringify({
        source: 'StoryDredge Archive',
        digitizationDate: '2024-01-15',
        ocrConfidence: 0.89
      })
    }
  });

  await prisma.scoutAnalysis.create({
    data: {
      articleId: article2.id,
      isInteresting: true,
      confidence: 0.9,
      narrativeStrength: 4,
      documentaryPotential: 'YES',
      reasoning: 'The article about Georgia imposing an 11-year tax levy on the NAACP suggests a significant conflict between the organization and the state government, highlighting social and political tensions of the time. This event could provide a compelling narrative for a documentary, showcasing the struggles faced by civil rights organizations and their impact on society.',
      unusualness: 'NOTABLE',
      emotionalEngagement: 'STRONG',
      modernRelevance: 'HIGH',
      storyTypes: JSON.stringify(['POLITICAL', 'CONFLICT', 'SOCIAL']),
      processingTimestamp: new Date('2025-07-02T16:34:47.143Z'),
      scoutVersion: '1.0.0'
    }
  });

  console.log('📰 Created sample Scout articles and analyses');

  // Create sample conversation
  await prisma.conversation.create({
    data: {
      projectId: project.id,
      userId: user.id,
      messages: JSON.stringify([
        {
          role: 'user',
          content: 'What can you tell me about political tensions in 1957?',
          timestamp: '2025-07-04T00:30:00.000Z'
        },
        {
          role: 'assistant', 
          content: 'Based on the historical records I\'ve analyzed, 1957 was a particularly tense year politically. I\'ve found evidence of significant civil rights conflicts, particularly the Georgia state government\'s aggressive actions against the NAACP, and some intriguing foreign policy decisions regarding Yugoslavia. Would you like me to explore any of these threads deeper?',
          timestamp: '2025-07-04T00:30:15.000Z'
        }
      ]),
      context: JSON.stringify({
        currentFocus: 'Political tensions in 1957',
        entitiesOfInterest: ['NAACP', 'Georgia', 'Yugoslavia'],
        lastQueries: ['political tensions 1957']
      })
    }
  });

  console.log('💬 Created sample conversation');

  console.log('\n✅ Database seeded successfully!');
  console.log(`👤 Demo user: ${user.email} (password: demo123)`);
  console.log(`📁 Sample project: "${project.title}"`);
  console.log(`📰 ${await prisma.sourceArticle.count()} articles loaded`);
  console.log(`💰 Token balance: 1,000 tokens`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 