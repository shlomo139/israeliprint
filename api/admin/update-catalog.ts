import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

const checkAuth = (req: VercelRequest) => {
  const cookies = req.headers.cookie || '';
  return cookies.includes('admin_session=');
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  // if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized access' });
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
      const { id, category_id, name, image_url, cost_price, status, tiers, kit_images } = payload;

      // Block Saving Process -> Ensure COST_PRICE acts as a rigid anchor
      if (cost_price === undefined || cost_price === null || cost_price === '') {
        return res.status(400).json({ error: 'חובה להזין מחיר עלות למוצר לצורך מעקב רווחים (Cost Price Required).' });
      }

      await sql`
        INSERT INTO products (id, category_id, name, image_url, cost_price, status, tiers, kit_images)
        VALUES (${id}, ${category_id}, ${name}, ${image_url}, ${cost_price}, ${status}, ${JSON.stringify(tiers)}, ${kit_images ? JSON.stringify(kit_images) : null})
        ON CONFLICT (id) DO UPDATE SET
          category_id=EXCLUDED.category_id, name=EXCLUDED.name, image_url=EXCLUDED.image_url, 
          cost_price=EXCLUDED.cost_price, status=EXCLUDED.status, tiers=EXCLUDED.tiers, kit_images=EXCLUDED.kit_images;
      `;
      return res.status(200).json({ success: true, message: 'Item synched including JSON hierarchies and discounts' });
    }

    return res.status(400).json({ error: 'Invalid Payload Action ID provided' });
  } catch (error: any) {
    console.error('Catalog UPSERT Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
