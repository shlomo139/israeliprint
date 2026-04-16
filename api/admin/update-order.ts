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
  res.setHeader('Access-Control-Allow-Methods', 'PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  // Validate session
  const cookieHeader = req.headers.cookie || '';
  const cookies = parse(cookieHeader);
  const sessionToken = cookies['admin_session'];

  if (!sessionToken || !isValidSession(sessionToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
    process.env.POSTGRES_URL = process.env.DATABASE_URL;
  }

  try {
    const { orderId, payment_status, order_status, discount, material_cost_override, special_price, discount_percent } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const result = await sql`
      UPDATE orders
      SET
        payment_status          = COALESCE(${payment_status ?? null}, payment_status),
        order_status            = COALESCE(${order_status ?? null}, order_status),
        discount                = COALESCE(${discount ?? null}::NUMERIC, discount),
        material_cost_override  = COALESCE(${material_cost_override ?? null}::NUMERIC, material_cost_override),
        special_price           = COALESCE(${special_price ?? null}::NUMERIC, special_price),
        discount_percent        = COALESCE(${discount_percent ?? null}::NUMERIC, discount_percent)
      WHERE id = ${orderId}
      RETURNING 
        id, order_number, payment_status, order_status, discount, material_cost_override, special_price, discount_percent;
    `;

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.status(200).json({ success: true, order: result.rows[0] });

  } catch (error: any) {
    console.error('Admin Update Order Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
