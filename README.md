# Writer's War-Room ✍️

A vintage jazz-themed writing assistant application with AI-powered features for authors.

## ✨ Features

### 🎨 Vintage Jazz Aesthetic
- 1950s/60s jazz bar design with neon signs
- Wooden pinboard texture background  
- Retro color palette with neon accents

### 📌 Interactive Pinboard
- Drag-and-drop sticky notes
- Click-and-drag thumbtacks to create red string connections
- Auto-snap connections to nearby thumbtacks
- Visual detective board for plot mapping
- Image upload as sticky notes

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

## 🚀 Setup

1. **Clone the repository**
   \\\ash
   git clone https://github.com/NateJ-coder/writers-war-room.git
   cd writers-war-room
   \\\

2. **Install dependencies**
   \\\ash
   npm install
   \\\

3. **Configure environment variables**
   Create a \.env.local\ file with your API keys:
   \\\
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_PROJECT_ID=your_project_id
   \\\

4. **Run development server**
   \\\ash
   npm run dev
   \\\

5. **Build for production**
   \\\ash
   npm run build
   \\\

## 📁 Project Structure

See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for detailed documentation.

\\\
writers-war-room/
├── src/
│   ├── assets/              # Images & textures
│   ├── components/          # React components
│   ├── pages/               # Main pages
│   ├── services/            # API & business logic
│   ├── sticky-notes/        # Modular sticky note system
│   ├── styles/              # Global CSS
│   └── types/               # TypeScript definitions
├── docs/                    # Documentation & archived code
├── public/                  # Static assets
└── book-draft.txt           # Active book draft
\\\

## 🛠️ Technologies

- **Frontend**: React 18.2.0 + TypeScript 5.2.2
- **Build Tool**: Vite 5.0.8
- **AI**: @google/genai 1.30.0 (Gemini 2.5 Flash)
- **Database**: Firebase 10.7.1 (Firestore)
- **Routing**: React Router
- **Graphics**: SVG-based rendering

## 🎯 Usage

1. **Pinboard**: Create sticky notes, drag them around, and connect them with red strings
2. **Contents**: View auto-extracted characters, places, and events
3. **Outline**: Organize your story structure
4. **Writing**: Write your book with AI-powered save and refinement
5. **Resources**: Upload external files for AI extraction and analysis

## 📝 Notes

- Pinboard background image should be placed at \public/pinboard.jpeg\
- Book drafts are saved to \ook-draft.txt\ in the project root
- Old code versions are archived in the \docs/\ folder

## �� License

MIT

---

**Writer's War-Room** | Empowering Authors, One Draft at a Time
