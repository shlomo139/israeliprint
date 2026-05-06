import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { handleCors } from '../../lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!handleCors(req, res, 'GET,OPTIONS,PATCH,DELETE,POST,PUT')) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
        customerName, 
        customerPhone, 
        productType, 
        size, 
        quantity, 
        marginsSettings, 
        customerNotes, 
        totalPrice, 
        driveFolderUrl 
    } = req.body;

    if (!customerName || !customerPhone || !productType || !quantity || typeof totalPrice === 'undefined') {
      return res.status(400).json({ error: 'Missing required parameters (name, phone, product, quantity, price).' });
    }

    // Check environment var fallback for standard @vercel/postgres operation
    if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
      process.env.POSTGRES_URL = process.env.DATABASE_URL;
    }

    // Generate a secure 5-digit order number
    const orderNumber = Math.floor(10000 + Math.random() * 90000).toString();

    const result = await sql`
      INSERT INTO orders (
        order_number,
        customer_name, 
        customer_phone, 
        product_type, 
        size, 
        quantity, 
        margins_settings, 
        customer_notes, 
        total_price, 
        drive_folder_url
      ) VALUES (
        ${orderNumber},
        ${customerName}, 
        ${customerPhone}, 
        ${productType}, 
        ${size || null}, 
        ${quantity},
        ${marginsSettings || null}, 
        ${customerNotes || null}, 
        ${totalPrice}, 
        ${driveFolderUrl || null}
      )
      RETURNING id, order_number, created_at;
    `;

    console.log(`✅ Order ${orderNumber} created successfully in DB.`);

    return res.status(200).json({
      success: true,
      order: result.rows[0]
    });

  } catch (error: any) {
    console.error("❌ Create Order Error:", error.message || error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
