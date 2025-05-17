require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

let isLive = false; // <-- TRACK STREAM STATUS HERE

// Middleware to verify Twitch signature
app.use(express.json({
  verify: (req, res, buf) => {
    const messageId = req.headers['twitch-eventsub-message-id'];
    const timestamp = req.headers['twitch-eventsub-message-timestamp'];
    const signature = req.headers['twitch-eventsub-message-signature'];
    const secret = process.env.TWITCH_SECRET;

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(messageId + timestamp + buf);
    const expected = `sha256=${hmac.digest('hex')}`;

    req.validTwitchSignature = signature === expected;
  }
}));

// ✅ Combined Webhook Handler
app.post('/', (req, res) => {
  if (!req.validTwitchSignature) {
    return res.status(403).send('Invalid signature');
  }

  const messageType = req.headers['twitch-eventsub-message-type'];
  const { type } = req.body.subscription;
  const event = req.body.event;

  if (messageType === 'webhook_callback_verification') {
    return res.status(200).send(req.body.challenge);
  }

  if (messageType === 'notification') {
    console.log(`🔔 Event Received: ${type}`);

    if (type === 'stream.online') {
      isLive = true;
      console.log('✅ Stream is now live');
    }

    if (type === 'stream.offline') {
      isLive = false;
      console.log('🔕 Stream is now offline');
    }
  }

  res.sendStatus(204);
});

// ✅ ESP32 polling route
app.get('/status', (req, res) => {
  console.log('📶 ESP32 requested status:', isLive);
  res.json({ live: isLive });
});

// ✅ Twitch OAuth Callback
app.get('/auth/twitch/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('Missing code from Twitch');
  }

  try {
    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.REDIRECT_URI
      }
    });

    const { access_token, refresh_token, scope } = response.data;

    console.log('✅ Access Token:', access_token);
    res.send(`
      <h2>Success!</h2>
      <p>Access Token: <code>${access_token}</code></p>
      <p>Refresh Token: <code>${refresh_token}</code></p>
      <p>Scopes: ${scope.join(', ')}</p>
      <p>Store these tokens securely!</p>
    `);
  } catch (err) {
    console.error('❌ Failed to get token:', err.response?.data || err.message);
    res.status(500).send('Token exchange failed');
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('✅ Twitch EventSub server is running on Railway!');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
