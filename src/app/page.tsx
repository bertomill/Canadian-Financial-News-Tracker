'use client';

import { useState, useEffect } from 'react';
import { TabView } from '@/components/TabView';
import { Article } from '@/types';

interface ArticleWithScore extends Article {
  aiRelevanceScore?: number;
  aiRelevanceReason?: string;
}

export default function Home() {
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
      <div className="min-h-screen p-4 max-w-7xl mx-auto">
        <div className="text-red-500 text-center py-8">
          Error: {error}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 max-w-7xl mx-auto">
        <div className="text-center py-8">
          Loading articles...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-7xl mx-auto">
      <header className="py-6">
        <h1 className="text-2xl font-bold">Canadian Financial News Tracker</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Track news and updates from major Canadian financial institutions
        </p>
      </header>
      
      <main>
        <TabView articles={articles} onRefresh={fetchArticles} />
      </main>
    </div>
  );
}
