# Writer's War-Room - Deployment Guide

## Vercel Deployment with AI Chatbot

Your Writer's War-Room application now includes an AI-powered writing assistant chatbot using Google's Gemini API.

### Setup Instructions

#### 1. Environment Variables in Vercel

You've already added the `GEMINI_API_KEY` secret in your Vercel project. Now you need to make sure it's available to the application with the correct name:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `VITE_GEMINI_API_KEY`
   - **Value**: Your Gemini API key (same value as GEMINI_API_KEY)
   - **Environment**: Production, Preview, and Development

Alternatively, you can reference the existing secret in `vercel.json` (already configured).

#### 2. Local Development

Create a `.env.local` file in the project root:

```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from: https://ai.google.dev/

#### 3. Deploy to Vercel

```bash
# Build the project
npm run build

# Deploy to Vercel (if you have Vercel CLI installed)
vercel --prod
```

Or simply push to your Git repository if you have automatic deployments enabled.

### Features

- **📌 Pinboard**: Drag-and-drop sticky notes with localStorage persistence
- **📚 Contents**: Character, place, and event listings
- **📝 Outline**: Complete book outline with chapter structure
- **✏️ Writing**: Writing space with auto-save every 30 seconds
- **🤖 AI Assistant**: AI-powered chatbot for writing help (NEW!)

### Chatbot Features

The AI Assistant can help with:
- Character development
- Plot ideas and story structure
- World-building advice
- Writing techniques and tips
- General creative writing guidance

The chatbot uses Google's Gemini 2.5 Flash model with Google Search integration for up-to-date information.

### Troubleshooting

**Issue**: Chatbot shows "API key not configured" error

**Solution**: Make sure the environment variable is properly set:
- Locally: Check `.env.local` file exists with `VITE_GEMINI_API_KEY`
- Vercel: Verify environment variable is set and redeploy

**Issue**: Build fails on Vercel

**Solution**: Ensure all dependencies are installed:
```bash
npm install
```

### Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Routing**: React Router 6
- **AI Integration**: Google Gemini API (@google/genai)
- **Database**: Firebase (configured but optional)
- **Deployment**: Vercel

### Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key for AI chatbot | Yes (for chatbot feature) |

### API Usage Notes

- The chatbot uses Gemini 2.5 Flash model
- Google Search grounding is enabled for better responses
- API calls are made directly from the browser
- Rate limits apply based on your Gemini API tier

### Next Steps

1. ✅ Set environment variable in Vercel
2. ✅ Test chatbot locally with `.env.local`
3. Deploy to Vercel
4. Test the chatbot on production
5. Monitor API usage in Google AI Studio

---

For more information, visit:
- [Google AI Studio](https://ai.google.dev/)
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev/)
