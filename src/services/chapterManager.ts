export interface Chapter {
  id: string;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  status: 'draft' | 'revision' | 'complete';
  notes?: string;
  order: number;
}

export const extractChapters = (bookContent: string): Chapter[] => {
  const chapters: Chapter[] = [];
  
  // Match various chapter patterns
  const chapterRegex = /(?:^|\n)(?:Chapter|CHAPTER|Ch\.|CH\.?)\s*(\d+|[IVXLCDM]+)[\s:.\-—]*(.+?)?\n([\s\S]*?)(?=(?:\n(?:Chapter|CHAPTER|Ch\.|CH\.?)\s*(?:\d+|[IVXLCDM]+))|$)/gi;
  
  let match;
  let order = 0;
  
  while ((match = chapterRegex.exec(bookContent)) !== null) {
    const chapterNumber = match[1];
    const title = match[2]?.trim() || 'Untitled';
    const content = match[3]?.trim() || '';
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    
    chapters.push({
      id: `chapter-${chapterNumber}-${Date.now()}-${order}`,
      number: parseInt(chapterNumber) || order + 1,
      title,
      content,
      wordCount,
      status: 'draft',
      order: order++
    });
  }
  
  // If no chapters found, treat entire content as one chapter
  if (chapters.length === 0 && bookContent.trim()) {
    chapters.push({
      id: `chapter-1-${Date.now()}`,
      number: 1,
      title: 'Main Content',
      content: bookContent,
      wordCount: bookContent.split(/\s+/).filter(w => w.length > 0).length,
      status: 'draft',
      order: 0
    });
  }
  
  return chapters;
};

export const saveChapters = (chapters: Chapter[]): void => {
  localStorage.setItem('book-chapters', JSON.stringify(chapters));
};

export const loadChapters = (): Chapter[] => {
  const saved = localStorage.getItem('book-chapters');
  if (saved) {
    return JSON.parse(saved);
  }
  
  // Try to extract from book draft
  const bookContent = localStorage.getItem('refined-book-draft') || '';
  if (bookContent) {
    const extracted = extractChapters(bookContent);
    saveChapters(extracted);
    return extracted;
  }
  
  return [];
};

export const updateChapter = (id: string, updates: Partial<Chapter>): void => {
  const chapters = loadChapters();
  const index = chapters.findIndex(c => c.id === id);
  
  if (index !== -1) {
    chapters[index] = { ...chapters[index], ...updates };
    saveChapters(chapters);
  }
};

export const reorderChapters = (startIndex: number, endIndex: number): void => {
  const chapters = loadChapters();
  const [removed] = chapters.splice(startIndex, 1);
  chapters.splice(endIndex, 0, removed);
  
  // Update order property
  chapters.forEach((ch, idx) => {
    ch.order = idx;
  });
  
  saveChapters(chapters);
};

export const mergeChaptersToBook = (chapters: Chapter[]): string => {
  return chapters
    .sort((a, b) => a.order - b.order)
    .map(ch => `Chapter ${ch.number}: ${ch.title}\n\n${ch.content}`)
    .join('\n\n---\n\n');
};
