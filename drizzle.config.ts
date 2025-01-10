import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Parse connection string
const url = new URL(process.env.DATABASE_URL);
const [username, password] = (url.username && url.password) 
  ? [decodeURIComponent(url.username), decodeURIComponent(url.password)]
  : [];

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: url.hostname,
    port: parseInt(url.port || '5432'),
    user: username,
    password: password,
    database: url.pathname.slice(1), // Remove leading slash
    ssl: true,
  },
} satisfies Config; 