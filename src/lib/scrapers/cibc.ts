import puppeteer from 'puppeteer';
import { Article } from '@/types';
import { parseCIBCDate } from './dateUtils';

export async function scrapeCIBC(): Promise<Article[]> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto('https://www.cibc.com/en/about-cibc/media-centre/news-releases.html', {
      waitUntil: 'networkidle0',
    });

    // Wait for the articles to load
    await page.waitForSelector('.news-releases-list');

    // Extract articles
    const articles = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.news-releases-list .news-release'));
      return items.map(item => {
        const link = item.querySelector('a') as HTMLAnchorElement;
        const dateText = item.querySelector('.news-release-date')?.textContent;
        return {
          title: link?.textContent?.trim() || '',
          link: link?.href || '',
          dateText: dateText?.trim() || '',
        };
      });
    });

    // Close browser
    await browser.close();

    // Process articles
    return articles
      .filter(article => article.title && article.link && article.dateText)
      .map(article => ({
        title: article.title,
        link: article.link,
        publishDate: parseCIBCDate(article.dateText),
        source: 'CIBC News',
        bankCode: 'CIBC',
        summary: '',
      }));

  } catch {
    console.error('Error scraping CIBC news');
    if (browser) await browser.close();
    return [];
  }
} 