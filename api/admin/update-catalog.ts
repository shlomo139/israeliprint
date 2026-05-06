import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { checkAuth } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { action, payload } = req.body;

    if (action === 'upsert_category') {
      const { id, name, path, image_url } = payload;
      await sql`
        INSERT INTO categories (id, name, path, image_url)
        VALUES (${id}, ${name}, ${path}, ${image_url})
        ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, path=EXCLUDED.path, image_url=EXCLUDED.image_url;
      `;
      return res.status(200).json({ success: true, message: 'Category synched directly' });

    } else if (action === 'upsert_product') {
      const { id, category_id, name, image_url, cost_price, status, tiers, kit_images, promo } = payload;

      // Ensure promo column exists
      try {
        await sql`ALTER TABLE products ADD COLUMN promo JSONB;`;
      } catch(e) { /* ignore if already exists */ }

      // Block Saving Process -> Ensure COST_PRICE acts as a rigid anchor
      if (cost_price === undefined || cost_price === null || cost_price === '') {
        return res.status(400).json({ error: 'חובה להזין מחיר עלות למוצר לצורך מעקב רווחים (Cost Price Required).' });
      }

      await sql`
        INSERT INTO products (id, category_id, name, image_url, cost_price, status, tiers, kit_images, promo)
        VALUES (${id}, ${category_id}, ${name}, ${image_url}, ${cost_price}, ${status}, ${JSON.stringify(tiers)}, ${kit_images ? JSON.stringify(kit_images) : null}, ${promo ? JSON.stringify(promo) : null})
        ON CONFLICT (id) DO UPDATE SET
          category_id=EXCLUDED.category_id, name=EXCLUDED.name, image_url=EXCLUDED.image_url, 
          cost_price=EXCLUDED.cost_price, status=EXCLUDED.status, tiers=EXCLUDED.tiers, kit_images=EXCLUDED.kit_images, promo=EXCLUDED.promo;
      `;
      return res.status(200).json({ success: true, message: 'Item synched including JSON hierarchies and discounts' });
    } else if (action === 'delete_product') {
      const { id } = payload;
      await sql`DELETE FROM products WHERE id = ${id}`;
      return res.status(200).json({ success: true, message: 'Item deleted' });

    } else if (action === 'delete_category') {
      const { id } = payload;
      // also delete all products in this category? Let the foreign key handle it if CASCADE, or just let users know.
      await sql`DELETE FROM categories WHERE id = ${id}`;
      return res.status(200).json({ success: true, message: 'Category deleted' });
      
    }

    return res.status(400).json({ error: 'Invalid Payload Action ID provided' });
  } catch (error: any) {
    console.error('Catalog UPSERT Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
