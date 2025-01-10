import { Article } from '@/types';
import puppeteer from 'puppeteer';
import { isAIRelatedContent } from '../ai/contentFilter';
import OpenAI from 'openai';
import { env } from '@/env';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY
});

export async function scrapeRBCNews(): Promise<(Article & { 
  aiRelevanceScore?: number;
  aiRelevanceReason?: string;
})[]> {
  try {
    console.log('Starting RBC news scrape...');
    
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    console.log('Loading page...');
    await page.goto('https://www.rbc.com/newsroom/news/archive.html');
    await page.waitForSelector('.latest-news-1');

    const articles = await page.evaluate(() => {
      const items: Article[] = [];
      
      document.querySelectorAll('.latest-news-1').forEach((element) => {
        const title = element.querySelector('h4 a')?.textContent?.trim() || '';
        const dateText = element.querySelector('.text-disclaimer')?.textContent?.trim();
        const link = element.querySelector('h4 a')?.getAttribute('href');
        const summary = element.querySelector('h4 + p')?.textContent?.trim() || '';

        if (title && dateText && link) {
          items.push({
            title,
            publishDate: new Date(dateText).toISOString(),
            link: link.startsWith('http') ? link : `https://www.rbc.com${link}`,
            source: 'RBC Newsroom',
            bankCode: 'RBC',
            summary
          });
        }
      });
      return items;
    });

    // Analyze each article for AI relevance
    const analyzedArticles = await Promise.all(articles.map(async (article) => {
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
        console.log(`AI analysis for "${article.title}":`, result);

        return {
          ...article,
          aiRelevanceScore: result.confidence || 0,
          aiRelevanceReason: result.reason || ''
        };
      } catch {
        console.error('Error analyzing article');
        return {
          ...article,
          aiRelevanceScore: 0,
          aiRelevanceReason: 'Analysis failed'
        };
      }
    }));

    console.log('Analyzed articles:', analyzedArticles.map(a => ({
      title: a.title,
      score: a.aiRelevanceScore,
      reason: a.aiRelevanceReason
    })));

    await browser.close();
    console.log(`Scraped ${analyzedArticles.length} articles from RBC`);
    return analyzedArticles;
  } catch (error) {
    console.error('Error scraping RBC news:', error);
    return [];
  }
}

export async function scrapeRBCCapitalMarketsTech(): Promise<Article[]> {
  try {
    console.log('Starting RBC Capital Markets tech insights scrape...');
    
    const browser = await puppeteer.launch({
      timeout: 30000,
      headless: 'new'
    });
    const page = await browser.newPage();
    
    console.log('Loading RBC Capital Markets tech page...');
    await page.goto('https://www.rbccm.com/en/insights/tech-and-innovation.page', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    try {
      await page.waitForSelector('.tile--campaign-story, .tile--article', { timeout: 10000 });
    } catch (error) {
      console.log('Could not find articles, trying alternative selector...');
      await page.waitForSelector('article, .article', { timeout: 10000 });
    }

    const articles = await page.evaluate(() => {
      const items: Article[] = [];
      
      // Try both potential selectors
      const elements = [
        ...document.querySelectorAll('.tile--campaign-story'),
        ...document.querySelectorAll('.tile--article'),
        ...document.querySelectorAll('article'),
        ...document.querySelectorAll('.article')
      ];
      
      elements.forEach((element) => {
        const titleEl = element.querySelector('h3 a, h2 a, .title a');
        const title = titleEl?.textContent?.trim() || '';
        const link = titleEl?.getAttribute('href') || '';
        const summary = element.querySelector('h3 + p, h2 + p, .tile__description, .description')?.textContent?.trim() || '';
        const readTime = element.querySelector('.read-time, .read-watch')?.textContent?.trim() || '';
        
        if (title && link) {
          items.push({
            title,
            publishDate: new Date().toISOString(),
            link: link.startsWith('http') ? link : `https://www.rbccm.com${link}`,
            source: 'RBC Capital Markets Tech Insights',
            bankCode: 'RBC',
            summary: summary || title,
            metadata: { readTime }
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
      } catch {
        console.error('Error analyzing article');
        const isAIRelated = isAIKeywordMatch(article);
        return {
          ...article,
          aiRelevanceScore: isAIRelated ? 0.8 : 0,
          aiRelevanceReason: isAIRelated ? 'Based on keyword matching' : 'Not AI-related'
        };
      }
    }));

    await browser.close();
    console.log(`Scraped ${analyzedArticles.length} articles from RBC Capital Markets Tech Insights`);
    return analyzedArticles;
  } catch (error) {
    console.error('Error scraping RBC Capital Markets tech insights:', error);
    return [];
  }
}

export async function scrapeRBCThoughtLeadership(): Promise<Article[]> {
  try {
    console.log('Starting RBC Thought Leadership scrape...');
    
    const browser = await puppeteer.launch({
      timeout: 30000,
      headless: 'new'
    });
    const page = await browser.newPage();
    
    console.log('Loading Thought Leadership page...');
    await page.goto('https://thoughtleadership.rbc.com/', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    try {
      await page.waitForSelector('.post', { timeout: 10000 });
    } catch (error) {
      console.log('Could not find articles, trying alternative selector...');
      await page.waitForSelector('.callout', { timeout: 10000 });
    }

    const articles = await page.evaluate(() => {
      const items: Article[] = [];
      
      // Get all article posts
      document.querySelectorAll('.post').forEach((element) => {
        const titleEl = element.querySelector('h4');
        const title = titleEl?.textContent?.trim() || '';
        const link = element.getAttribute('href') || '';
        const dateEl = element.querySelector('.text-script');
        const dateText = dateEl?.textContent?.trim() || '';
        const summary = element.querySelector('.post-excerpt')?.textContent?.trim() || '';
        const categories = element.getAttribute('cat')?.split(',') || [];
        
        if (title && link) {
          items.push({
            title,
            publishDate: dateText ? new Date(dateText).toISOString() : new Date().toISOString(),
            link: link.startsWith('http') ? link : `https://thoughtleadership.rbc.com${link}`,
            source: 'RBC Thought Leadership',
            bankCode: 'RBC',
            summary: summary || title,
            metadata: { categories }
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
      } catch {
        console.error('Error analyzing article');
        const isAIRelated = isAIKeywordMatch(article);
        return {
          ...article,
          aiRelevanceScore: isAIRelated ? 0.8 : 0,
          aiRelevanceReason: isAIRelated ? 'Based on keyword matching' : 'Not AI-related'
        };
      }
    }));

    await browser.close();
    console.log(`Scraped ${analyzedArticles.length} articles from RBC Thought Leadership`);
    return analyzedArticles;
  } catch (error) {
    console.error('Error scraping RBC Thought Leadership:', error);
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
    'data science', 'analytics', 'cloud', 'api', 'robotaxi',
    'autonomous', 'fintech', 'digital transformation',
    'tech trends', 'future frontier', 'disruption', 'innovation era',
    'biotech', 'life sciences', 'digital marketplace'
  ];
  
  const text = `${article.title} ${article.summary} ${(article.metadata?.categories || []).join(' ')}`.toLowerCase();
  return aiKeywords.some(keyword => text.includes(keyword));
}

// Export both functions
export async function scrapeRBC(): Promise<Article[]> {
  const [newsArticles, techInsightsArticles, thoughtLeadershipArticles] = await Promise.all([
    scrapeRBCNews(),
    scrapeRBCCapitalMarketsTech(),
    scrapeRBCThoughtLeadership()
  ]);

  return [...newsArticles, ...techInsightsArticles, ...thoughtLeadershipArticles];
} 