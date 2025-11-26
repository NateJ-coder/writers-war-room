# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2024 Project Reorganization

### Added
- **Resources Page**: Upload external files (summaries, chapters, Excel) with AI extraction
- **Auto-update Contents**: Automatically extracts and updates characters/places/events
- **File System Access API**: Direct file updates for book-draft.txt
- **Modular sticky-notes system**: Separated components into dedicated folder
- **Project documentation**: Added PROJECT_STRUCTURE.md in docs/
- **Organized folder structure**: Created logical folders (assets/, styles/, layout/)

### Changed
- **Moved CSS** from src/index.css to src/styles/index.css
- **Moved Layout** from src/components/Layout.tsx to src/components/layout/Layout.tsx
- **Moved pinboard.jpeg** from root to src/assets/ and public/
- **Archived old code** to docs/ folder (old-vanilla-version, chatbot-standalone, etc.)
- **Updated README**: Complete rewrite with new features and structure

### Removed
- **Deleted ThreeRope.tsx**: Removed unused Three.js component
- **Removed backup files**: Cleaned up index.css.backup
- **Archived Chatbot page**: Moved standalone Chatbot.tsx to docs/
- **Removed empty folders**: Deleted public/textures/

### Fixed
- **Build warnings**: Resolved pinboard.jpeg path issues
- **Import paths**: Updated all imports after folder reorganization

## [1.0.0] - 2024 Initial Release

### Added
- Interactive pinboard with drag-drop sticky notes
- Red string connections with thumbtack system
- Vintage 1950s/60s jazz aesthetic
- AI-powered chatbot with Gemini 2.5 Flash
- Contents, Outline, and Writing pages
- Firebase cloud backup
- localStorage persistence

---

## Version Numbering

- **Major version** (X.0.0): Complete rewrites, major breaking changes
- **Minor version** (0.X.0): New features, significant enhancements
- **Patch version** (0.0.X): Bug fixes, small improvements
