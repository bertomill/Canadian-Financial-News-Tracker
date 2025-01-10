import puppeteer from 'puppeteer';
import { Article } from '@/types';
import { isAIRelatedContent } from '../ai/contentFilter';

interface ScrapedArticle {
  title: string;
  link: string;
  dateText?: string;
  summary: string;
}

export async function scrapeTD(): Promise<Article[]> {
  let browser;
  try {
    console.log('Starting TD scraper...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 60000
    });

    const page = await browser.newPage();
    let articles: ScrapedArticle[] = [];

    // First try TD Innovation
    console.log('Checking TD Innovation...');
    const innovationSelectors = [
      '.article-card',
      '.news-item',
      '.content-card'
    ];

    for (const selector of innovationSelectors) {
      const exists = await page.evaluate((sel) => {
        return document.querySelector(sel) !== null;
      }, selector);

      if (exists) {
        articles = await page.evaluate((sel) => {
          const items: ScrapedArticle[] = [];
          document.querySelectorAll(sel).forEach((element) => {
            const title = element.querySelector('h3, .title')?.textContent?.trim() || '';
            const dateText = element.querySelector('.date, .timestamp')?.textContent?.trim();
            const link = element.querySelector('a')?.getAttribute('href') || '';
            const summary = element.querySelector('p, .description')?.textContent?.trim() || '';

            if (title && link) {
              items.push({
                title,
                link: link.startsWith('http') ? link : `https://www.td.com${link}`,
                dateText,
                summary
              });
            }
          });
          return items;
        }, selector);
        break;
      }
    }

    // Then try TD Newsroom
    if (articles.length === 0) {
      console.log('Checking TD Newsroom...');
      await page.goto('https://newsroom.td.com/news', {
        waitUntil: 'networkidle0',
        timeout: 60000
      });

      const newsSelectors = [
        '.news-item',
        '.article-item',
        '.press-release'
      ];

      for (const selector of newsSelectors) {
        const exists = await page.evaluate((sel) => {
          return document.querySelector(sel) !== null;
        }, selector);

        if (exists) {
          articles = await page.evaluate((sel) => {
            const items: ScrapedArticle[] = [];
            document.querySelectorAll(sel).forEach((element) => {
              const title = element.querySelector('.news-title, .title, h3')?.textContent?.trim() || '';
              const dateText = element.querySelector('.news-date, .date')?.textContent?.trim();
              const link = element.querySelector('a')?.getAttribute('href') || '';
              const summary = element.querySelector('.news-description, .description')?.textContent?.trim() || '';

              if (title && link) {
                items.push({
                  title,
                  link: link.startsWith('http') ? link : `https://newsroom.td.com${link}`,
                  dateText,
                  summary
                });
              }
            });
            return items;
          }, selector);
          break;
        }
      }
    }

    await browser.close();

    // Transform and analyze articles
    const transformedArticles = await Promise.all(articles.map(async (article) => {
      const transformed: Article = {
        title: article.title,
        link: article.link,
        publishDate: article.dateText ? new Date(article.dateText).toISOString() : new Date().toISOString(),
        source: article.link.includes('newsroom.td.com') ? 'TD Newsroom' : 'TD Innovation',
        bankCode: 'TD',
        summary: article.summary
      };

      try {
        const aiAnalysis = await isAIRelatedContent(transformed);
        return {
          ...transformed,
          aiRelevanceScore: aiAnalysis.isAIRelated ? aiAnalysis.confidence : 0,
          aiRelevanceReason: aiAnalysis.reason
        };
      } catch (error) {
        console.error('Error analyzing article:', error);
        return transformed;
      }
    }));

    console.log(`Scraped ${transformedArticles.length} articles from TD`);
    return transformedArticles;

  } catch (error) {
    console.error('Error scraping TD:', error);
    if (browser) await browser.close();
    return [];
  }
} 