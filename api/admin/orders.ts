import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { parse } from 'cookie';

function isValidSession(cookieValue: string): boolean {
  try {
    const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8');
    const [pin] = decoded.split(':');
    const adminPin = (process.env.ADMIN_PIN || '').toString().trim();
    return pin.trim() === adminPin;
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Validate session
  const cookieHeader = req.headers.cookie || '';
  const cookies = parse(cookieHeader);
  const sessionToken = cookies['admin_session'];

  if (!sessionToken || !isValidSession(sessionToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Fallback for env
  if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
    process.env.POSTGRES_URL = process.env.DATABASE_URL;
  }

  try {
    const result = await sql`
      SELECT 
        id,
        order_number,
        created_at,
        customer_name,
        customer_phone,
        product_type,
        size,
        quantity,
        total_price,
        margins_settings,
        customer_notes,
        upload_method,
        upload_link,
        drive_folder_url,
        payment_status,
        order_status,
        discount,
        material_cost_override
      FROM orders
      ORDER BY created_at DESC;
    `;

    return res.status(200).json({ orders: result.rows });
  } catch (error: any) {
    console.error('Admin Orders Fetch Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
