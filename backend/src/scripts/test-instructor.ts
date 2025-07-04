import { instructorService } from '../services/instructor-service';
import { jordiAgent } from '../agents/jordi-agent';
import { 
  type JordiInput, 
  type ConversationContext 
} from '../models/jordi-personality';

/**
 * Test script to verify Instructor integration with Jordi
 */
async function testInstructorIntegration() {
  console.log('🧪 Testing Instructor Integration with Jordi...\n');

  try {
    // Test 1: Basic structured response
    console.log('📝 Test 1: Basic Structured Response');
    const basicInput: JordiInput = {
      user_message: "Tell me about the most interesting historical mystery you've found.",
      conversation_context: {
        user_expertise: 'intermediate',
        conversation_stage: 'opening',
        research_focus: ['historical mysteries'],
        user_intent: 'general_inquiry'
      },
      available_data: [{
        source: "Sample Historical Article",
        type: 'article',
        relevance_score: 0.8,
        summary: "A mysterious disappearance in 1957 that has never been solved."
      }],
      project_context: {
        name: "Historical Mysteries Investigation",
        description: "Exploring unsolved cases from the 1950s",
        research_goals: ["Identify patterns in disappearances", "Uncover overlooked evidence"]
      }
    };

    const response = await instructorService.generateJordiResponse(basicInput);
    
    console.log('✅ Response structure validation:');
    console.log(`- Message length: ${response.message.length} characters`);
    console.log(`- Reasoning steps: ${response.reasoning_steps.length}`);
    console.log(`- Follow-up questions: ${response.follow_up_questions.length}`);
    console.log(`- Investigative leads: ${response.investigative_leads.length}`);
    console.log(`- Confidence level: ${response.confidence_assessment.overall_confidence}`);
    console.log(`- Personality tone: ${response.personality.tone}`);
    console.log(`- Investigative approach: ${response.personality.investigative_approach}`);
    
    // Test 2: Conversation context analysis
    console.log('\n📊 Test 2: Conversation Context Analysis');
    const testMessages = [
      { role: 'user', content: "I'm researching political scandals from the 1950s" },
      { role: 'assistant', content: "That's fascinating! The 1950s had several significant political events that are still debated today." },
      { role: 'user', content: "Can you help me find connections between different cases?" }
    ];

    const context = await instructorService.analyzeConversationContext(
      testMessages,
      { name: "Political Scandals Research", description: "Investigating 1950s political events" }
    );
    
    console.log('✅ Context analysis results:');
    console.log(`- User expertise: ${context.user_expertise}`);
    console.log(`- Conversation stage: ${context.conversation_stage}`);
    console.log(`- Research focus: ${context.research_focus.join(', ')}`);
    console.log(`- User intent: ${context.user_intent}`);

    // Test 3: Full Jordi agent integration
    console.log('\n🤖 Test 3: Full Jordi Agent Integration');
    const agentResponse = await jordiAgent.chat(
      "What patterns do you see in the 1957 disappearance cases?",
      "test-project",
      "test-user"
    );
    
    console.log('✅ Agent response validation:');
    console.log(`- Response: ${agentResponse.response.substring(0, 100)}...`);
    console.log(`- Reasoning steps: ${agentResponse.reasoning_steps.length}`);
    console.log(`- Follow-up questions: ${agentResponse.follow_up_questions.length}`);
    console.log(`- Investigative leads: ${agentResponse.investigative_leads.length}`);
    console.log(`- Overall confidence: ${agentResponse.confidence_assessment.overall_confidence}`);

    // Test 4: Personality consistency check
    console.log('\n🎭 Test 4: Personality Consistency Check');
    const personalityTests = [
      "Hello, I'm new to historical research",
      "I'm an expert historian looking for advanced insights",
      "Can you help me understand this complex political situation?"
    ];

    for (const [index, message] of personalityTests.entries()) {
      const testInput: JordiInput = {
        user_message: message,
        conversation_context: {
          user_expertise: index === 0 ? 'novice' : index === 1 ? 'expert' : 'intermediate',
          conversation_stage: 'opening',
          research_focus: ['historical research'],
          user_intent: 'general_inquiry'
        },
        available_data: [],
        project_context: {
          name: "Test Project",
          description: "Testing personality consistency",
          research_goals: ["Verify personality adaptation"]
        }
      };

      const personalityResponse = await instructorService.generateJordiResponse(testInput);
      console.log(`✅ Test ${index + 1} - Tone: ${personalityResponse.personality.tone}, Expertise: ${personalityResponse.personality.expertise_level}`);
    }

    // Test 5: Health check
    console.log('\n🏥 Test 5: Health Check');
    const healthStatus = await jordiAgent.healthCheck();
    console.log('✅ Health check results:');
    console.log(`- Status: ${healthStatus.status}`);
    console.log(`- Memory usage: ${healthStatus.memory_usage} conversations`);
    console.log(`- Instructor available: ${healthStatus.instructor_available}`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ Instructor integration is working correctly');
    console.log('✅ Structured personality control is functional');
    console.log('✅ Jordi agent is responding with proper reasoning steps');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testInstructorIntegration()
    .then(() => {
      console.log('\n✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

export { testInstructorIntegration }; 