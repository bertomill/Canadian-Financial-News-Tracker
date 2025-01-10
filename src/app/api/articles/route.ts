import { NextResponse } from 'next/server';
import { scrapeRBC } from '@/lib/scrapers/rbc';
import { scrapeTD } from '@/lib/scrapers/td';
import { scrapeBMO } from '@/lib/scrapers/bmo';
import { scrapeScotia } from '@/lib/scrapers/scotia';
import { createArticlesTable, saveArticle, getArticles } from '@/db/schema';
import { Article } from '@/types';

export async function GET(request: Request) {
  try {
    await createArticlesTable();
    
    // Get force parameter from URL
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('force') === 'true';
    
    // First get existing articles
    const existingArticles = await getArticles();

    // If not forcing refresh, return existing articles immediately
    if (!forceRefresh) {
      return NextResponse.json(existingArticles);
    }

    // Only scrape if force refresh is requested
    console.log('Scraping from news sources...');
    const results = await Promise.allSettled([
      scrapeRBC(),
      scrapeTD(),
      scrapeBMO(),
      scrapeScotia()
    ]);

    const allNewArticles = results.reduce((acc, result) => {
      if (result.status === 'fulfilled') {
        return [...acc, ...result.value];
      }
      console.error('Error scraping source:', result.reason);
      return acc;
    }, [] as Article[]);
    
    // Filter out articles that already exist
    const existingUrls = new Set(existingArticles.map((a: Article) => a.link));
    const newArticles = allNewArticles.filter(article => !existingUrls.has(article.link));

    // Save new articles
    const savedArticles = await Promise.allSettled(
      newArticles.map(article => saveArticle(article))
    );

    const failedSaves = savedArticles.filter(result => result.status === 'rejected').length;
    if (failedSaves > 0) {
      console.warn(`Failed to save ${failedSaves} articles`);
    }

    // Return updated articles
    const updatedArticles = await getArticles();
    return NextResponse.json(updatedArticles);
  } catch (error) {
    console.error('Error in GET /api/articles:', error);
    try {
      const existingArticles = await getArticles();
      if (existingArticles.length > 0) {
        console.log('Returning existing articles despite error');
        return NextResponse.json(existingArticles);
      }
    } catch (dbError) {
      console.error('Failed to get existing articles:', dbError);
    }
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
} 