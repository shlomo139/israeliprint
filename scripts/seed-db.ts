import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
import path from 'path';

import { CATEGORY_DETAILS } from '../constants.js';
import { ALL_PRODUCTS } from '../data/products.js';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedDatabase() {
  console.log('Starting execution of data seeding...');

  try {
    // 1. Seed Categories
    console.log('Seeding categories...');
    for (const key of Object.keys(CATEGORY_DETAILS)) {
      const cat = CATEGORY_DETAILS[key as keyof typeof CATEGORY_DETAILS];
      await sql`
        INSERT INTO categories (id, name, path)
        VALUES (${cat.category}, ${cat.name}, ${cat.path})
        ON CONFLICT (id) DO UPDATE SET 
          name = EXCLUDED.name,
          path = EXCLUDED.path;
      `;
    }
    console.log('Categories seeded.');

    // 2. Seed Products
    console.log('Seeding products...');
    for (const prod of ALL_PRODUCTS) {
      await sql`
        INSERT INTO products (id, category_id, name, image_url, cost_price, status, tiers, kit_images)
        VALUES (
          ${prod.id}, 
          ${prod.category}, 
          ${prod.name}, 
          ${prod.imageUrl}, 
          ${prod.costPrice || null}, 
          'active', 
          ${JSON.stringify(prod.tiers)}, 
          ${prod.kitImages ? JSON.stringify(prod.kitImages) : null}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          image_url = EXCLUDED.image_url,
          cost_price = EXCLUDED.cost_price,
          status = EXCLUDED.status,
          tiers = EXCLUDED.tiers,
          kit_images = EXCLUDED.kit_images;
      `;
    }
    console.log('Products seeded.');

    // 3. Seed initial site settings
    console.log('Seeding site_settings...');
    await sql`
      INSERT INTO site_settings (id, banner_mode, banner_title, banner_subtitle, banner_bg_color)
      VALUES (
        1, 
        'text', 
        'ישראלי - מדפיסים רגעים של אושר', 
        'דואגים לכם לשירות מהיר ואיכותי', 
        'bg-yisraeli-blue'
      )
      ON CONFLICT (id) DO NOTHING;
    `;
    console.log('Site settings seeded.');

    console.log('✅ All data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
