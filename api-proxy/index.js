// api-proxy/index.js
// Simple serverless-style proxy for Google Generative Language API.
// Designed to be used as a Vercel Serverless Function (api/index.js) or Netlify Function.

// Expected environment variable: GEMINI_API_KEY

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Allow CORS from same origin or any origin depending on your deployment needs
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
    return;
  }

  let body;
  try {
    body = req.body;
    // If running on platforms that don't parse JSON automatically (some serverless setups),
    // attempt to parse string body
    if (!body || typeof body === 'string') {
      body = JSON.parse(body || '{}');
    }
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  // Forward the incoming request body to the Google Generative Language endpoint
  // Example endpoint (update to v1beta or v1 as appropriate):
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText';

  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    const text = await r.text();
    // Proxy the exact status and body back to the client for transparency
    res.status(r.status).set({ 'Content-Type': r.headers.get('content-type') || 'application/json' }).send(text);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Bad Gateway', details: err.message });
  }
};
