import { scrapeRBC } from './rbc';
import { scrapeTD } from './td';
import { scrapeBMO } from './bmo';
import { scrapeScotia } from './scotia';
import { scrapeCIBC } from './cibc';

export async function scrapeAllBanks() {
  const [rbcArticles, tdArticles, bmoArticles, scotiaArticles, cibcArticles] = await Promise.all([
    scrapeRBC(),
    scrapeTD(),
    scrapeBMO(),
    scrapeScotia(),
    scrapeCIBC()
  ]);

  return [
    ...rbcArticles,
    ...tdArticles,
    ...bmoArticles,
    ...scotiaArticles,
    ...cibcArticles
  ];
} 