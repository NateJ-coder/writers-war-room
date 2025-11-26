import type { Note, Character, Place, Event, OutlineSection } from '../types';

export interface WebsiteContext {
  pinboardNotes: Note[];
  writingDraft: string;
  outline: OutlineSection[];
  characters: Character[];
  places: Place[];
  events: Event[];
}

export const getWebsiteContext = (): WebsiteContext => {
  // Get pinboard notes
  const pinboardNotes: Note[] = JSON.parse(localStorage.getItem('pinboard-notes') || '[]');
  
  // Get writing draft
  const writingDraft = localStorage.getItem('writing-draft') || '';
  
  // Get outline (stored in localStorage if user has modified it)
  const outline: OutlineSection[] = JSON.parse(localStorage.getItem('outline-data') || '[]');
  
  // Get contents data
  const characters: Character[] = JSON.parse(localStorage.getItem('characters-data') || '[]');
  const places: Place[] = JSON.parse(localStorage.getItem('places-data') || '[]');
  const events: Event[] = JSON.parse(localStorage.getItem('events-data') || '[]');
  
  return {
    pinboardNotes,
    writingDraft,
    outline,
    characters,
    places,
    events
  };
};

export const formatContextForAI = (context: WebsiteContext): string => {
  let formatted = "=== CURRENT PROJECT CONTEXT ===\n\n";
  
  // Pinboard Notes
  if (context.pinboardNotes.length > 0) {
    formatted += "## PINBOARD NOTES:\n";
    context.pinboardNotes.forEach((note, idx) => {
      if (note.type === 'image') {
        formatted += `${idx + 1}. [IMAGE: ${note.text}]\n`;
      } else {
        formatted += `${idx + 1}. ${note.text}\n`;
      }
    });
    formatted += "\n";
  }
  
  // Characters
  if (context.characters.length > 0) {
    formatted += "## CHARACTERS:\n";
    context.characters.forEach((char) => {
      formatted += `- ${char.name}: ${char.description}\n`;
    });
    formatted += "\n";
  }
  
  // Places
  if (context.places.length > 0) {
    formatted += "## PLACES:\n";
    context.places.forEach((place) => {
      formatted += `- ${place.name}: ${place.description}\n`;
    });
    formatted += "\n";
  }
  
  // Events
  if (context.events.length > 0) {
    formatted += "## EVENTS:\n";
    context.events.forEach((event) => {
      formatted += `- ${event.name}: ${event.description}\n`;
    });
    formatted += "\n";
  }
  
  // Outline
  if (context.outline.length > 0) {
    formatted += "## STORY OUTLINE:\n";
    context.outline.forEach((section) => {
      formatted += `### ${section.title}\n${section.description}\n`;
      section.chapters.forEach((chapter) => {
        formatted += `  - Chapter ${chapter.number}: ${chapter.title} - ${chapter.summary}\n`;
      });
    });
    formatted += "\n";
  }
  
  // Writing Draft
  if (context.writingDraft) {
    const preview = context.writingDraft.substring(0, 500);
    formatted += "## WRITING DRAFT (preview):\n";
    formatted += preview + (context.writingDraft.length > 500 ? "...\n" : "\n");
    formatted += `(Total words: ${context.writingDraft.split(/\s+/).filter(w => w.length > 0).length})\n\n`;
  }
  
  formatted += "=== END CONTEXT ===\n";
  return formatted;
};

// Action types that AI can perform
export interface AIAction {
  type: 'add_note' | 'update_note' | 'delete_note' | 'add_character' | 'add_place' | 'add_event' | 'update_outline' | 'update_writing';
  payload: any;
}

export const saveWebsiteContent = (context: Partial<WebsiteContext>): void => {
  if (context.pinboardNotes !== undefined) {
    localStorage.setItem('pinboard-notes', JSON.stringify(context.pinboardNotes));
  }
  if (context.writingDraft !== undefined) {
    localStorage.setItem('writing-draft', context.writingDraft);
  }
  if (context.outline !== undefined) {
    localStorage.setItem('outline-data', JSON.stringify(context.outline));
  }
  if (context.characters !== undefined) {
    localStorage.setItem('characters-data', JSON.stringify(context.characters));
  }
  if (context.places !== undefined) {
    localStorage.setItem('places-data', JSON.stringify(context.places));
  }
  if (context.events !== undefined) {
    localStorage.setItem('events-data', JSON.stringify(context.events));
  }
};
