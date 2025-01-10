import { Pool } from 'pg';

export const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'canadian_banks_ai',
  password: '', // Default empty for local Postgres
  port: 5432,
}); 