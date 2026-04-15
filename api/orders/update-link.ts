import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderNumber, driveFolderUrl } = req.body;

    if (!orderNumber || !driveFolderUrl) {
      return res.status(400).json({ error: 'Missing orderNumber or driveFolderUrl' });
    }

    if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
      process.env.POSTGRES_URL = process.env.DATABASE_URL;
    }

    const result = await sql`
      UPDATE orders 
      SET drive_folder_url = ${driveFolderUrl}
      WHERE order_number = ${orderNumber}
      RETURNING id, order_number;
    `;

    if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Order not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Link updated successfully'
    });

  } catch (error: any) {
    console.error("Update Order Link Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
