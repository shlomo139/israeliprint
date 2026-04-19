import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrate() {
  try {
    console.log('Adding promo column...');
    await sql`ALTER TABLE products ADD COLUMN promo JSONB;`;
    console.log('Success!');
  } catch (e) {
    console.log('Error or already exists', e);
  }
}
migrate();
