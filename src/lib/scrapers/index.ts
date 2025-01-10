import { scrapeRBC } from './rbc';
import { scrapeTD } from './td';
import { scrapeBMO } from './bmo';
import { scrapeScotia } from './scotia';
import { scrapeCIBC } from './cibc';
import { scrapeSECFilings } from './sec';

export async function scrapeAllBanks() {
  const [rbcArticles, tdArticles, bmoArticles, scotiaArticles, cibcArticles, secFilings] = await Promise.all([
    scrapeRBC(),
    scrapeTD(),
    scrapeBMO(),
    scrapeScotia(),
    scrapeCIBC(),
    scrapeSECFilings()
  ]);

  return [
    ...rbcArticles,
    ...tdArticles,
    ...bmoArticles,
    ...scotiaArticles,
    ...cibcArticles,
    ...secFilings
  ];
} 