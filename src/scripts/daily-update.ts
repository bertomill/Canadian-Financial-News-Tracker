import { db } from '../db/config';
import { articles } from '../db/schema';
import { scrapeAllBanks } from '../lib/scrapers';

async function main() {
  try {
    console.log('Starting daily update...');

    // Get existing articles
    const existingArticles = await db.select({ link: articles.link }).from(articles);
    const existingUrls = new Set(existingArticles.map(row => row.link));

    // Scrape new articles
    console.log('Scraping articles...');
    const newArticles = await scrapeAllBanks();
    const filteredArticles = newArticles.filter(article => !existingUrls.has(article.link));

    if (filteredArticles.length === 0) {
      console.log('No new articles found');
      return;
    }

    // Save new articles
    console.log(`Saving ${filteredArticles.length} new articles...`);
    for (const article of filteredArticles) {
      await db.insert(articles).values({
        title: article.title,
        link: article.link,
        publishDate: new Date(article.publishDate),
        source: article.source,
        bankCode: article.bankCode,
        summary: article.summary || '',
        aiRelevanceScore: article.aiRelevanceScore || 0,
        aiRelevanceReason: article.aiRelevanceReason || ''
      });
    }

    console.log('Daily update completed successfully');
  } catch (error) {
    console.error('Error in daily update:', error);
    process.exit(1);
  }
}

main(); 