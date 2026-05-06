import { VercelRequest } from '@vercel/node';
import { parse } from 'cookie';

export function isValidSession(cookieValue: string): boolean {
  try {
    const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8');
    const [pin] = decoded.split(':');
    const adminPin = (process.env.ADMIN_PIN || '').toString().trim();
    return pin.trim() === adminPin;
  } catch {
    return false;
  }
}

export function checkAuth(req: VercelRequest): boolean {
  const cookieHeader = req.headers.cookie || '';
  const cookies = parse(cookieHeader);
  const sessionToken = cookies['admin_session'];
  
  if (!sessionToken || !isValidSession(sessionToken)) {
    return false;
  }
  
  return true;
}
