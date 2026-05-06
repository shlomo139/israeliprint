import { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import { checkAuth } from '../../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { filename } = req.query as { filename?: string };
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required in query (?filename=...)' });
    }

    // Connects to Vercel string stream
    const blob = await put(filename, req, { access: 'public' });
    
    return res.status(200).json({ success: true, url: blob.url });
  } catch (error: any) {
    console.error('Blob Upload Core Error:', error);
    return res.status(500).json({ error: error.message || 'Upload execution failed. Are your Vercel Blob keys present?' });
  }
}

// Crucial step: bypassing node's standard parsing so putting the whole stream to the bucket works.
export const config = {
  api: {
    bodyParser: false,
  },
};
