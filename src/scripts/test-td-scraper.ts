import { scrapeTDNews } from '../lib/scrapers/td';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

async function testTDScraper() {
  try {
    console.log('Testing TD news scraper...');
    
    // Run the TD scraper
    const tdArticles = await scrapeTDNews();
    
    // Log results
    console.log('\nTD Articles Found:', tdArticles.length);
    
    if (tdArticles.length === 0) {
      console.log('❌ No articles found');
    } else {
      console.log('\nArticle Details:');
      tdArticles.forEach((article, index) => {
        console.log(`\n${index + 1}. ${article.title}`);
        console.log(`   Date: ${article.publishDate}`);
        console.log(`   Link: ${article.link}`);
        console.log(`   AI Score: ${article.aiRelevanceScore}`);
        console.log(`   Reason: ${article.aiRelevanceReason}`);
        console.log('-'.repeat(80));
      });
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testTDScraper(); 