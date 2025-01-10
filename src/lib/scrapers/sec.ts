import { Article } from '@/types';
import { isAIRelatedContent } from '../ai/contentFilter';

// Map of bank codes to their SEC CIK numbers
const BANK_CIKS = {
  'RBC': '0001000275',  // Royal Bank of Canada
  'TD': '0000947263',   // Toronto-Dominion Bank
  'BMO': '0000927971',  // Bank of Montreal
  'BNS': '0000009631',  // Bank of Nova Scotia
  'CIBC': '0001045520'  // Canadian Imperial Bank of Commerce
} as const;

// SEC requires a proper User-Agent with company name, website and email
const USER_AGENT = 'Canadian Bank Industry Tracker (berto.martin@gmail.com)';

interface SECFiling {
  id: string;
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  acceptanceDateTime: string;
  act: string;
  form: string;
  fileNumber: string;
  filmNumber: string;
  items: string;
  size: number;
  isXBRL: number;
  isInlineXBRL: number;
  primaryDocument: string;
  primaryDocDescription: string;
}

interface SECResponse {
  cik: string;
  entityType: string;
  sic: string;
  sicDescription: string;
  insiderTransactionForOwnerExists: number;
  insiderTransactionForIssuerExists: number;
  name: string;
  tickers: string[];
  exchanges: string[];
  ein: string;
  description: string;
  website: string;
  investorWebsite: string;
  category: string;
  fiscalYearEnd: string;
  stateOfIncorporation: string;
  stateOfIncorporationDescription: string;
  addresses: {
    mailing: {
      street1: string;
      street2: string | null;
      city: string;
      stateOrCountry: string;
      zipCode: string;
      stateOrCountryDescription: string;
    };
    business: {
      street1: string;
      street2: string | null;
      city: string;
      stateOrCountry: string;
      zipCode: string;
      stateOrCountryDescription: string;
    };
  };
  phone: string;
  flags: string;
  formerNames: Array<{
    name: string;
    from: string;
    to: string;
  }>;
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      reportDate: string[];
      acceptanceDateTime: string[];
      act: string[];
      form: string[];
      fileNumber: string[];
      filmNumber: string[];
      items: string[];
      size: number[];
      isXBRL: number[];
      isInlineXBRL: number[];
      primaryDocument: string[];
      primaryDocDescription: string[];
    };
    files: Array<{
      name: string;
      filingCount: number;
      filingFrom: string;
      filingTo: string;
    }>;
  };
}

function transformFilings(data: SECResponse['filings']['recent']): SECFiling[] {
  const filings: SECFiling[] = [];
  const length = data.accessionNumber.length;

  for (let i = 0; i < length; i++) {
    filings.push({
      id: `${data.accessionNumber[i]}-${data.form[i]}`,
      accessionNumber: data.accessionNumber[i],
      filingDate: data.filingDate[i],
      reportDate: data.reportDate[i],
      acceptanceDateTime: data.acceptanceDateTime[i],
      act: data.act[i],
      form: data.form[i],
      fileNumber: data.fileNumber[i],
      filmNumber: data.filmNumber[i],
      items: data.items[i],
      size: data.size[i],
      isXBRL: data.isXBRL[i],
      isInlineXBRL: data.isInlineXBRL[i],
      primaryDocument: data.primaryDocument[i],
      primaryDocDescription: data.primaryDocDescription[i]
    });
  }

  return filings;
}

async function fetchFilings(cik: string): Promise<SECFiling[]> {
  // Add delay to respect rate limits
  await new Promise(resolve => setTimeout(resolve, 100));

  const response = await fetch(
    `https://data.sec.gov/submissions/CIK${cik.padStart(10, '0')}.json`,
    {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        'Host': 'data.sec.gov',
        'Accept-Encoding': 'gzip, deflate'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch SEC filings for CIK ${cik}: ${response.statusText}`);
  }

  const data: SECResponse = await response.json();
  return transformFilings(data.filings.recent);
}

async function getFilingText(accessionNumber: string, primaryDocument: string): Promise<string> {
  // Add delay to respect rate limits
  await new Promise(resolve => setTimeout(resolve, 100));

  // Format accession number by removing dashes
  const formattedAccession = accessionNumber.replace(/-/g, '');
  
  // Extract CIK from accession number (first part before the dash)
  const cik = accessionNumber.split('-')[0];
  
  // Format the URL according to SEC's structure
  const url = `https://www.sec.gov/Archives/edgar/data/${cik}/${formattedAccession}/${primaryDocument}`;
  
  console.log(`Fetching filing text from: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Host': 'www.sec.gov',
      'Accept-Encoding': 'gzip, deflate'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch filing text: ${response.statusText}`);
  }

  return response.text();
}

export async function scrapeSECFilings(): Promise<Article[]> {
  const articles: Article[] = [];
  console.log('Starting SEC filing scrape...');

  for (const [bankCode, cik] of Object.entries(BANK_CIKS)) {
    try {
      console.log(`Fetching filings for ${bankCode} (CIK: ${cik})...`);
      const filings = await fetchFilings(cik);
      console.log(`Found ${filings.length} total filings for ${bankCode}`);
      
      // Log all form types we find
      const formTypes = new Set(filings.map(f => f.form));
      console.log(`Form types found: ${Array.from(formTypes).join(', ')}`);
      
      // Filter for relevant filings from the last year
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const relevantFilings = filings.filter(f => {
        const filingDate = new Date(f.filingDate);
        // Validate the date is not in the future
        if (filingDate > new Date()) return false;
        
        const isRecent = filingDate >= oneYearAgo;
        const isRelevantForm = ['10-Q', '10-K', '6-K', '40-F'].includes(f.form);
        
        if (isRecent && !isRelevantForm) {
          console.log(`Found recent filing of type ${f.form} from ${f.filingDate}`);
        }
        
        return isRecent && isRelevantForm;
      });
      
      console.log(`Found ${relevantFilings.length} relevant filings for ${bankCode} in the last year`);

      for (const filing of relevantFilings) {
        try {
          console.log(`Processing ${filing.form} filing from ${filing.filingDate} for ${bankCode}...`);
          const filingText = await getFilingText(filing.accessionNumber, filing.primaryDocument);
          
          // Create a summary from the filing text (first few paragraphs)
          const summary = filingText
            .split('\n')
            .filter(line => line.trim().length > 0)
            .slice(0, 3)
            .join(' ')
            .slice(0, 500) + '...';

          // Check if the filing is AI-related
          const aiAnalysis = await isAIRelatedContent({
            title: `${bankCode} ${filing.form} - ${filing.filingDate}`,
            summary
          });

          // Format the link properly
          const formattedAccession = filing.accessionNumber.replace(/-/g, '');
          const cik = filing.accessionNumber.split('-')[0];
          const link = `https://www.sec.gov/Archives/edgar/data/${cik}/${formattedAccession}/${filing.primaryDocument}`;

          articles.push({
            title: `${bankCode} ${filing.form} Filing - ${filing.filingDate}`,
            link,
            publishDate: new Date(filing.filingDate).toISOString(),
            source: 'SEC EDGAR',
            bankCode,
            summary,
            aiRelevanceScore: aiAnalysis.isAIRelated ? aiAnalysis.confidence : 0,
            aiRelevanceReason: aiAnalysis.reason
          });
          console.log(`Successfully processed filing for ${bankCode}`);
        } catch (error) {
          console.error(`Error processing filing for ${bankCode}:`, error);
          continue;
        }
      }
    } catch (error) {
      console.error(`Error fetching SEC filings for ${bankCode}:`, error);
      continue;
    }
  }

  console.log(`SEC scraping complete. Found ${articles.length} filings.`);
  return articles;
} 