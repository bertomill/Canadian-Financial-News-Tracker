import { pool } from '../db/config';
import { saveArticle, getArticles } from '../db/schema';

async function testArticleOperations() {
  try {
    console.log('Testing article operations...');

    // Test saving an article
    const testArticle = {
      title: "RBC and Cohere partner on AI",
      link: "https://test.com/article1",
      publishDate: new Date().toISOString(),
      source: "Test Source",
      bankCode: "RBC",
      summary: "Test summary about AI partnership"
    };

    console.log('\nSaving test article...');
    await saveArticle(testArticle);

    // Test retrieving articles
    console.log('\nRetrieving articles...');
    const articles = await getArticles();
    console.log(`Found ${articles.length} articles:`);
    articles.forEach((article, index) => {
      console.log(`\n${index + 1}. ${article.title}`);
      console.log(`   Published: ${article.publishDate}`);
      console.log(`   Link: ${article.link}`);
    });

    await pool.end();
    console.log('\nArticle operations test completed! 🎉');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testArticleOperations(); 