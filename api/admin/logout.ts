import { VercelRequest, VercelResponse } from '@vercel/node';
import { serialize } from 'cookie';
import { handleCors } from '../../lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!handleCors(req, res, 'POST,OPTIONS')) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Clear the session cookie
  const cookie = serialize('admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ success: true });
}
