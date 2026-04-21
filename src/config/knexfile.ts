import type { Knex } from "knex";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// import path from 'path';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..');
dotenv.config({ path: join(rootDir, '.env') });

const config: Knex.Config = {
  client: 'pg',
  connection: {
    host: 'aws-1-ap-northeast-2.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.njtfmuylfdybprzhgjyx',
    password: '3n2KuPz4eDklKE74',
    ssl: { rejectUnauthorized: false }
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: join(__dirname, '..', 'migrations'),
    extension: 'ts',
  },
  seeds: {
    directory: join(__dirname, '..', 'seeds'),
    extension: 'ts',
  },
};

export default config;