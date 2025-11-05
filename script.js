// script.js — GitHub Pages deployment helper
// This file overrides/sendMessage to call a secure serverless proxy (Vercel)
// instead of calling the Google Generative API directly from the browser.
//
// 1) SET THE PROXY URL (replace with your actual Vercel URL if different)
const PROXY_URL = "https://writers-war-room-af0low3ew-nathan-johnsons-projects-a47c35f2.vercel.app/api-proxy";
// Note: this URL does NOT contain your secret key — the key is configured
// in the serverless function's environment variables.

// 2) sendMessage implementation used by the site's chat UI.
// Assumes the page defines these globals: `chatInput`, `displayMessage`.
async function sendMessage() {
   try {
      const message = (typeof chatInput !== 'undefined' && chatInput.value) ? chatInput.value.trim() : '';
      if (!message) return;

      // show the user's message in the UI
      if (typeof displayMessage === 'function') displayMessage(message, true);
      if (typeof chatInput !== 'undefined') chatInput.value = '';

      // Call the secure Vercel proxy, not the Google API directly
      const response = await fetch(PROXY_URL, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ message: message })
      });

      // Attempt to parse JSON. The proxy should return JSON with { response }
      let data;
      try { data = await response.json(); } catch (err) { data = null; }

      if (!response.ok) {
         const errMsg = (data && data.error) ? data.error : `${response.status} ${response.statusText}`;
         if (typeof displayMessage === 'function') displayMessage(`Historian Bot: ERROR. Proxy failed: ${errMsg}`, false);
         return;
      }

      if (!data) {
         // If proxy returned plain text, show it directly
         const text = await response.text();
         if (typeof displayMessage === 'function') displayMessage(text, false);
         return;
      }

      if (data.error) {
         if (typeof displayMessage === 'function') displayMessage(`Historian Bot: ERROR. Proxy failed: ${data.error}`, false);
         return;
      }

      const botResponse = data.response || data.output || data.result || JSON.stringify(data);
      if (typeof displayMessage === 'function') displayMessage(botResponse, false);

   } catch (error) {
      console.error('Error connecting to proxy:', error);
      if (typeof displayMessage === 'function') displayMessage('Historian Bot: ERROR. Check your Vercel URL or network connection.', false);
   }
}

// Expose globally so existing event listeners can call it
try { window.sendMessage = sendMessage; } catch (e) { /* noop in non-browser env */ }

// Keep the rest of the site's scripts untouched — this file only replaces
// the sendMessage implementation used for GitHub Pages + Vercel proxy.

