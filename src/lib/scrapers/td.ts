import { Article } from '@/types';
import puppeteer from 'puppeteer';
import { isAIRelatedContent } from '../ai/contentFilter';

export async function scrapeTDInnovation(): Promise<Article[]> {
  let browser;
  try {
    console.log('Starting TD innovation blog scrape...');
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 60000
    });
    const page = await browser.newPage();
    
    console.log('Loading innovation page...');
    await page.goto('https://td.com/ca/en/about-td/innovation', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Check if the page loaded correctly
    const content = await page.content();
    if (!content.includes('innovation') && !content.includes('TD Bank')) {
      throw new Error('Page did not load correctly');
    }

    // Try different selectors
    const selectors = ['.td-article', '.article', '.news-item', '[data-testid="article"]'];
    let articles = [];
    
    for (const selector of selectors) {
      try {
        const exists = await page.$(selector);
        if (exists) {
          articles = await page.evaluate((sel) => {
            const items = [];
            document.querySelectorAll(sel).forEach((element) => {
              const title = element.querySelector('h3, .title')?.textContent?.trim() || '';
              const dateText = element.querySelector('.date, .timestamp')?.textContent?.trim();
              const link = element.querySelector('a')?.getAttribute('href');
              const summary = element.querySelector('.description, .summary')?.textContent?.trim() || '';

              if (title && link) {
                items.push({
                  title,
                  publishDate: dateText ? new Date(dateText).toISOString() : new Date().toISOString(),
                  link: link.startsWith('http') ? link : `https://td.com${link}`,
                  source: 'TD Innovation',
                  bankCode: 'TD',
                  summary
                });
              }
            });
            return items;
          }, selector);
          
          if (articles.length > 0) break;
        }
      } catch (error) {
        console.warn(`Failed to extract articles with selector ${selector}:`, error);
      }
    }

    // Analyze each article for AI relevance
    const analyzedArticles = await Promise.all(articles.map(async (article) => {
      try {
        const aiAnalysis = await isAIRelatedContent({
          title: article.title,
          summary: article.summary
        });

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
    console.log(`Scraped ${analyzedArticles.length} articles from TD Innovation`);
    return analyzedArticles;
  } catch (error) {
    console.error('Error scraping TD innovation:', error);
    if (browser) await browser.close();
    return [];
  }
}

export async function scrapeTDNews(): Promise<Article[]> {
  let browser;
  try {
    console.log('Starting TD news scrape...');
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 60000
    });
    const page = await browser.newPage();
    
    console.log('Loading news page...');
    await page.goto('https://newsroom.td.com/news', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Check if the page loaded correctly
    const content = await page.content();
    if (!content.includes('newsroom') && !content.includes('TD Bank')) {
      throw new Error('Page did not load correctly');
    }

    // Try different selectors
    const selectors = ['.news-item', '.article', '[data-testid="news-item"]', '.press-release'];
    let articles = [];
    
    for (const selector of selectors) {
      try {
        const exists = await page.$(selector);
        if (exists) {
          articles = await page.evaluate((sel) => {
            const items = [];
            document.querySelectorAll(sel).forEach((element) => {
              const title = element.querySelector('.news-title, .title, h3')?.textContent?.trim() || '';
              const dateText = element.querySelector('.news-date, .date')?.textContent?.trim();
              const link = element.querySelector('a')?.getAttribute('href');
              const summary = element.querySelector('.news-description, .description')?.textContent?.trim() || '';

              if (title && link) {
                items.push({
                  title,
                  publishDate: dateText ? new Date(dateText).toISOString() : new Date().toISOString(),
                  link: link.startsWith('http') ? link : `https://newsroom.td.com${link}`,
                  source: 'TD Newsroom',
                  bankCode: 'TD',
                  summary
                });
              }
            });
            return items;
          }, selector);
          
          if (articles.length > 0) break;
        }
      } catch (error) {
        console.warn(`Failed to extract articles with selector ${selector}:`, error);
      }
    }

    // Analyze each article for AI relevance
    const analyzedArticles = await Promise.all(articles.map(async (article) => {
      try {
        const aiAnalysis = await isAIRelatedContent({
          title: article.title,
          summary: article.summary
        });

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
    console.log(`Scraped ${analyzedArticles.length} articles from TD Newsroom`);
    return analyzedArticles;
  } catch (error) {
    console.error('Error scraping TD news:', error);
    if (browser) await browser.close();
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
export async function scrapeTD(): Promise<Article[]> {
  try {
    const [newsArticles, innovationArticles] = await Promise.allSettled([
      scrapeTDNews(),
      scrapeTDInnovation()
    ]);

    return [
      ...(newsArticles.status === 'fulfilled' ? newsArticles.value : []),
      ...(innovationArticles.status === 'fulfilled' ? innovationArticles.value : [])
    ];
  } catch (error) {
    console.error('Error in scrapeTD:', error);
    return [];
  }
} 