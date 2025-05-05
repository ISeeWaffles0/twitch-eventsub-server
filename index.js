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

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
