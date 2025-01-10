import { pool } from '../db/config';

async function addAIColumns() {
  try {
    console.log('Adding AI columns to articles table...');
    await pool.query(`
      ALTER TABLE articles 
      ADD COLUMN IF NOT EXISTS ai_relevance_score FLOAT,
      ADD COLUMN IF NOT EXISTS ai_relevance_reason TEXT;
    `);
    console.log('Columns added successfully! 🎉');
    await pool.end();
  } catch (error) {
    console.error('Error adding columns:', error);
  }
}

addAIColumns(); 