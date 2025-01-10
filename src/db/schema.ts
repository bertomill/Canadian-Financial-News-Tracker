import { pool } from './config';
import { Article } from '@/types';

export async function createArticlesTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        link TEXT NOT NULL UNIQUE,
        publish_date TIMESTAMP NOT NULL,
        source TEXT NOT NULL,
        bank_code TEXT NOT NULL,
        summary TEXT,
        ai_relevance_score FLOAT,
        ai_relevance_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(link)
      );
    `);
    console.log('Articles table created');
  } catch (error) {
    console.error('Error creating articles table:', error);
  }
}

export async function saveArticle(article: Article & { 
  aiRelevanceScore?: number;
  aiRelevanceReason?: string;
}) {
  try {
    await pool.query(
      `INSERT INTO articles (
        title, link, publish_date, source, bank_code, summary,
        ai_relevance_score, ai_relevance_reason
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (link) DO NOTHING;`,
      [
        article.title,
        article.link,
        article.publishDate,
        article.source,
        article.bankCode,
        article.summary,
        article.aiRelevanceScore || 0,
        article.aiRelevanceReason || ''
      ]
    );
  } catch (error) {
    console.error('Error saving article:', error);
  }
}

export async function getArticles() {
  try {
    const result = await pool.query(
      `SELECT * FROM articles ORDER BY publish_date DESC;`
    );
    return result.rows.map(row => ({
      title: row.title,
      link: row.link,
      publishDate: row.publish_date.toISOString(),
      source: row.source,
      bankCode: row.bank_code,
      summary: row.summary,
      aiRelevanceScore: row.ai_relevance_score,
      aiRelevanceReason: row.ai_relevance_reason
    } as Article & {
      aiRelevanceScore?: number;
      aiRelevanceReason?: string;
    }));
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
} 