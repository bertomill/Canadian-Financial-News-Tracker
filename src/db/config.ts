import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/env';

// Use connection string from environment variable
const connectionString = env.DATABASE_URL;

// Create postgres client
const client = postgres(connectionString, { 
  ssl: 'require',
  max: 1 // Limit connections for serverless environment
});

// Create drizzle database instance
export const db = drizzle(client);

// Export client for direct queries if needed
export { client }; 