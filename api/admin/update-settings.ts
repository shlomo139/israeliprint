import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { checkAuth } from '../../lib/auth.js';
import { handleCors } from '../../lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!handleCors(req, res, 'POST,OPTIONS')) return;
  
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { banner_mode, banner_image_url, banner_bg_color, banner_title, banner_subtitle } = req.body;

    try {
      await sql`ALTER TABLE site_settings ADD COLUMN banner_image_url VARCHAR(1024);`;
    } catch (e) { /* ignore */ }
    try {
      await sql`ALTER TABLE site_settings ADD COLUMN banner_mode VARCHAR(50) DEFAULT 'text';`;
    } catch (e) { /* ignore */ }
    try {
      await sql`ALTER TABLE site_settings ADD COLUMN banner_title VARCHAR(255);`;
    } catch (e) { /* ignore */ }
    try {
      await sql`ALTER TABLE site_settings ADD COLUMN banner_subtitle VARCHAR(255);`;
    } catch (e) { /* ignore */ }
    try {
      await sql`ALTER TABLE site_settings ADD COLUMN banner_bg_color VARCHAR(50);`;
    } catch (e) { /* ignore */ }

    await sql`
      INSERT INTO site_settings (id, banner_mode, banner_image_url, banner_bg_color, banner_title, banner_subtitle)
      VALUES (
        1, 
        ${banner_mode || 'text'}, 
        ${banner_image_url || ''}, 
        ${banner_bg_color || 'bg-yisraeli-blue'}, 
        ${banner_title || ''}, 
        ${banner_subtitle || ''}
      )
      ON CONFLICT (id) DO UPDATE SET 
        banner_mode = EXCLUDED.banner_mode,
        banner_image_url = EXCLUDED.banner_image_url,
        banner_bg_color = EXCLUDED.banner_bg_color,
        banner_title = EXCLUDED.banner_title,
        banner_subtitle = EXCLUDED.banner_subtitle;
    `;
    
    return res.status(200).json({ success: true, message: 'Site popup layout configuration effectively synced!' });
  } catch (error: any) {
    console.error('Settings Update Override Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
