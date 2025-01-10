import { db } from '../db/config';
import { articles, Article } from '../db/schema';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { desc } from 'drizzle-orm';

async function generateReport() {
  try {
    console.log('Fetching articles...');
    const allArticles = await db
      .select()
      .from(articles)
      .orderBy(desc(articles.publishDate));

    // Group articles by bank
    const articlesByBank = new Map<string, Article[]>();
    allArticles.forEach((article: Article) => {
      const bankArticles = articlesByBank.get(article.bankCode) || [];
      bankArticles.push(article);
      articlesByBank.set(article.bankCode, bankArticles);
    });

    // Generate report content
    let report = '# Canadian Bank News Report\n\n';
    report += `Generated on ${new Date().toLocaleDateString()}\n\n`;

    // Overall statistics
    report += '## Overall Statistics\n\n';
    report += `Total Articles: ${allArticles.length}\n`;
    articlesByBank.forEach((articles: Article[], bankCode: string) => {
      report += `${bankCode}: ${articles.length} articles\n`;
    });

    // AI-relevant articles
    const aiRelevantArticles = allArticles.filter(a => (a.aiRelevanceScore || 0) > 0.5);
    report += `\nAI-Relevant Articles: ${aiRelevantArticles.length}\n\n`;

    // Articles by bank
    articlesByBank.forEach((articles: Article[], bankCode: string) => {
      report += `\n## ${bankCode}\n\n`;
      articles.forEach((article: Article) => {
        report += `### ${article.title}\n`;
        report += `Date: ${new Date(article.publishDate).toLocaleDateString()}\n`;
        report += `Source: ${article.source}\n`;
        report += `Link: ${article.link}\n`;
        if (article.aiRelevanceScore && article.aiRelevanceScore > 0.5) {
          report += `AI Score: ${(article.aiRelevanceScore * 100).toFixed(0)}%\n`;
          report += `AI Analysis: ${article.aiRelevanceReason}\n`;
        }
        report += `\n${article.summary}\n\n---\n\n`;
      });
    });

    // Save report
    const reportPath = join(process.cwd(), 'reports', `bank-news-${new Date().toISOString().split('T')[0]}.md`);
    writeFileSync(reportPath, report);
    console.log(`Report saved to ${reportPath}`);

  } catch (error) {
    console.error('Error generating report:', error);
    process.exit(1);
  }
}

generateReport(); 