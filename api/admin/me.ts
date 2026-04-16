import { VercelRequest, VercelResponse } from '@vercel/node';
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

  const cookieHeader = req.headers.cookie || '';
  const cookies = parse(cookieHeader);
  const sessionToken = cookies['admin_session'];

  if (!sessionToken || !isValidSession(sessionToken)) {
    return res.status(401).json({ authenticated: false });
  }

  return res.status(200).json({ authenticated: true });
}

// Export the validator for use in other API files
export { isValidSession };
