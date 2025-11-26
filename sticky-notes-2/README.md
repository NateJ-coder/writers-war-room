# Sticky Notes Components

This folder contains the extracted sticky notes components and styles from the Writer's War Room application.

## Files

- **RedStringAnimation.tsx** - SVG-based red string component that renders connections between sticky notes with drop shadows and thumbtack knots
- **StickyNote.tsx** - Complete sticky note component with drag-and-drop, thumbtack interaction, AI refinement, and delete functionality
- **sticky-notes.css** - All CSS styles for sticky notes including thumbtack visuals, hover effects, and string animations

## Features

- Drag-and-drop positioning
- CSS-based thumbtack (head and needle using ::before and ::after pseudo-elements)
- Clickable thumbtack area for drawing string connections
- Red string connections with realistic drop shadows
- AI-powered note refinement
- Image note support
- Timestamps
- Action buttons (refine, delete)

## Note Type

```typescript
interface Note {
  id: string;
  text: string;
  timestamp: number;
  rotation: number;
  x?: number;
  y?: number;
  type?: 'text' | 'image';
  imageUrl?: string;
  connections?: string[];
}
```
