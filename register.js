require('dotenv').config();
const fetch = require('node-fetch');

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const CALLBACK_URL = process.env.WEBHOOK_CALLBACK;
const WEBHOOK_SECRET = process.env.TWITCH_SECRET;
const USER_ID = process.env.TWITCH_USER_ID;

async function getAppToken() {
  const res = await fetch(`https://id.twitch.tv/oauth2/token`, {
    method: 'POST',
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });
  const data = await res.json();
  return data.access_token;
}

async function registerWebhook(token) {
  const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
    method: 'POST',
    headers: {
      'Client-ID': CLIENT_ID,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'channel.follow',
      version: '1',
      condition: {
        broadcaster_user_id: USER_ID,
      },
      transport: {
        method: 'webhook',
        callback: `${CALLBACK_URL}/webhook`,
        secret: WEBHOOK_SECRET,
      },
    }),
  });

  const data = await response.json();
  console.log(data);
}

(async () => {
  const token = await getAppToken();
  await registerWebhook(token);
})();
