# Writer's War-Room 🖋️

A vintage jazz-themed writing assistant application with AI-powered features.

## Project Structure

\\\
writers-war-room/
├── src/
│   ├── assets/              # Images, textures (pinboard.jpeg)
│   ├── components/          # React components
│   │   ├── chatbot/         # AI chatbot components
│   │   └── layout/          # Layout components
│   ├── pages/               # Main application pages
│   │   ├── Pinboard.tsx     # Interactive pinboard with sticky notes
│   │   ├── Contents.tsx     # Characters, places, events display
│   │   ├── Outline.tsx      # Story outline
│   │   ├── Writing.tsx      # Writing editor with AI features
│   │   └── Resources.tsx    # External file upload & AI extraction
│   ├── services/            # Business logic & API integrations
│   │   ├── firebase.ts      # Firebase/Firestore setup
│   │   ├── geminiService.ts # Gemini AI integration
│   │   └── contentContext.ts# Content aggregation & File System API
│   ├── sticky-notes/        # Modular sticky note components
│   │   ├── RedStringAnimation.tsx  # SVG red string connections
│   │   ├── StickyNote.tsx          # Draggable sticky note component
│   │   ├── sticky-notes.css        # Sticky note styles
│   │   ├── index.ts                # Barrel exports
│   │   └── README.md               # Component documentation
│   ├── styles/              # Global styles
│   │   └── index.css        # Main CSS with vintage jazz theme
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions (future)
│   ├── App.tsx              # Main app component with routing
│   └── main.tsx             # Application entry point
├── docs/                    # Documentation & archived code
│   ├── chatbot-standalone/  # Standalone chatbot version
│   ├── old-vanilla-version/ # Original vanilla JS version
│   ├── sticky-notes-reference/ # SVG components reference
│   ├── standalone-chatbot-page.tsx # Archived chatbot page
│   ├── book-draft-template.txt     # Template for book drafts
│   └── DEPLOYMENT_CHATBOT.md       # Chatbot deployment guide
├── public/                  # Static assets
│   └── textures/            # Texture files (if any)
├── book-draft.txt           # Active book draft (updated by AI)
└── [config files]           # package.json, vite.config.ts, etc.
\\\

## Features

### 🎨 Vintage Jazz Aesthetic
- 1950s/60s jazz bar design with neon signs
- Wooden pinboard texture background
- Retro color palette with neon accents

### 📌 Interactive Pinboard
- Drag-and-drop sticky notes
- Click-and-drag thumbtacks to create red string connections
- Auto-snap connections to nearby thumbtacks (30px range)
- Visual detective board for plot mapping

### 🤖 AI Integration (Gemini 2.5 Flash)
- Full website context awareness
- Refine sticky notes with AI
- Sort notes chronologically
- Extract characters/places/events automatically
- Process uploaded resources (summaries, chapters, Excel files)

### 💾 Data Persistence
- localStorage for primary data
- Firebase/Firestore for cloud backup
- File System Access API for direct file updates

### 📚 Resources Page
- Upload external files (summaries, chapters, spreadsheets)
- AI-powered content extraction
- Auto-updates Contents page

## Development

\\\ash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
\\\

## Technologies

- React 18.2.0 + TypeScript 5.2.2
- Vite 5.0.8
- Firebase 10.7.1
- @google/genai 1.30.0
- React Router
- SVG-based graphics (no Three.js)

## Key Components

### Pinboard
- Drag-drop sticky notes
- Thumbtack-based red string connections
- Image upload as sticky notes

### Writing
- AI-powered save with refinement
- Direct file system updates (book-draft.txt)

### Resources
- Multi-format file upload
- AI extraction of story elements
- Auto-sync with Contents

## Notes

- CSS moved to \src/styles/\
- Layout component moved to \src/components/layout/\
- Old code archived in \docs/\
- Pinboard image in \src/assets/\

---

**Writer's War-Room** | Empowering Authors, One Draft at a Time ✍️
