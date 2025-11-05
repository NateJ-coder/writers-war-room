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
  // Using Gemini 2.0 Flash (latest, free tier available in Google AI Studio)
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: body.message
          }]
        }],
        systemInstruction: {
          parts: [{
            text: body.system || 'You are a helpful assistant.'
          }]
        }
      }),
    });

    const text = await r.text();
    
    if (!r.ok) {
      console.error('Google API error:', text);
      res.status(r.status).json({ error: 'Google API error', details: text });
      return;
    }

    try {
      const data = JSON.parse(text);
      // Gemini API v1beta returns candidates[0].content.parts[0].text
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from model';
      res.status(200).json({ response: responseText });
    } catch (parseErr) {
      console.error('Response parse error:', parseErr);
      res.status(502).json({ error: 'Failed to parse API response', details: text });
    }
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Bad Gateway', details: err.message });
  }
};
