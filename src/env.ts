import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

export function getEnvVar(key: string): string {
  const value = process.env[key]?.trim();
  
  if (!value) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Warning: Missing environment variable: ${key}`);
      return 'dummy-value-for-development';
    }
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export const env = {
  OPENAI_API_KEY: getEnvVar('OPENAI_API_KEY'),
} as const; 