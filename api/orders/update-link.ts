import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { sendTelegramNotification, escapeHTML } from './../../lib/telegram.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { orderNumber, uploadMethod, uploadLink } = req.body;

    if (!orderNumber || !uploadMethod) {
      return res.status(400).json({ error: 'Missing orderNumber or uploadMethod' });
    }

    // Validate method value
    const validMethods = ['gallery', 'link', 'whatsapp'];
    if (!validMethods.includes(uploadMethod)) {
      return res.status(400).json({ error: `Invalid uploadMethod. Must be one of: ${validMethods.join(', ')}` });
    }

    if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
      process.env.POSTGRES_URL = process.env.DATABASE_URL;
    }

    const result = await sql`
      UPDATE orders 
      SET 
        upload_method = ${uploadMethod},
        upload_link = ${uploadLink || null},
        drive_folder_url = CASE 
          WHEN ${uploadMethod} IN ('gallery', 'link') THEN ${uploadLink || null} 
          ELSE drive_folder_url 
        END
      WHERE order_number = ${orderNumber}
      RETURNING id, order_number, customer_name, customer_phone, upload_method, upload_link;
    `;

    if (result.rowCount === 0) {
      console.error(`Order ${orderNumber} not found in database.`);
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = result.rows[0];

    // Trigger Telegram Notification
    try {
      const msg = `
📦 <b>מספר הזמנה:</b> ${escapeHTML(order.order_number)}
👤 <b>שם לקוח:</b> ${escapeHTML(order.customer_name)}
📞 <b>טלפון:</b> ${escapeHTML(order.customer_phone)}
📂 <b>שיטת העלאה:</b> ${escapeHTML(order.upload_method)}
🔗 <b>קישור לקבצים:</b> ${escapeHTML(order.upload_link || 'לא צורף קישור')}
      `.trim();
      
      await sendTelegramNotification(msg);
      console.log(`✅ Telegram notification sent for order ${order.order_number}`);
    } catch (tgErr: any) {
      console.error(`❌ Telegram notification failed for order ${order.order_number}:`, tgErr.message || tgErr);
      // We don't fail the request if just notification fails
    }

    return res.status(200).json({
      success: true,
      order: order
    });

  } catch (error: any) {
    console.error("Update Order Upload Info Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
