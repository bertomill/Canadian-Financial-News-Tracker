import { similarity } from 'ml-distance';
import { Article } from '@/types';

const AI_RELATED_EXAMPLES = [
  "artificial intelligence in banking",
  "machine learning applications",
  "AI-powered solutions",
  "chatbot implementation",
  "natural language processing",
  "automated customer service",
  "predictive analytics",
  "data science initiatives"
];

export async function isAIRelatedContent(article: Article): Promise<boolean> {
  const text = `${article.title} ${article.summary}`.toLowerCase();
  
  // Simple keyword matching with fuzzy search
  for (const example of AI_RELATED_EXAMPLES) {
    const score = similarity.cosine(
      text.split(' '),
      example.toLowerCase().split(' ')
    );
    
    if (score > 0.5) {
      return true;
    }
  }
  
  return false;
} 