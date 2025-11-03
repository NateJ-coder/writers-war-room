api-proxy — Serverless proxy for Google Generative Language API

Purpose
- Keep the GEMINI/API key secret by making all requests from a server-side function.
- Frontend sends POST requests to this proxy with the same request body format expected by Google's Generative Language API.

Quick usage (local)
1. Create a local `.env` file with:
   GEMINI_API_KEY=your_real_key_here

2. Run a tiny Node dev server for local testing (example using `vercel dev` or any small express wrapper).

Vercel deployment (recommended)
- Place this file as `api/index.js` in the project root for Vercel, or point your Vercel project to this folder and use the file as a serverless function entrypoint.
- Add `GEMINI_API_KEY` to the Vercel project Environment Variables (Production/Preview/Development as needed).

Netlify deployment
- Add the file as a Netlify Function. Ensure the environment variable `GEMINI_API_KEY` is set in Netlify UI.

Behavior
- This proxy simply forwards the JSON body to the Generative Language endpoint and includes the `x-goog-api-key` header.
- It returns Google's response (status and body) directly to the client.

Security notes
- Do NOT expose the API key in client bundles, logs, or public files.
- Limit CORS in production to your known origins instead of `*`.
- Consider adding rate-limiting and authentication in front of this proxy for production.

If you want, I can also:
- Move `chatbot 2/` to `chatbot/` and build it, updating `chatbot-build/` so the main site embeds the new build.
- Create a small Express dev wrapper for running this proxy locally (to make testing with Postman/superagent simpler).
