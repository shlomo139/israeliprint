import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS setup for public API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const categoriesResult = await sql`SELECT * FROM categories`;
    const productsResult = await sql`SELECT * FROM products WHERE status = 'active'`;
    const settingsResult = await sql`SELECT * FROM site_settings WHERE id = 1`;

    const inventoryData = {
      categories: categoriesResult.rows,
      products: productsResult.rows.map(p => ({
        id: p.id,
        category: p.category_id,
        name: p.name,
        imageUrl: p.image_url,
        costPrice: p.cost_price, // Will be filtered out later if not needed on front, but crucial for admin logic if they reuse it
        status: p.status,
        tiers: p.tiers, // Maps directly with discount percentages
        kitImages: p.kit_images
      })),
      settings: settingsResult.rows[0] || null
    };

    return res.status(200).json({ success: true, data: inventoryData });
  } catch (error: any) {
    console.error('Inventory Fetch Error:', error);
    return res.status(500).json({ error: 'Failed to fetch inventory from database.' });
  }
}
