import { testScotiaScraper } from '../lib/scrapers/scotia';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

async function testScraper() {
  try {
    console.log('Testing Scotia news scraper...');
    
    // Run the Scotia scraper
    const scotiaArticles = await testScotiaScraper();
    
    // Log results
    console.log('\nScotia Articles Found:', scotiaArticles.length);
    
    if (scotiaArticles.length === 0) {
      console.log('❌ No articles found');
    } else {
      console.log('\nArticle Details:');
      scotiaArticles.forEach((article, index) => {
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

testScraper(); 