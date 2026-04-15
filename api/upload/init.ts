import { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Since this is a public frontend
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerName, customerPhone, files, orderNumber } = req.body;
    
    if (!customerName || !customerPhone || !orderNumber || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Missing required parameters (including orderNumber)' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    const email = process.env.GOOGLE_CLIENT_EMAIL;
    let key = process.env.GOOGLE_PRIVATE_KEY;
    const parentFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

    if (!parentFolderId || (!(clientId && clientSecret && refreshToken) && (!email || !key))) {
      console.error("Missing Google Drive variables");
      return res.status(500).json({ error: 'Server configuration error' });
    }

    let auth;
    if (clientId && clientSecret && refreshToken) {
      auth = new google.auth.OAuth2(clientId, clientSecret);
      auth.setCredentials({ refresh_token: refreshToken });
    } else {
      key = key?.replace(/\\n/g, '\n');
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: email,
          private_key: key,
        },
        scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
      });
    }

    const drive = google.drive({ version: 'v3', auth });

    // Create a new folder for this specific order
    const folderRes = await drive.files.create({
      requestBody: {
        name: `הזמנה ${orderNumber} - ${customerName}`,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId]
      },
      fields: 'id, webViewLink'
    });

    const folderId = folderRes.data.id;
    const folderUrl = folderRes.data.webViewLink;

    if (!folderId) {
      throw new Error("Failed to create folder");
    }

    // Get access token for the raw HTTP request to create Resumable Upload Sessions
    let token: string | null | undefined;
    if (typeof auth.getClient === 'function') {
      const client = await auth.getClient();
      const res = await client.getAccessToken();
      token = res.token;
    } else {
      // auth is already an OAuth2Client
      const res = await auth.getAccessToken();
      token = res.token;
    }

    if (!token) {
        throw new Error("Failed to get access token");
    }

    const uploadUrls: { fileName: string; uploadUrl: string }[] = [];

    // Create a resumable upload session URI for each file
    for (const f of files) {
      const meta = {
        name: f.name,
        parents: [folderId]
      };

      const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': f.mimeType || 'application/octet-stream',
          'Origin': req.headers.origin || 'http://localhost:3001'
        },
        body: JSON.stringify(meta)
      });

      if (initRes.ok) {
        // The Location header contains the unique URI for the client to PUT bytes to
        const location = initRes.headers.get('location');
        if (location) {
          uploadUrls.push({
            fileName: f.name,
            uploadUrl: location
          });
        }
      } else {
        console.error("Failed to init upload for file", f.name, await initRes.text());
      }
    }

    return res.status(200).json({
      success: true,
      folderId,
      folderUrl,
      uploadUrls
    });

  } catch (error: any) {
    console.error("Upload Init Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
