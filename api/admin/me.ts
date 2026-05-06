import { VercelRequest, VercelResponse } from '@vercel/node';
import { checkAuth, isValidSession } from '../../lib/auth.js';
import { handleCors } from '../../lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!handleCors(req, res, 'GET,OPTIONS')) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!checkAuth(req)) {
    return res.status(401).json({ authenticated: false });
  }

  return res.status(200).json({ authenticated: true });
}

// Export the validator for use in other API files
export { isValidSession };
