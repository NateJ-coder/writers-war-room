export interface Note {
  id: string;
  text: string;
  timestamp: number;
  rotation: number;
  x?: number;
  y?: number;
  type?: 'text' | 'image' | 'ai-image';
  imageUrl?: string;
  connections?: string[]; // Array of note IDs this note is connected to
  boardId?: number; // Which board (1-4) this note belongs to
  selected?: boolean; // For multi-select operations
  annotations?: string; // For image annotations/edits
}

export interface Character {
  name: string;
  description: string;
}

export interface Place {
  name: string;
  description: string;
}

export interface Event {
  name: string;
  description: string;
}

export interface Chapter {
  number: number;
  title: string;
  summary: string;
}

export interface OutlineSection {
  title: string;
  description: string;
  chapters: Chapter[];
}
