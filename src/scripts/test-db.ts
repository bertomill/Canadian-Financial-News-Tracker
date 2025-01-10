import { pool } from '../db/config';
import { createArticlesTable } from '../db/schema';

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const res = await pool.query('SELECT NOW()');
    console.log('Database connected! Current time:', res.rows[0].now);

    // Test table creation
    console.log('\nTesting table creation...');
    await createArticlesTable();
    
    // Test if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'articles'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('Articles table exists! ✅');
    }

    await pool.end(); // Close the connection
    console.log('\nDatabase test completed successfully! 🎉');
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

testDatabase(); 