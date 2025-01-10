import { Article } from '@/types';
import puppeteer from 'puppeteer';
import OpenAI from 'openai';
import { env } from '@/env';
import { isAIRelatedContent } from '../ai/contentFilter';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY
});

interface BMOArticle {
  title: string;
  dateText: string;
  link: string;
}

export async function scrapeBMONews(): Promise<(Article & {
  aiRelevanceScore?: number;
  aiRelevanceReason?: string;
})[]> {
  try {
    console.log('Starting BMO news scrape...');
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    console.log('Loading BMO newsroom...');
    try {
      await page.goto('https://newsroom.bmo.com/', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
    } catch (error) {
      console.error('Error loading BMO page:', error);
      throw error;
    }
    
    console.log('Waiting for article elements...');
    await page.waitForSelector('.wd_item');
    
    const itemCount = await page.evaluate(() => 
      document.querySelectorAll('.wd_item').length
    );
    console.log(`Found ${itemCount} BMO news items`);

    const articles = await page.evaluate(() => {
      const items: BMOArticle[] = [];
      
      document.querySelectorAll('.wd_item').forEach((element) => {
        const title = element.querySelector('.wd_title a')?.textContent?.trim() || '';
        const dateText = element.querySelector('.wd_date')?.textContent?.trim() || '';
        const link = element.querySelector('.wd_title a')?.getAttribute('href') || '';

        if (title && dateText && link) {
          items.push({ title, dateText, link });
        }
      });
      
      console.log(`Extracted ${items.length} BMO articles`);
      return items;
    });

    // Convert scraped articles to our Article type
    const formattedArticles = articles.map(article => ({
      title: article.title,
      publishDate: new Date(article.dateText).toISOString(),
      link: article.link,
      source: 'BMO Newsroom',
      bankCode: 'BMO' as const,
      summary: '' // BMO doesn't show summaries on the main page
    }));

    // Analyze each article for AI relevance
    const analyzedArticles = await Promise.all(formattedArticles.map(async (article) => {
      try {
        const content = `Title: ${article.title}\nSummary: ${article.summary}`;
        
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{
            role: "system",
            content: `You are an expert at identifying AI and technology initiatives in banking.
                     Consider both explicit mentions (AI, ML) and implicit references 
                     (automation, digital transformation). Respond with a JSON object containing:
                     {
                       "isAIRelated": boolean,
                       "confidence": number (0-1),
                       "reason": string
                     }`
          }, {
            role: "user",
            content: `Analyze this banking news article for AI/technology relevance:\n\n${content}`
          }],
          temperature: 0,
          response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        return {
          ...article,
          aiRelevanceScore: result.confidence || 0,
          aiRelevanceReason: result.reason || ''
        };
      } catch (error) {
        console.error('Error analyzing article:', error);
        return article;
      }
    }));

    await browser.close();
    return analyzedArticles;
  } catch (error) {
    console.error('Error scraping BMO news:', error);
    return [];
  }
}

export async function scrapeBMOTechnology(): Promise<Article[]> {
  try {
    console.log('Starting BMO technology blog scrape...');
    
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    console.log('Loading technology page...');
    await page.goto('https://www.bmo.com/main/about-bmo/technology/');
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
            link: link.startsWith('http') ? link : `https://www.bmo.com${link}`,
            source: 'BMO Technology',
            bankCode: 'BMO',
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
    console.log(`Scraped ${analyzedArticles.length} articles from BMO Technology`);
    return analyzedArticles;
  } catch (error) {
    console.error('Error scraping BMO technology:', error);
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
export async function scrapeBMO(): Promise<Article[]> {
  const [newsArticles, techArticles] = await Promise.all([
    scrapeBMONews(),
    scrapeBMOTechnology()
  ]);

  return [...newsArticles, ...techArticles];
}

// Test function to run BMO scraper independently
export async function testBMOScraper() {
  console.log('Testing BMO scraper...');
  const articles = await scrapeBMONews();
  console.log('Scraped articles:', JSON.stringify(articles, null, 2));
  return articles;
} 