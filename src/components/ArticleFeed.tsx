'use client';

import { useEffect, useState } from 'react';
import { Article } from '@/types';
import { TabView } from './TabView';

interface ArticleWithScore extends Article {
  aiRelevanceScore?: number;
  aiRelevanceReason?: string;
}

export function ArticleFeed() {
  const [articles, setArticles] = useState<ArticleWithScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const res = await fetch('/api/articles');
      if (!res.ok) throw new Error('Failed to fetch articles');
      
      const data = await res.json();
      setArticles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        Error: {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        Loading articles...
      </div>
    );
  }

  return <TabView articles={articles} onRefresh={fetchArticles} />;
} 