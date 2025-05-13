// registerWebhook.js
require('dotenv').config();
const fetch = require('node-fetch');

// Load values from .env
const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const ACCESS_TOKEN = process.env.TWITCH_ACCESS_TOKEN; // this is a *user access token*
const CALLBACK_URL = process.env.WEBHOOK_CALLBACK;
const WEBHOOK_SECRET = process.env.TWITCH_SECRET;
const USER_ID = process.env.TWITCH_USER_ID; // broadcaster's Twitch user ID

// Add this before registerWebhook()
async function verifyTokenOwner() {
  const res = await fetch('https://api.twitch.tv/helix/users', {
    headers: {
      'Client-ID': CLIENT_ID,
      'Authorization': `Bearer ${ACCESS_TOKEN}`
    }
  });

  const data = await res.json();
  const tokenUserId = data.data?.[0]?.id;
  const tokenLogin = data.data?.[0]?.login;

  console.log(`🔍 Token belongs to: ${tokenLogin} (ID: ${tokenUserId})`);
  console.log(`📌 Target broadcaster_user_id: ${USER_ID}`);

  if (tokenUserId !== USER_ID) {
    console.error('❌ Mismatch: The token does not belong to the specified broadcaster_user_id.');
    return false;
  }

  return true;
}
// Function to register EventSub webhook for channel.follow
async function registerWebhook() {
  try {
    const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
      method: 'POST',
      headers: {
        'Client-ID': CLIENT_ID,
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'channel.follow',
        version: '1',
        condition: {
          broadcaster_user_id: USER_ID
        },
        transport: {
          method: 'webhook',
          callback: `${CALLBACK_URL}/webhook`,
          secret: WEBHOOK_SECRET
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Twitch API error:', data);
    } else {
      console.log('✅ Webhook registered successfully:', data);
    }

  } catch (err) {
    console.error('❌ Network or parsing error:', err.message);
  }
}

// Run the function
registerWebhook();
