import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function check() {
  try {
    const res = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='products'`;
    console.log("Columns:", res.rows.map(r => r.column_name));
    
    const settings = await sql`SELECT * FROM site_settings`;
    console.log("Settings:", settings.rows);

    const prods = await sql`SELECT id, promo FROM products LIMIT 1`;
    console.log("Promo data sample:", prods.rows);
  } catch(e) {
    console.log("error", e);
  }
}
check();
