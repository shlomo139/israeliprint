import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
import path from 'path';

// Load the local .env file explicitly manually
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function createTable() {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) {
      console.error("❌ Error: Missing POSTGRES_URL or DATABASE_URL in .env file.");
      console.error("Please add POSTGRES_URL=postgres://... before running this script.");
      process.exit(1);
  }

  // Update the url to Vercel Postgres env dynamically
  process.env.POSTGRES_URL = url;

  try {
    console.log('🔄 Connecting to Database...');
    console.log("Creating 'orders' table if it doesn't exist...");
    
    const result = await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        order_number VARCHAR(10) UNIQUE,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        product_type VARCHAR(100) NOT NULL,
        size VARCHAR(100),
        quantity INTEGER NOT NULL,
        margins_settings VARCHAR(255),
        customer_notes TEXT,
        total_price DECIMAL(10, 2) NOT NULL,
        drive_folder_url VARCHAR(1024),
        upload_method VARCHAR(20),
        upload_link TEXT,
        payment_status VARCHAR(50) DEFAULT 'pending',
        order_status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log('✅ Table "orders" verified/created successfully!');
    
    console.log('🔄 Checking for missing columns...');
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(10) UNIQUE;`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS upload_method VARCHAR(20);`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS upload_link TEXT;`;
    console.log('✅ Columns verified!');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating orders table:', error);
    process.exit(1);
  }
}

createTable();
