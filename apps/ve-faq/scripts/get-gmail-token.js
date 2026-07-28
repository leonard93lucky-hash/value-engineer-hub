import { google } from 'googleapis';
import { readFileSync } from 'fs';
import http from 'http';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const REDIRECT_PORT = 3003;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;

async function getToken() {
  const secretPath = process.argv[2] || 'gmail api/client_secret_461983549851-fcao6590h6ijcoqbhc5eoic79n8653lk.apps.googleusercontent.com.json';
  const content = JSON.parse(readFileSync(secretPath, 'utf-8'));
  const { client_id, client_secret } = content.web;

  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('\n============================================================');
  console.log('  Open this URL in your browser:');
  console.log('============================================================\n');
  console.log(authUrl);
  console.log('\n============================================================');
  console.log(`  A local server will start on :${REDIRECT_PORT} to catch the code.`);
  console.log('============================================================\n');

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, REDIRECT_URI);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`<h1>Error: ${error}</h1><p>${url.searchParams.get('error_description') || ''}</p>`);
      return;
    }

    if (!code) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>Waiting for authorization code...</h1>');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>✅ Authorization received! You can close this tab.</h1>');

    server.close();

    try {
      const { tokens } = await oauth2Client.getToken(code);

      console.log('\n============================================================');
      console.log('  SUCCESS! Add these to your .env file:');
      console.log('============================================================\n');
      console.log(`GMAIL_CLIENT_ID=${client_id}`);
      console.log(`GMAIL_CLIENT_SECRET=${client_secret}`);
      console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log(`GMAIL_USER=<the-email-you-signed-in-with>\n`);
    } catch (err) {
      console.error('\n❌ Failed to exchange code for token:', err.message);
    }
  });

  server.listen(REDIRECT_PORT, () => {
    console.log(`   Listening on ${REDIRECT_URI}...`);
    console.log(`   (waiting for redirect after you authorize)\n`);
  });
}

getToken().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
