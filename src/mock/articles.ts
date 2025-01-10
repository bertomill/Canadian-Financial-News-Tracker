import { Article } from '@/types';

export const mockArticles: Article[] = [
  {
    title: "RBC Implements New AI-Powered Trading Platform",
    link: "https://example.com/article1",
    publishDate: new Date('2025-01-10T14:00:00Z').toISOString(),
    source: "Financial Post",
    bankCode: "RBC",
    summary: "RBC launches new AI trading platform to enhance customer experience...",
    aiRelevanceScore: 0.95,
    aiRelevanceReason: "Direct mention of AI implementation in trading"
  },
  {
    title: "TD Bank Expands Digital Services",
    link: "https://example.com/article2",
    publishDate: new Date('2025-01-09T10:30:00Z').toISOString(),
    source: "Globe and Mail",
    bankCode: "TD",
    summary: "TD Bank announces expansion of digital banking services...",
    aiRelevanceScore: 0.75,
    aiRelevanceReason: "Focus on digital transformation"
  },
  {
    title: "BMO Quarterly Results Show Strong Growth",
    link: "https://example.com/article3",
    publishDate: new Date('2025-01-08T09:15:00Z').toISOString(),
    source: "Reuters",
    bankCode: "BMO",
    summary: "BMO reports quarterly earnings with significant growth...",
    aiRelevanceScore: 0.2,
    aiRelevanceReason: "No significant AI or technology focus"
  }
]; 