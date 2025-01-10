import * as dotenv from 'dotenv';
import { join } from 'path';

// Load env vars
dotenv.config({ path: join(process.cwd(), '.env.local') });

console.log('Environment check:');
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY starts with:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...'); 