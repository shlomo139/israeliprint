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
    const { banner_mode, banner_image_url, banner_bg_color, banner_title, banner_subtitle } = req.body;

    await sql`
      UPDATE site_settings
      SET 
        banner_mode = COALESCE(${banner_mode}, banner_mode),
        banner_image_url = COALESCE(${banner_image_url}, banner_image_url),
        banner_bg_color = COALESCE(${banner_bg_color}, banner_bg_color),
        banner_title = COALESCE(${banner_title}, banner_title),
        banner_subtitle = COALESCE(${banner_subtitle}, banner_subtitle)
      WHERE id = 1;
    `;
    
    return res.status(200).json({ success: true, message: 'Site popup layout configuration effectively synced!' });
  } catch (error: any) {
    console.error('Settings Update Override Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
