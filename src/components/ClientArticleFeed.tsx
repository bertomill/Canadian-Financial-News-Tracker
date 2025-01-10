'use client';

import { ArticleFeed } from './ArticleFeed';
import { Article } from '@/types';

interface ClientArticleFeedProps {
  articles: Article[];
  bankCode: string;
}

export function ClientArticleFeed({ articles, bankCode }: ClientArticleFeedProps) {
  return <ArticleFeed articles={articles} bankCode={bankCode} />;
} 