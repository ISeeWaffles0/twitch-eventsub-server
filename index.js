// index.js
require('dotenv').config();
const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ verify: verifyTwitchSignature }));

function verifyTwitchSignature(req, res, buf) {
  const messageId = req.headers['twitch-eventsub-message-id'];
  const timestamp = req.headers['twitch-eventsub-message-timestamp'];
  const signature = req.headers['twitch-eventsub-message-signature'];
  const secret = process.env.TWITCH_SECRET;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(messageId + timestamp + buf);
  const expected = `sha256=${hmac.digest('hex')}`;

  if (signature !== expected) {
    throw new Error('Invalid signature');
  }
}

app.post('/webhook', (req, res) => {
  const { type } = req.body.subscription;
  const messageType = req.headers['twitch-eventsub-message-type'];

  if (messageType === 'webhook_callback_verification') {
    res.status(200).send(req.body.challenge);
  } else {
    console.log(`🔔 Event Received: ${type}`);
    res.sendStatus(204);
  }
});
const axios = require('axios');

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
        redirect_uri: process.env.REDIRECT_URI // Must match your dev console
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

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
