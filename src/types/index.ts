export interface Note {
  id: string;
  text: string;
  timestamp: number;
  rotation: number;
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
