#!/usr/bin/env node

/**
 * Test Kyvo Understanding (Stage 4)
 * Tests if AI understands the user based on their profile
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

async function testUnderstanding() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║         KYVO UNDERSTANDING TEST (Stage 4)                          ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  console.log('📋 Test Data:');
  console.log(`   User ID: ${testData.userId}`);
  console.log(`   Aspirations: ${testData.aspirations.join(', ')}`);
  console.log(`   Q&A Pairs: ${testData.questionsAndAnswers.length}\n`);

  console.log('📤 Calling generate-goals function with stage=4...\n');

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-goals`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testData,
          stage: 4  // Validation stage
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

    console.log('✅ AI Understanding Received!\n');
    console.log('═'.repeat(70));
    console.log('AI\'S UNDERSTANDING OF THE USER:');
    console.log('═'.repeat(70));
    console.log(result.understanding);
    console.log('═'.repeat(70));

    console.log('\n🎯 Analysis:');
    console.log('✓ Does AI understand the user\'s situation?');
    console.log('✓ Does AI identify their skills correctly?');
    console.log('✓ Does AI understand their challenges?');
    console.log('✓ Does AI know what goals would be suitable?');
    console.log('✓ Does AI understand how to break down aspirations into daily tasks?');

    console.log('\n💡 Next Step: If understanding looks good, we\'ll test goal generation (Stage 5)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '═'.repeat(70) + '\n');
}

testUnderstanding();
