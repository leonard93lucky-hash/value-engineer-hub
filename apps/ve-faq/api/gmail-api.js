import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

function getAuthClient() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'urn:ietf:wg:oauth:2.0:oob');
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

function buildEmailRaw(to, subject, html) {
  const from = process.env.GMAIL_USER || '';
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const bodyBase64 = Buffer.from(html, 'utf-8').toString('base64');
  const raw = [
    `From: "Privy VE Team" <${from}>`,
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    bodyBase64,
  ].join('\r\n');
  return Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sendEmail({ to, subject, html }) {
  const auth = getAuthClient();
  if (!auth) {
    console.log('ℹ️ Gmail API not configured. Skipping email send.');
    return { sent: false, reason: 'GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, or GMAIL_REFRESH_TOKEN not set' };
  }

  const gmail = google.gmail({ version: 'v1', auth });
  const raw = buildEmailRaw(to, subject, html);

  try {
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
    console.log(`✉️ Email sent via Gmail API to ${to}`);
    return { sent: true };
  } catch (err) {
    console.error('❌ Gmail API send failed:', err.message);
    return { sent: false, reason: err.message };
  }
}
