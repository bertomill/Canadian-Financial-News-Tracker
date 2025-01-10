export interface Bank {
  name: string;
  code: string;
  rssFeeds: string[];
  websiteUrl: string;
}

export interface Article {
  title: string;
  link: string;
  publishDate: string;
  source: string;
  bankCode: string;
  summary: string;
  aiRelevanceScore?: number;
  aiRelevanceReason?: string;
  metadata?: {
    readTime?: string;
    categories?: string[];
    [key: string]: string | string[] | undefined;
  };
} 