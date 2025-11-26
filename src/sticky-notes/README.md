# Sticky Notes Module

This folder contains all components and styles related to the sticky notes functionality.

## Files

- **`RedStringAnimation.tsx`** - SVG-based red string animation component that renders connections between sticky notes
- **`StickyNote.tsx`** - Individual sticky note component with thumbtack, actions, and content
- **`sticky-notes.css`** - All CSS styles for sticky notes, thumbtacks, and string animations
- **`index.ts`** - Barrel export for clean imports

## Usage

```tsx
import { RedStringAnimation, StickyNote } from '../sticky-notes';
import '../sticky-notes/sticky-notes.css';
```

## Features

- Drag-and-drop positioning
- Thumbtack visual (CSS pseudo-elements)
- Clickable thumbtack for drawing connections
- Red string connections with drop shadow
- AI refinement button
- Delete button
- Image notes support
- Timestamps
