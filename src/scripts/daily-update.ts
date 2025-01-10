import { pool } from '../db/config';
import { scrapeRBCNews } from '../lib/scrapers/rbc';
import { scrapeTDNews } from '../lib/scrapers/td';
import { scrapeBMONews } from '../lib/scrapers/bmo';
import { scrapeScotiaNews } from '../lib/scrapers/scotia';
import { scrapeCIBCNews } from '../lib/scrapers/cibc';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { Article } from '@/types';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

async function getExistingUrls(): Promise<Set<string>> {
  const result = await pool.query('SELECT link FROM articles');
  return new Set(result.rows.map(row => row.link));
}

async function dailyUpdate() {
  try {
    console.log('Starting daily update...');
    console.log('Fetching existing articles...');
    const existingUrls = await getExistingUrls();

    // Fetch and analyze new articles from all banks
    console.log('\nFetching and analyzing new articles...');
    const [rbcArticles, tdArticles, bmoArticles, scotiaArticles, cibcArticles] = await Promise.all([
      scrapeRBCNews(),
      scrapeTDNews(),
      scrapeBMONews(),
      scrapeScotiaNews(),
      scrapeCIBCNews()
    ]);

    const allArticles = [...rbcArticles, ...tdArticles, ...bmoArticles, ...scotiaArticles, ...cibcArticles];
    const newArticles = allArticles.filter(article => !existingUrls.has(article.link));

    if (newArticles.length === 0) {
      console.log('\nNo new articles found today.');
      return;
    }

    // Group new articles by bank for reporting
    const articlesByBank = new Map<string, Article[]>();
    newArticles.forEach(article => {
      const articles = articlesByBank.get(article.bankCode) || [];
      articles.push(article);
      articlesByBank.set(article.bankCode, articles);
    });

    // Log new articles by bank
    console.log('\nNew articles found:');
    for (const [bankCode, articles] of articlesByBank) {
      console.log(`\n${bankCode} - ${articles.length} new articles:`);
      articles.forEach(article => {
        console.log(`\nTitle: ${article.title}`);
        console.log(`Date: ${new Date(article.publishDate).toLocaleDateString()}`);
        console.log(`AI Score: ${article.aiRelevanceScore || 0}`);
        if (article.aiRelevanceScore && article.aiRelevanceScore > 0.5) {
          console.log(`AI Reason: ${article.aiRelevanceReason}`);
        }
        console.log('-'.repeat(50));
      });
    }

    // Save new articles
    console.log('\nSaving new articles...');
    for (const article of newArticles) {
      await pool.query(
        `INSERT INTO articles (
          title, link, publish_date, source, bank_code, summary,
          ai_relevance_score, ai_relevance_reason
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          article.title,
          article.link,
          article.publishDate,
          article.source,
          article.bankCode,
          article.summary,
          article.aiRelevanceScore || 0,
          article.aiRelevanceReason || ''
        ]
      );
    }

    // Print summary with AI-relevant highlights
    const aiRelevantArticles = newArticles.filter(a => (a.aiRelevanceScore || 0) > 0.5);
    
    console.log('\nDaily update completed successfully! 🎉');
    console.log(`Added ${newArticles.length} new articles:`);
    articlesByBank.forEach((articles, bankCode) => {
      console.log(`- ${bankCode}: ${articles.length} articles`);
    });

    if (aiRelevantArticles.length > 0) {
      console.log('\n🤖 AI-Relevant Highlights:');
      aiRelevantArticles.forEach(article => {
        console.log(`\n${article.bankCode} - ${article.title}`);
        console.log(`AI Score: ${(article.aiRelevanceScore || 0) * 100}%`);
        console.log(`Reason: ${article.aiRelevanceReason}`);
      });
    }

    await pool.end();
  } catch (error) {
    console.error('Error during daily update:', error);
    process.exit(1);
  }
}

// If running this script directly
if (require.main === module) {
  dailyUpdate();
} 