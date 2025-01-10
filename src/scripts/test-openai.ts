import * as dotenv from 'dotenv';
import { join } from 'path';
import OpenAI from 'openai';

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

async function testOpenAI() {
  try {
    console.log('Testing OpenAI connection...');
    console.log('API Key found:', !!process.env.OPENAI_API_KEY);
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Try a simple completion with GPT-3.5-turbo
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: "Say hello!"
      }],
      max_tokens: 10
    });

    console.log('Response:', response.choices[0].message.content);
    console.log('\nAPI test successful! ✅');
  } catch (error) {
    console.error('API test failed:', error);
  }
}

testOpenAI(); 