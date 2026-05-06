import { VercelRequest, VercelResponse } from '@vercel/node';
import { serialize } from 'cookie';
import { handleCors } from '../../lib/cors.js';

const ADMIN_SESSION_TOKEN = 'admin_session';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!handleCors(req, res, 'POST,OPTIONS')) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ error: 'PIN is required' });
    }

    const adminPin = process.env.ADMIN_PIN;
    
    // Diagnostic log (internal)
    console.log(`[Auth Diagnostic] Attempting login. ADMIN_PIN from env exists: ${!!adminPin}`);

    if (!adminPin) {
      console.error('ADMIN_PIN environment variable is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Use trim() to avoid whitespace issues
    if (pin.toString().trim() !== adminPin.toString().trim()) {
      return res.status(401).json({ error: 'קוד PIN שגוי' });
    }

    // Generate a simple session token (combine PIN hash with timestamp)
    const sessionValue = Buffer.from(`${adminPin.toString().trim()}:${Date.now()}`).toString('base64');

    // Set secure httpOnly cookie (7 days)
    const cookie = serialize(ADMIN_SESSION_TOKEN, sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('Admin Login Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
