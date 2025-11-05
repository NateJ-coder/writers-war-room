// api/api-proxy.js
// Serverless proxy for Google Generative Language API on Vercel
// Environment variable: GEMINI_API_KEY

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // CORS headers - must be set BEFORE any other response
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
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
    if (!body || typeof body === 'string') {
      body = JSON.parse(body || '{}');
    }
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  // Gemini API endpoint
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
