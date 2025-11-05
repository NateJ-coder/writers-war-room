# Writer's War-Room: Complete Deployment Guide

## Overview
The Writer's War-Room is a full-stack application with:
- **Frontend**: Static HTML/CSS/JS + React/Vite chatbot (deployed on GitHub Pages)
- **Backend**: Serverless proxy on Vercel (routes requests to Google Gemini API)
- **API**: Google Gemini 2.0 Flash for AI responses

---

## Step-by-Step Deployment

### 1. Get Your Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click **"Get API Key"** (top right)
3. Create a new API key (it will work with free tier)
4. Copy the key (you'll use this in step 2)

**Note:** Make sure your Google Cloud project has the Generative Language API enabled.

---

### 2. Deploy to Vercel

#### Option A: Deploy from GitHub (Recommended)

1. Go to [Vercel](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository: `NateJ-coder/writers-war-room`
4. In the deployment settings:
   - **Root Directory**: Keep as root (it will auto-detect `api/` folder)
   - Leave other settings default
5. Click **"Deploy"**
6. After deployment, go to **Project Settings** → **Environment Variables**
7. Add a new environment variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Paste your API key from step 1
8. Redeploy (click "Deployments" → "..." → "Redeploy")

#### Option B: Deploy from Command Line

```bash
npm install -g vercel
vercel login
cd writers-war-room
vercel --prod --env GEMINI_API_KEY="your_api_key_here"
```

---

### 3. Update Frontend URLs

Your site is now deployed! The chatbot will automatically use the Vercel proxy URL configured in `chatbot/.env`:

```
VITE_PROXY_URL=https://writers-war-room-af0low3ew-nathan-johnsons-projects-a47c35f2.vercel.app/api-proxy
```

**No changes needed** — the build already has this URL baked in.

---

### 4. GitHub Pages (Optional)

The chatbot also deploys to GitHub Pages automatically:
- Trigger: Every push to `master` branch
- Workflow: `.github/workflows/deploy-chatbot.yml`
- URL: `https://natel-coder.github.io/writers-war-room/`
- Published: Built assets in `gh-pages` branch

This is read-only; main app stays on GitHub Pages or your domain.

---

## Testing Your Deployment

### Local Testing (Before Vercel)

```bash
# Set your API key locally
export GEMINI_API_KEY="your_api_key_here"

# Start backend proxy
cd backend
npm install
npm start  # Runs on http://localhost:4000

# In another terminal, open the main site
# Update chatbot/.env to use local proxy:
# VITE_PROXY_URL=http://localhost:4000/api/chat

# Rebuild chatbot
cd chatbot
npm run build
```

### Testing on Vercel

1. Visit your Vercel deployment URL
2. Open the chatbot ("Open Story Assistant" button)
3. Send a message — should see a response from Gemini
4. Check browser DevTools Console (F12) — should be no CORS errors

---

## Troubleshooting

### CORS Errors

**Error**: `Access to fetch... blocked by CORS policy`

**Solution**:
- CORS headers are configured in `api/api-proxy.js` and `vercel.json`
- If still failing, ensure `GEMINI_API_KEY` is set in Vercel environment variables
- Redeploy after adding env var

### 404 on `/api-proxy`

**Error**: `GET /api-proxy 404`

**Solution**:
- The endpoint is POST-only (not GET)
- Make sure you're POSTing JSON with `{ message: "...", system: "..." }`
- Check that `vercel.json` includes the rewrite rule

### Google API Errors

**Error**: `Google API error: INVALID_ARGUMENT` or `PERMISSION_DENIED`

**Solution**:
- Verify API key is correct (copy-paste from AI Studio)
- Check that Generative Language API is enabled in your Google Cloud project
- Ensure the key has access to `models/gemini-2.0-flash`

### Chatbot Blank / No Messages

**Error**: Chat window doesn't show greeting

**Solution**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Check DevTools Console for errors
3. Ensure `chatbot-build/index.html` has correct relative paths
4. Verify `geminiService.ts` is using correct proxy URL

---

## Architecture

```
writers-war-room/
├── index.html              # Main site (GitHub Pages)
├── app.js                  # War-room UI logic
├── script.js               # Proxy helper
├── style.css               # Styling
├── config.js               # Background image config
├── chatbot/                # React Vite app
│   ├── src/
│   ├── .env                # VITE_PROXY_URL = Vercel endpoint
│   └── dist/               # Built output
├── chatbot-build/          # Served via iframe (updated by GitHub Actions)
├── api/                    # Vercel serverless functions
│   └── api-proxy.js        # Proxy to Google Gemini API
├── vercel.json             # Vercel config (rewrites, env, etc.)
└── .github/workflows/
    └── deploy-chatbot.yml  # Auto-build chatbot on push
```

---

## Files to Never Commit

- `.env.local` — Local overrides
- `node_modules/` — Use `npm install` instead
- API keys in code — Always use environment variables

---

## Environment Variables

### Vercel

- `GEMINI_API_KEY` — Your Google Gemini API key

### Local (`.env` files, never commit)

```bash
# backend/.env
GEMINI_API_KEY=your_key_here
PORT=4000

# chatbot/.env
VITE_PROXY_URL=http://localhost:4000/api/chat
```

---

## Support

If you hit issues:

1. **Check Network tab** (DevTools → Network) for failed requests
2. **Check Console** (DevTools → Console) for errors
3. **Verify API key** — Make sure it's in Vercel env vars
4. **Check Vercel logs** — Visit your Vercel project → Deployments → click deployment → Logs
5. **Restart Vercel deployment** — Sometimes helps with CORS issues

---

## Next Steps

- ✅ Deploy to Vercel with `GEMINI_API_KEY`
- ✅ Test chatbot works from GitHub Pages
- ✅ Customize system instruction in `chatbot/constants.ts`
- ✅ Style and branding as needed
- 🚀 Share with users!
