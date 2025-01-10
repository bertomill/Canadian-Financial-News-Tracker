import { config } from 'dotenv';
import { join } from 'path';
import { testBMOScraper } from '../lib/scrapers/bmo';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

async function main() {
  try {
    console.log('Starting BMO scraper test...');
    console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Found' : 'Not found');
    
    const articles = await testBMOScraper();
    
    console.log('\nSummary:');
    console.log('-----------------');
    console.log(`Total articles found: ${articles.length}`);
    console.log(`Articles with AI relevance: ${articles.filter(a => (a.aiRelevanceScore || 0) > 0.5).length}`);
    
    // Print out AI-relevant articles
    console.log('\nAI-Relevant Articles:');
    console.log('-----------------');
    articles
      .filter(a => (a.aiRelevanceScore || 0) > 0.5)
      .forEach(article => {
        console.log(`\nTitle: ${article.title}`);
        console.log(`AI Score: ${(article.aiRelevanceScore || 0) * 100}%`);
        console.log(`Reason: ${article.aiRelevanceReason}`);
        console.log(`Date: ${article.publishDate}`);
        console.log(`Link: ${article.link}`);
        console.log('-----------------');
      });
      
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

main(); 