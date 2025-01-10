import puppeteer from 'puppeteer';
import { Article } from '@/types';
import { isAIRelatedContent } from '../ai/contentFilter';

export async function scrapeScotia(): Promise<Article[]> {
  let browser;
  try {
    console.log('Starting Scotia Market Insights scrape...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 60000
    });
    const page = await browser.newPage();
    
    console.log('Loading Market Insights page...');
    await page.goto('https://www.gbm.scotiabank.com/en/market-insights.html', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Check if page loaded correctly
    const content = await page.content();
    if (!content.includes('Market Insights')) {
      throw new Error('Page did not load correctly');
    }

    // Extract articles
    const articles = await page.evaluate(() => {
      const items: Article[] = [];
      document.querySelectorAll('article.bns--card').forEach((article) => {
        const titleElement = article.querySelector('.card-text a');
        const title = titleElement?.textContent?.trim() || '';
        const link = titleElement?.getAttribute('href') || '';
        const dateText = article.querySelector('.c--date')?.textContent?.trim() || '';
        const summary = article.querySelector('.c--description')?.textContent?.trim() || '';

        if (title && link) {
          items.push({
            title,
            publishDate: dateText ? new Date(dateText).toISOString() : new Date().toISOString(),
            link: link.startsWith('http') ? link : `https://www.gbm.scotiabank.com${link}`,
            source: 'Scotia Market Insights',
            bankCode: 'Scotia',
            summary: summary || '',
          });
        }
      });
      return items;
    });

    // Analyze each article for AI relevance
    const analyzedArticles = await Promise.all(articles.map(async (article) => {
      try {
        const aiAnalysis = await isAIRelatedContent(article);

        return {
          ...article,
          aiRelevanceScore: aiAnalysis.isAIRelated ? aiAnalysis.confidence : 0,
          aiRelevanceReason: aiAnalysis.reason
        };
      } catch (error) {
        console.error('Error analyzing article:', error);
        return {
          ...article,
          aiRelevanceScore: 0,
          aiRelevanceReason: 'Analysis failed'
        };
      }
    }));

    await browser.close();
    console.log(`Scraped ${analyzedArticles.length} articles from Scotia Market Insights`);
    return analyzedArticles;
  } catch (error) {
    console.error('Error scraping Scotia Market Insights:', error);
    if (browser) await browser.close();
    return [];
  }
}

// Test function to run Scotia scraper independently
export async function testScotiaScraper() {
  console.log('Testing Scotia scraper...');
  const articles = await scrapeScotia();
  console.log('Scraped articles:', JSON.stringify(articles, null, 2));
  return articles;
}

// Run test if this file is being run directly
if (require.main === module) {
  testScotiaScraper()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
} 