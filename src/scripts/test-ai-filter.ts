import * as dotenv from 'dotenv';
import { join } from 'path';
import { Article } from '@/types';
import { isAIRelatedContent } from '../lib/ai/contentFilter';

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

// Add this debug line
console.log('Environment check:');
console.log('OpenAI API Key length:', process.env.OPENAI_API_KEY?.length);
console.log('OpenAI API Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 10));

async function testAIFilter() {
  console.log('Testing AI content filter...\n');
  console.log('OpenAI API Key found:', !!process.env.OPENAI_API_KEY);

  const testArticles: Article[] = [
    {
      title: "RBC and Cohere partner to develop AI solutions",
      summary: "Partnership focuses on generative AI for banking applications",
      publishDate: new Date().toISOString(),
      link: "https://test.com/1",
      source: "Test",
      bankCode: "RBC"
    },
    {
      title: "Bank announces new branch opening in Toronto",
      summary: "New location to serve growing community needs",
      publishDate: new Date().toISOString(),
      link: "https://test.com/2",
      source: "Test",
      bankCode: "RBC"
    },
    {
      title: "Digital transformation initiative launched",
      summary: "Bank modernizes systems with cloud technology",
      publishDate: new Date().toISOString(),
      link: "https://test.com/3",
      source: "Test",
      bankCode: "RBC"
    }
  ];

  try {
    for (const article of testArticles) {
      console.log(`\nTesting article: "${article.title}"`);
      const isAIRelated = await isAIRelatedContent(article);
      console.log(`Result: ${isAIRelated ? '✅ AI-related' : '❌ Not AI-related'}`);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAIFilter(); 