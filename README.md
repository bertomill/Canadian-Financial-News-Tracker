# Canadian Financial News Tracker

This project tracks news and updates from major Canadian financial institutions. It automatically scrapes news from bank websites, analyzes content using OpenAI's API, and presents the findings in a clean web interface.

## Features

- Automated news scraping from major Canadian financial institutions (RBC, TD, BMO, Scotiabank, CIBC)
- Content analysis using OpenAI's GPT models
- Clean web interface to view and filter articles
- Database storage with PostgreSQL
- Article relevance scoring and reasoning

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables in `.env.local`:
```
OPENAI_API_KEY=your_key_here
POSTGRES_USER=your_user
POSTGRES_HOST=localhost
POSTGRES_DB=your_db
POSTGRES_PASSWORD=your_password
POSTGRES_PORT=5432
```

4. Set up the database:
```bash
npx tsx src/scripts/test-db.ts
```

5. Run the development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start the development server
- `npx tsx src/scripts/reset-and-analyze.ts` - Reset and analyze all articles
- `npx tsx src/scripts/generate-articles-report.ts` - Generate an HTML report
- `npx tsx src/scripts/test-bmo-scraper.ts` - Test the BMO scraper
- `npx tsx src/scripts/test-td-scraper.ts` - Test the TD scraper
- `npx tsx src/scripts/test-rbc-scraper.ts` - Test the RBC scraper

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- PostgreSQL
- OpenAI API
- Puppeteer for web scraping
- TailwindCSS for styling
