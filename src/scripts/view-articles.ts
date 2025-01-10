import { pool } from '../db/config';

async function viewArticles() {
  try {
    console.log('Fetching articles from database...\n');
    
    const result = await pool.query(`
      SELECT 
        id,
        title,
        bank_code,
        publish_date,
        ai_relevance_score,
        created_at
      FROM articles 
      ORDER BY publish_date DESC
      LIMIT 20;
    `);
    
    console.log('Latest 20 articles:');
    console.log('-----------------');
    
    result.rows.forEach(article => {
      console.log(`\nID: ${article.id}`);
      console.log(`Bank: ${article.bank_code}`);
      console.log(`Title: ${article.title}`);
      console.log(`Published: ${article.publish_date}`);
      console.log(`AI Score: ${(article.ai_relevance_score * 100).toFixed(0)}%`);
      console.log(`Added: ${article.created_at}`);
      console.log('-----------------');
    });
    
    // Get some stats
    const stats = await pool.query(`
      SELECT 
        bank_code,
        COUNT(*) as count,
        AVG(ai_relevance_score) as avg_score
      FROM articles 
      GROUP BY bank_code;
    `);
    
    console.log('\nSummary by bank:');
    console.log('-----------------');
    stats.rows.forEach(stat => {
      console.log(`${stat.bank_code}: ${stat.count} articles, Avg AI Score: ${(stat.avg_score * 100).toFixed(1)}%`);
    });
    
  } catch (error) {
    console.error('Error viewing articles:', error);
  } finally {
    await pool.end();
  }
}

viewArticles(); 