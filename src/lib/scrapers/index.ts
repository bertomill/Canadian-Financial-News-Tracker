import { scrapeRBCNews } from './rbc';
import { scrapeTDNews } from './td';
import { scrapeBMONews } from './bmo';
import { scrapeScotiaNews } from './scotia';
import { scrapeCIBCNews } from './cibc';

export async function scrapeAllBanks() {
  const articles = [];
  
  // Scrape all banks in parallel
  const [rbcArticles, tdArticles, bmoArticles, scotiaArticles, cibcArticles] = 
    await Promise.all([
      scrapeRBCNews(),
      scrapeTDNews(),
      scrapeBMONews(),
      scrapeScotiaNews(),
      scrapeCIBCNews()
    ]);
    
  return [...rbcArticles, ...tdArticles, ...bmoArticles, ...scotiaArticles, ...cibcArticles];
} 