import OpenAI from 'openai';
import { Article } from '@/types';
import { env } from '@/env';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY
});

interface AIAnalysis {
  isAIRelated: boolean;
  confidence: number;
  reason: string;
}

export async function isAIRelatedContent(article: Article): Promise<AIAnalysis> {
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

    try {
      const result = JSON.parse(response.choices[0].message.content || '{}');
      console.log(`AI analysis for "${article.title}":`, result);
      return result as AIAnalysis;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      const isAIRelated = isAIKeywordMatch(article);
      return {
        isAIRelated,
        confidence: isAIRelated ? 0.8 : 0,
        reason: isAIRelated ? 'Based on keyword matching' : 'Not AI-related'
      };
    }
  } catch (error) {
    console.error('Error checking AI relevance:', error);
    const isAIRelated = isAIKeywordMatch(article);
    return {
      isAIRelated,
      confidence: isAIRelated ? 0.8 : 0,
      reason: isAIRelated ? 'Based on keyword matching' : 'Not AI-related'
    };
  }
}

// Backup keyword matching
function isAIKeywordMatch(article: Article): boolean {
  const aiKeywords = {
    core: ['ai', 'artificial intelligence', 'machine learning', 'ml'],
    technologies: ['deep learning', 'neural network', 'chatgpt', 'llm', 'cohere'],
    applications: ['generative ai', 'automation', 'cognitive', 'predictive'],
    transformation: ['digital transformation', 'data science', 'analytics'],
    banking: ['fintech', 'digital banking', 'smart banking', 'automated service']
  };
  
  const text = `${article.title} ${article.summary}`.toLowerCase();
  const matches = Object.entries(aiKeywords).flatMap(([category, keywords]) => {
    const found = keywords.filter(keyword => text.includes(keyword));
    return found.map(keyword => ({ category, keyword }));
  });
  
  if (matches.length > 0) {
    console.log(`Keyword matches for "${article.title}":`, matches);
  }
  
  return matches.length > 0;
} 