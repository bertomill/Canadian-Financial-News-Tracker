import { config } from 'dotenv';
import { join } from 'path';
import { scrapeSECFilings } from '../lib/scrapers/sec';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

async function testSECScraper() {
  try {
    console.log('Testing SEC scraper...\n');
    
    const articles = await scrapeSECFilings();
    
    console.log('\nResults:');
    console.log('-'.repeat(50));
    
    for (const article of articles) {
      console.log(`\nBank: ${article.bankCode}`);
      console.log(`Title: ${article.title}`);
      console.log(`Date: ${new Date(article.publishDate).toLocaleDateString()}`);
      console.log(`AI Score: ${(article.aiRelevanceScore * 100).toFixed(0)}%`);
      if (article.aiRelevanceScore > 0.5) {
        console.log(`AI Reason: ${article.aiRelevanceReason}`);
      }
      console.log(`Link: ${article.link}`);
      console.log('-'.repeat(50));
    }

    console.log(`\nTotal filings found: ${articles.length}`);
    const aiRelevant = articles.filter(a => a.aiRelevanceScore > 0.5).length;
    console.log(`AI-relevant filings: ${aiRelevant}`);
    
  } catch (error) {
    console.error('Error testing SEC scraper:', error);
    process.exit(1);
  }
}

// Run the test if this script is run directly
if (require.main === module) {
  testSECScraper();
} 