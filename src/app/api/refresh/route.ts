import { NextResponse } from 'next/server';
import { scrapeAllBanks } from '@/lib/scrapers';
import { db } from '@/db/config';
import { articles } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

async function getExistingUrls(): Promise<Set<string>> {
  const result = await db.select({ link: articles.link }).from(articles);
  return new Set(result.map(row => row.link));
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

      await sendProgress('Scraping all banks...');
      const allArticles = await scrapeAllBanks();
      const newArticles = allArticles.filter(article => !existingUrls.has(article.link));

      if (newArticles.length === 0) {
        await sendProgress('No new articles found');
        await writer.close();
        return;
      }

      await sendProgress('Saving new articles...');
      // Save new articles using Drizzle
      for (const article of newArticles) {
        await db.insert(articles).values({
          title: article.title,
          link: article.link,
          publishDate: new Date(article.publishDate),
          source: article.source,
          bankCode: article.bankCode,
          summary: article.summary,
          aiRelevanceScore: article.aiRelevanceScore || 0,
          aiRelevanceReason: article.aiRelevanceReason || ''
        });
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