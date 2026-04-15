import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testDrive() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  const email = process.env.GOOGLE_CLIENT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;
  const folderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  if (!folderId || (!(clientId && clientSecret && refreshToken) && (!email || !key))) {
    console.error("❌ Missing Google Drive environment variables in .env");
    process.exit(1);
  }

  try {
    let auth;
    if (clientId && clientSecret && refreshToken) {
      console.log("🔄 Authenticating with Google Drive using user OAuth Refresh Token...");
      auth = new google.auth.OAuth2(clientId, clientSecret);
      auth.setCredentials({ refresh_token: refreshToken });
    } else {
      console.log("🔄 Authenticating with Google Drive as service account:", email);
      key = key?.replace(/\\n/g, '\n');
      auth = new google.auth.GoogleAuth({
        credentials: { client_email: email, private_key: key },
        scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
      });
    }

    const drive = google.drive({ version: 'v3', auth });

    console.log(`🔄 Checking access to folder ID: ${folderId}...`);
    const res = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, mimeType',
    });

    if (res.data) {
      console.log("✅ Success! Connected to Google Drive.");
      console.log(`📁 Target folder found: "${res.data.name}"`);
    }

  } catch (error: any) {
    console.error("❌ Google Drive Connection Failed!");
    console.error(error.message || error);
    process.exit(1);
  }
}

testDrive();
