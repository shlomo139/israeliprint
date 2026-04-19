import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function setupDatabase() {
  console.log('Starting execution of database setup...');
  
  try {
    // 1. Categories Table
    console.log('Creating categories table...');
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        path VARCHAR(255) NOT NULL,
        image_url VARCHAR(1024)
      );
    `;

    // 2. Products Table
    // Exact match to existing frontend logic: using JSONB for tiers array and kitImages
    console.log('Creating products table...');
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        category_id VARCHAR(255) REFERENCES categories(id),
        name VARCHAR(255) NOT NULL,
        image_url VARCHAR(1024),
        cost_price DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'active',
        tiers JSONB NOT NULL,
        kit_images JSONB
      );
    `;

    // 3. Site Settings Table
    // Supports alternating between dynamic text/color banner OR a custom designed flyer/image
    console.log('Creating site_settings table...');
    await sql`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        banner_mode VARCHAR(50) DEFAULT 'text', -- Options: 'text' | 'image_only'
        banner_image_url VARCHAR(1024),
        banner_bg_color VARCHAR(50) DEFAULT 'bg-yisraeli-blue',
        banner_title VARCHAR(255) DEFAULT 'ישראלי - מדפיסים רגעים של אושר',
        banner_subtitle VARCHAR(255) DEFAULT 'דואגים לכם לשירות מהיר ואיכותי'
      );
    `;

    console.log('✅ Database tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating database tables:', error);
    process.exit(1);
  }
}

setupDatabase();
