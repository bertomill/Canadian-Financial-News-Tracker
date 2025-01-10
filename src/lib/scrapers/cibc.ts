import puppeteer from 'puppeteer';
import { Article } from '@/types';
import { isAIRelatedContent } from '../ai/contentFilter';

const CIBC_NEWS_URL = 'https://cibc.mediaroom.com/';

function parseCIBCDate(dateStr: string): string {
  // CIBC date format: "Month DD, YYYY"
  // Handle extra spaces in single-digit dates (e.g., "December  5, 2024")
  const cleanDate = dateStr.replace(/\s+/g, ' ').trim();
  try {
    const date = new Date(cleanDate);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return date.toISOString();
  } catch (error) {
    console.error('Error parsing date:', dateStr);
    return new Date().toISOString(); // Fallback to current date
  }
}

export async function scrapeCIBCNews(): Promise<Article[]> {
  console.log('Starting CIBC news scraper...');
  const browser = await puppeteer.launch({ headless: true });
  const articles: Article[] = [];

  try {
    const page = await browser.newPage();
    await page.goto(CIBC_NEWS_URL, { waitUntil: 'networkidle0' });

    // Wait for the news list to load
    await page.waitForSelector('.wd_item_list');

    // Extract articles
    const items = await page.evaluate(() => {
      const articleElements = document.querySelectorAll('.wd_item');
      return Array.from(articleElements).map(article => {
        const link = article.querySelector('.wd_title a');
        const dateText = article.querySelector('.wd_date')?.textContent;
        
        return {
          title: link?.textContent?.trim() || '',
          link: link?.href || '',
          dateText: dateText?.trim() || '',
        };
      });
    });

    // Process each article
    for (const item of items) {
      if (!item.title || !item.link) continue;

      // Parse the date
      const publishDate = parseCIBCDate(item.dateText);

      // Create article object
      const article: Article = {
        title: item.title,
        link: item.link,
        publishDate,
        source: 'CIBC Press Release',
        bankCode: 'CIBC',
        summary: item.title // Using title as summary since the press release page doesn't show previews
      };

      // Analyze for AI relevance
      const aiAnalysis = await isAIRelatedContent(article);
      if (aiAnalysis) {
        article.aiRelevanceScore = aiAnalysis.score;
        article.aiRelevanceReason = aiAnalysis.reason;
      }

      articles.push(article);
    }

    console.log(`Found ${articles.length} CIBC articles`);
    return articles;

  } catch {
    console.error('Error scraping CIBC news');
    if (browser) await browser.close();
    return [];
  }
}

export async function scrapeCIBCInnovation(): Promise<Article[]> {
  try {
    console.log('Starting CIBC innovation blog scrape...');
    
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    console.log('Loading innovation page...');
    await page.goto('https://www.cibc.com/en/about-cibc/innovation.html');
    await page.waitForSelector('.article-card');

    const articles = await page.evaluate(() => {
      const items: Article[] = [];
      
      document.querySelectorAll('.article-card').forEach((element) => {
        const title = element.querySelector('h3')?.textContent?.trim() || '';
        const dateText = element.querySelector('.date')?.textContent?.trim();
        const link = element.querySelector('a')?.getAttribute('href');
        const summary = element.querySelector('.description')?.textContent?.trim() || '';

        if (title && link) {
          items.push({
            title,
            publishDate: dateText ? new Date(dateText).toISOString() : new Date().toISOString(),
            link: link.startsWith('http') ? link : `https://www.cibc.com${link}`,
            source: 'CIBC Innovation',
            bankCode: 'CIBC',
            summary
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
        const isAIRelated = isAIKeywordMatch(article);
        return {
          ...article,
          aiRelevanceScore: isAIRelated ? 0.8 : 0,
          aiRelevanceReason: isAIRelated ? 'Based on keyword matching' : 'Not AI-related'
        };
      }
    }));

    await browser.close();
    console.log(`Scraped ${analyzedArticles.length} articles from CIBC Innovation`);
    return analyzedArticles;
  } catch (error) {
    console.error('Error scraping CIBC innovation:', error);
    return [];
  }
}

// Helper function for keyword matching
function isAIKeywordMatch(article: Article): boolean {
  const aiKeywords = [
    'ai', 'artificial intelligence', 'machine learning', 'ml',
    'deep learning', 'neural network', 'chatgpt', 'llm',
    'cohere', 'generative ai', 'automation', 'cognitive',
    'innovation', 'digital', 'technology', 'transformation',
    'data science', 'analytics', 'cloud', 'api'
  ];
  
  const text = `${article.title} ${article.summary}`.toLowerCase();
  return aiKeywords.some(keyword => text.includes(keyword));
}

// Export both functions
export async function scrapeCIBC(): Promise<Article[]> {
  const [newsArticles, innovationArticles] = await Promise.all([
    scrapeCIBCNews(),
    scrapeCIBCInnovation()
  ]);

  return [...newsArticles, ...innovationArticles];
}

// Test function to run CIBC scraper independently
export async function testCIBCScraper() {
  console.log('Testing CIBC scraper...');
  const articles = await scrapeCIBC();
  console.log('Scraped articles:', JSON.stringify(articles, null, 2));
  return articles;
} 