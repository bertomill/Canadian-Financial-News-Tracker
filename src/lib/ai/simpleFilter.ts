import { similarity } from 'ml-distance';

const AI_RELATED_EXAMPLES = [
  "artificial intelligence in banking",
  "machine learning implementation",
  "digital transformation project",
  // ... add more examples
];

export async function isAIRelatedContent(article: Article): Promise<boolean> {
  const text = `${article.title} ${article.summary}`.toLowerCase();
  
  // Simple keyword matching with fuzzy search
  return AI_RELATED_EXAMPLES.some(example => 
    similarity.cosine(
      text.split(' '),
      example.split(' ')
    ) > 0.3
  );
} 