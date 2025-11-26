# ✍️ Writer''s War-Room

Your Strategic Command Center for Crafting Epic Tales

## Features

- **📌 Pinboard**: Drag-and-drop sticky notes with timestamps and localStorage persistence
- **📚 Contents**: Organize characters, places, and events
- **📝 Outline**: Complete book outline with chapter structure
- **✏️ Writing**: Writing space with auto-save every 30 seconds
- **🤖 AI Assistant**: AI-powered chatbot for writing help using Google Gemini

## Tech Stack

- React 18 + TypeScript
- Vite 5
- React Router 6
- Google Gemini API
- Firebase (configured)
- Vercel deployment ready

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Add your Gemini API key to .env.local
VITE_GEMINI_API_KEY=your_api_key_here
```

Get your API key from: https://ai.google.dev/

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Deployment

See [DEPLOYMENT_CHATBOT.md](./DEPLOYMENT_CHATBOT.md) for Vercel deployment instructions.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key | Yes (for AI chatbot) |

## Project Structure

```
writers-war-room/
├── src/
│   ├── components/
│   │   ├── chatbot/       # Chat UI components
│   │   └── Layout.tsx     # Main layout wrapper
│   ├── pages/
│   │   ├── Pinboard.tsx   # Sticky notes board
│   │   ├── Contents.tsx   # Character/place/event lists
│   │   ├── Outline.tsx    # Book outline
│   │   ├── Writing.tsx    # Writing editor
│   │   └── Chatbot.tsx    # AI assistant
│   ├── services/
│   │   ├── firebase.ts    # Firebase integration
│   │   └── geminiService.ts # Gemini API calls
│   ├── types/
│   │   ├── index.ts       # Main type definitions
│   │   └── chatbot.ts     # Chat type definitions
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── old-vanilla-version/   # Archived vanilla JS files
└── chatbot/               # Original chatbot source (reference)
```

## License

MIT

---

**Empowering Authors, One Draft at a Time** 📖
