#!/usr/bin/env node

/**
 * Test Kyvo Goal Generation (Stage 5)
 * Tests if AI generates specific, actionable daily goals
 */

const SUPABASE_URL = 'https://aikobdjkiioxqiqtffyc.supabase.co';

const testData = {
  userId: '7d561dc8-222c-41a3-911a-737d7a00014e',
  aspirations: ['Financial Growth', 'Career Development', 'Health & Fitness'],
  questionsAndAnswers: [
    { 
      question: 'What is your current job or profession?', 
      answer: 'Software Developer with 3 years experience' 
    },
    { 
      question: 'What skills do you currently have?', 
      answer: 'JavaScript, React, Node.js, Python, SQL' 
    },
    { 
      question: 'How much time can you dedicate daily?', 
      answer: '2-3 hours after work' 
    },
    { 
      question: 'What is your current fitness level?', 
      answer: 'Beginner, can do 10 push-ups, no running experience' 
    },
    { 
      question: 'What is your biggest financial goal?', 
      answer: 'Earn extra income through freelancing or side projects' 
    },
    { 
      question: 'What is your current income?', 
      answer: '$60,000 per year' 
    },
    { 
      question: 'What are your biggest challenges?', 
      answer: 'Time management, staying consistent, lack of direction' 
    },
    { 
      question: 'What motivates you most?', 
      answer: 'Building something meaningful and earning more money' 
    },
    { 
      question: 'Do you have any health issues?', 
      answer: 'No, just out of shape' 
    },
    { 
      question: 'What is your learning style?', 
      answer: 'Hands-on, learning by doing projects' 
    }
  ]
};

async function testGoalGeneration() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║         KYVO GOAL GENERATION TEST (Stage 5)                        ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  console.log('📋 Test Data:');
  console.log(`   User ID: ${testData.userId}`);
  console.log(`   Aspirations: ${testData.aspirations.join(', ')}`);
  console.log(`   Q&A Pairs: ${testData.questionsAndAnswers.length}\n`);

  console.log('📤 Calling generate-goals function with stage=5...\n');

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-goals`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testData,
          stage: 5  // Goal generation stage
        }),
      }
    );

    console.log(`📥 Response Status: ${response.status}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', errorText);
      return;
    }

    const result = await response.json();

    if (!result.success) {
      console.error('❌ Request failed:', result.error);
      return;
    }

    console.log('✅ Goals Generated!\n');
    console.log('═'.repeat(70));
    console.log('GENERATED DAILY GOALS:');
    console.log('═'.repeat(70));

    result.goals.forEach((goal, index) => {
      console.log(`\n🎯 Goal ${index + 1}: ${goal.title}`);
      console.log(`   📝 Description: ${goal.description}`);
      console.log(`   🏷️  Category: ${goal.category}`);
      console.log(`   ⚡ Difficulty: ${goal.difficulty}`);
      console.log(`   ⏱️  Estimated Time: ${goal.estimatedTime} minutes`);
      console.log(`   🎪 Aspiration: ${goal.aspiration}`);
      console.log(`   💬 Coaching: ${goal.coaching}`);
    });

    console.log('\n' + '═'.repeat(70));
    console.log('\n🎯 Analysis:');
    console.log('✓ Are goals specific with exact numbers/types?');
    console.log('✓ Are goals actionable TODAY?');
    console.log('✓ Are goals personalized to user\'s situation?');
    console.log('✓ Are goals first steps toward aspirations?');
    console.log('✓ Do goals avoid vague words (research, learn, explore)?');
    console.log('✓ Are goals realistic and achievable?');

    console.log('\n✨ Goal generation test complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '═'.repeat(70) + '\n');
}

testGoalGeneration();
