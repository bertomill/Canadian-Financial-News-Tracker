import { scrapeRBC } from '../lib/scrapers/rbc';

async function main() {
  console.log('Testing RBC News Scraper...');
  const articles = await scrapeRBC();
  
  console.log('\nFound Articles:', articles.length);
  console.log('\nArticles by source:');
  const bySource = articles.reduce((acc, article) => {
    acc[article.source] = (acc[article.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(bySource).forEach(([source, count]) => {
    console.log(`${source}: ${count} articles`);
  });
  
  console.log('\nAI-related articles:');
  const aiArticles = articles.filter(a => (a.aiRelevanceScore || 0) > 0.5);
  aiArticles.forEach((article, i) => {
    console.log(`\n${i + 1}. ${article.title}`);
    console.log(`   Date: ${article.publishDate}`);
    console.log(`   Source: ${article.source}`);
    console.log(`   AI Score: ${article.aiRelevanceScore}`);
    console.log(`   Reason: ${article.aiRelevanceReason}`);
    console.log(`   Link: ${article.link}`);
  });
}

main().catch(console.error); 