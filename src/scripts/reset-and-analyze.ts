import { pool } from '../db/config';
import { scrapeRBCNews } from '../lib/scrapers/rbc';
import { scrapeTDNews } from '../lib/scrapers/td';
import { scrapeBMONews } from '../lib/scrapers/bmo';
import { scrapeScotiaNews } from '../lib/scrapers/scotia';
import { scrapeCIBCNews } from '../lib/scrapers/cibc';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

async function resetAndAnalyzeArticles() {
  try {
    console.log('Starting reset and analysis...');

    // 1. Clear existing articles
    console.log('Clearing existing articles...');
    await pool.query('TRUNCATE TABLE articles;');

    // 2. Fetch and analyze new articles from all banks
    console.log('Fetching and analyzing new articles...');
    const [rbcArticles, tdArticles, bmoArticles, scotiaArticles, cibcArticles] = await Promise.all([
      scrapeRBCNews(),
      scrapeTDNews(),
      scrapeBMONews(),
      scrapeScotiaNews(),
      scrapeCIBCNews()
    ]);
    
    // 3. Log analysis results by bank
    console.log('\nRBC Analysis Results:');
    rbcArticles.forEach(article => {
      console.log(`\nTitle: ${article.title}`);
      console.log(`AI Score: ${article.aiRelevanceScore}`);
      console.log(`Reason: ${article.aiRelevanceReason}`);
      console.log('-'.repeat(50));
    });

    console.log('\nTD Analysis Results:');
    tdArticles.forEach(article => {
      console.log(`\nTitle: ${article.title}`);
      console.log(`AI Score: ${article.aiRelevanceScore}`);
      console.log(`Reason: ${article.aiRelevanceReason}`);
      console.log('-'.repeat(50));
    });

    console.log('\nBMO Analysis Results:');
    bmoArticles.forEach(article => {
      console.log(`\nTitle: ${article.title}`);
      console.log(`AI Score: ${article.aiRelevanceScore}`);
      console.log(`Reason: ${article.aiRelevanceReason}`);
      console.log('-'.repeat(50));
    });

    console.log('\nScotiabank Analysis Results:');
    scotiaArticles.forEach(article => {
      console.log(`\nTitle: ${article.title}`);
      console.log(`AI Score: ${article.aiRelevanceScore}`);
      console.log(`Reason: ${article.aiRelevanceReason}`);
      console.log('-'.repeat(50));
    });

    console.log('\nCIBC Analysis Results:');
    cibcArticles.forEach(article => {
      console.log(`\nTitle: ${article.title}`);
      console.log(`AI Score: ${article.aiRelevanceScore}`);
      console.log(`Reason: ${article.aiRelevanceReason}`);
      console.log('-'.repeat(50));
    });

    // 4. Insert all analyzed articles
    const allArticles = [...rbcArticles, ...tdArticles, ...bmoArticles, ...scotiaArticles, ...cibcArticles];
    console.log('\nSaving analyzed articles...');
    for (const article of allArticles) {
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

    console.log('\nReset and analysis completed successfully! 🎉');
    console.log(`Total articles: ${allArticles.length} (RBC: ${rbcArticles.length}, TD: ${tdArticles.length}, BMO: ${bmoArticles.length}, Scotia: ${scotiaArticles.length}, CIBC: ${cibcArticles.length})`);
    await pool.end();
  } catch (error) {
    console.error('Error during reset and analysis:', error);
    process.exit(1);
  }
}

resetAndAnalyzeArticles(); 