import { NextResponse } from 'next/server';
import { scrapeAllBanks } from '@/lib/scrapers';
import { db } from '@/db/config';
import { articles } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function getExistingUrls(): Promise<Set<string>> {
  const result = await pool.query('SELECT link FROM articles');
  return new Set(result.rows.map(row => row.link));
}

export async function POST() {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendProgress = async (message: string) => {
    await writer.write(
      encoder.encode(`data: ${JSON.stringify({ progress: message })}\n\n`)
    );
  };

  const processResponse = async () => {
    try {
      await sendProgress('Getting existing articles...');
      const existingUrls = await getExistingUrls();

      // Fetch new articles from all banks
      await sendProgress('Scraping RBC news...');
      const rbcArticles = await scrapeRBCNews();
      
      await sendProgress('Scraping TD news...');
      const tdArticles = await scrapeTDNews();
      
      await sendProgress('Scraping BMO news...');
      const bmoArticles = await scrapeBMONews();
      
      await sendProgress('Scraping Scotiabank news...');
      const scotiaArticles = await scrapeScotiaNews();
      
      await sendProgress('Scraping CIBC news...');
      const cibcArticles = await scrapeCIBCNews();

      await sendProgress('Fetching SEC filings...');
      const secFilings = await scrapeSECFilings();

      const allArticles = [
        ...rbcArticles, 
        ...tdArticles, 
        ...bmoArticles, 
        ...scotiaArticles, 
        ...cibcArticles,
        ...secFilings
      ];
      const newArticles = allArticles.filter(article => !existingUrls.has(article.link));

      if (newArticles.length === 0) {
        await sendProgress('No new articles or filings found');
        await writer.close();
        return;
      }

      await sendProgress('Saving new articles and filings...');
      // Save new articles
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

      const newSECFilings = newArticles.filter(a => a.source === 'SEC EDGAR').length;
      const newPressReleases = newArticles.length - newSECFilings;

      await sendProgress(
        `✨ Added ${newArticles.length} new items ` +
        `(${newPressReleases} press releases, ${newSECFilings} SEC filings)`
      );
      await writer.close();
    } catch (error) {
      console.error('Error refreshing articles:', error);
      await sendProgress(`Error: ${error instanceof Error ? error.message : 'Failed to refresh articles'}`);
      await writer.close();
    }
  };

  processResponse();

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 