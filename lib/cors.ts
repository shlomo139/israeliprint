import { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = [
  'https://israeliprint.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173'
];

export function handleCors(req: VercelRequest, res: VercelResponse, allowedMethods: string): boolean {
  const originHeader = req.headers.origin;
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;

  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // Reject unauthorized foreign origins
      res.status(403).json({ error: 'CORS policy violation: Origin not allowed' });
      return false; // Stop execution
    }
  } else {
    // If no origin is provided (server-to-server or same-origin fallback)
    res.setHeader('Access-Control-Allow-Origin', 'https://israeliprint.vercel.app');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', allowedMethods);
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false; // Stop execution for preflight
  }

  return true; // Continue execution
}
