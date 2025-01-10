import { pool } from '../db/config';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function generateReport() {
  try {
    console.log('Fetching articles from database...');
    
    const result = await pool.query(`
      SELECT 
        id,
        title,
        bank_code,
        publish_date,
        ai_relevance_score,
        ai_relevance_reason,
        created_at,
        link
      FROM articles 
      ORDER BY publish_date DESC;
    `);

    const stats = await pool.query(`
      SELECT 
        bank_code,
        COUNT(*) as count,
        AVG(ai_relevance_score) as avg_score,
        COUNT(CASE WHEN ai_relevance_score > 0.5 THEN 1 END) as ai_relevant_count
      FROM articles 
      GROUP BY bank_code;
    `);

    // Generate HTML
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bank Articles Report</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: #f5f5f5;
        }
        h1, h2 { color: #2c3e50; }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        th {
          background: #2c3e50;
          color: white;
        }
        tr:hover { background: #f8f9fa; }
        .bank-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 500;
          display: inline-block;
        }
        .bank-RBC { background: #e3f2fd; color: #1565c0; }
        .bank-TD { background: #e8f5e9; color: #2e7d32; }
        .bank-BMO { background: #fff3e0; color: #ef6c00; }
        .ai-score {
          padding: 4px 8px;
          border-radius: 4px;
          background: #f3e5f5;
          color: #7b1fa2;
        }
        a { color: #2196f3; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .timestamp { color: #666; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <h1>Bank Articles Report</h1>
      
      <div class="stats">
        ${stats.rows.map(stat => `
          <div class="stat-card">
            <h3>${stat.bank_code}</h3>
            <p>Total Articles: ${stat.count}</p>
            <p>Average AI Score: ${(stat.avg_score * 100).toFixed(1)}%</p>
            <p>AI Relevant Articles: ${stat.ai_relevant_count}</p>
          </div>
        `).join('')}
      </div>

      <h2>Articles</h2>
      <table>
        <thead>
          <tr>
            <th>Bank</th>
            <th>Title</th>
            <th>Published</th>
            <th>AI Score</th>
            <th>AI Reasoning</th>
          </tr>
        </thead>
        <tbody>
          ${result.rows.map(article => `
            <tr>
              <td>
                <span class="bank-badge bank-${article.bank_code}">
                  ${article.bank_code}
                </span>
              </td>
              <td>
                <a href="${article.link}" target="_blank">
                  ${article.title}
                </a>
              </td>
              <td class="timestamp">
                ${new Date(article.publish_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </td>
              <td>
                <span class="ai-score">
                  ${(article.ai_relevance_score * 100).toFixed(0)}%
                </span>
              </td>
              <td>
                ${article.ai_relevance_reason || ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <p class="timestamp">Generated on ${new Date().toLocaleString()}</p>
    </body>
    </html>
    `;

    // Write to file
    const reportPath = join(process.cwd(), 'articles-report.html');
    writeFileSync(reportPath, html);
    console.log(`Report generated at: ${reportPath}`);
    console.log('Open this file in your browser to view the report');

  } catch (error) {
    console.error('Error generating report:', error);
  } finally {
    await pool.end();
  }
}

generateReport(); 