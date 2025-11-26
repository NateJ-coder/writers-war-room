import type { Note, Character, Place, Event, OutlineSection } from '../types';

export interface WebsiteContext {
  pinboardNotes: Note[];
  writingDraft: string;
  refinedBookDraft: string;
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
  
  // Get refined book draft
  const refinedBookDraft = localStorage.getItem('refined-book-draft') || '';
  
  // Get outline (stored in localStorage if user has modified it)
  const outline: OutlineSection[] = JSON.parse(localStorage.getItem('outline-data') || '[]');
  
  // Get contents data
  const characters: Character[] = JSON.parse(localStorage.getItem('characters-data') || '[]');
  const places: Place[] = JSON.parse(localStorage.getItem('places-data') || '[]');
  const events: Event[] = JSON.parse(localStorage.getItem('events-data') || '[]');
  
  return {
    pinboardNotes,
    writingDraft,
    refinedBookDraft,
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
  
  // Writing Draft (raw)
  if (context.writingDraft) {
    const preview = context.writingDraft.substring(0, 300);
    formatted += "## CURRENT WRITING DRAFT (raw preview):\n";
    formatted += preview + (context.writingDraft.length > 300 ? "...\n" : "\n");
    formatted += `(Total words: ${context.writingDraft.split(/\s+/).filter(w => w.length > 0).length})\n\n`;
  }
  
  // Refined Book Draft (full organized version)
  if (context.refinedBookDraft) {
    formatted += "## REFINED BOOK DRAFT (full organized manuscript):\n";
    formatted += context.refinedBookDraft + "\n\n";
    const wordCount = context.refinedBookDraft.split(/\s+/).filter(w => w.length > 0).length;
    formatted += `(Total refined words: ${wordCount})\n\n`;
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
  if (context.refinedBookDraft !== undefined) {
    localStorage.setItem('refined-book-draft', context.refinedBookDraft);
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

// Update the book-draft.txt file using File System Access API
export const updateBookDraftFile = async (content: string): Promise<boolean> => {
  try {
    // Check if File System Access API is supported
    if ('showSaveFilePicker' in window) {
      // Get reference to the file (user will be prompted first time, then remembered)
      const fileHandle = await getBookDraftFileHandle();
      
      if (fileHandle) {
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        return true;
      }
    }
    
    // Fallback: just store in localStorage
    localStorage.setItem('refined-book-draft', content);
    console.warn('File System Access API not available, saved to localStorage only');
    return false;
  } catch (error) {
    console.error('Error updating book draft file:', error);
    // Still save to localStorage as backup
    localStorage.setItem('refined-book-draft', content);
    return false;
  }
};

// Get or request file handle for book-draft.txt
let cachedFileHandle: any = null;

const getBookDraftFileHandle = async (): Promise<any> => {
  // Return cached handle if available
  if (cachedFileHandle) {
    return cachedFileHandle;
  }

  try {
    // Request user to select/create the book-draft.txt file
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: 'book-draft.txt',
      types: [{
        description: 'Text Files',
        accept: { 'text/plain': ['.txt'] },
      }],
    });
    
    cachedFileHandle = handle;
    return handle;
  } catch (error) {
    // User cancelled or API not supported
    console.log('File handle not obtained:', error);
    return null;
  }
};

// Allow user to manually select the existing book-draft.txt file
export const selectExistingBookDraft = async (): Promise<boolean> => {
  try {
    const [fileHandle] = await (window as any).showOpenFilePicker({
      types: [{
        description: 'Text Files',
        accept: { 'text/plain': ['.txt'] },
      }],
      multiple: false,
    });
    
    cachedFileHandle = fileHandle;
    
    // Read the existing content and store it
    const file = await fileHandle.getFile();
    const content = await file.text();
    localStorage.setItem('refined-book-draft', content);
    
    return true;
  } catch (error) {
    console.error('Error selecting file:', error);
    return false;
  }
};
