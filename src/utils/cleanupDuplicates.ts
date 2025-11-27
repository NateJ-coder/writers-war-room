/**
 * One-time utility to clean up existing duplicates in the book draft
 * This handles the specific duplications you identified
 */

// Calculate similarity between two text blocks
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().replace(/\s+/g, ' ').trim();
  const s2 = str2.toLowerCase().replace(/\s+/g, ' ').trim();
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // Check if one contains most of the other
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.includes(shorter)) {
    return shorter.length / longer.length;
  }
  
  // Word-based similarity
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
};

// Split content into sections (by chapter headings or *** breaks)
const splitIntoSections = (content: string): Array<{ text: string; start: number; end: number }> => {
  const sections: Array<{ text: string; start: number; end: number }> = [];
  
  // Split by chapter markers or section breaks
  const markers = [
    /^#{1,3}\s+Chapter\s+\d+/gim,
    /^\*{3,}$/gm,
    /^Chapter\s+\d+:/gim
  ];
  
  const splits: Array<{ index: number; marker: string }> = [];
  
  markers.forEach(markerRegex => {
    const regex = new RegExp(markerRegex.source, markerRegex.flags);
    let match;
    while ((match = regex.exec(content)) !== null) {
      splits.push({ index: match.index, marker: match[0] });
    }
  });
  
  // Sort by position
  splits.sort((a, b) => a.index - b.index);
  
  if (splits.length === 0) {
    // No markers found, treat as one section
    return [{ text: content, start: 0, end: content.length }];
  }
  
  // Create sections between markers
  for (let i = 0; i < splits.length; i++) {
    const start = splits[i].index;
    const end = i < splits.length - 1 ? splits[i + 1].index : content.length;
    const text = content.substring(start, end);
    sections.push({ text, start, end });
  }
  
  // Add content before first marker if any
  if (splits[0].index > 0) {
    sections.unshift({ text: content.substring(0, splits[0].index), start: 0, end: splits[0].index });
  }
  
  return sections;
};

// Find and remove duplicate sections
export const cleanupDuplicates = (content: string): { cleaned: string; removedCount: number; details: string[] } => {
  const sections = splitIntoSections(content);
  const details: string[] = [];
  let removedCount = 0;
  
  // Track which sections to keep
  const sectionsToKeep: boolean[] = sections.map(() => true);
  
  // Compare each section with every other section
  for (let i = 0; i < sections.length; i++) {
    if (!sectionsToKeep[i]) continue; // Already marked for removal
    
    for (let j = i + 1; j < sections.length; j++) {
      if (!sectionsToKeep[j]) continue; // Already marked for removal
      
      const similarity = calculateSimilarity(sections[i].text, sections[j].text);
      
      // If similarity is high (70%+), mark the later one for removal
      if (similarity > 0.70) {
        sectionsToKeep[j] = false;
        removedCount++;
        
        // Create a preview of what's being removed
        const preview = sections[j].text.substring(0, 100).replace(/\n/g, ' ').trim();
        details.push(`Removed duplicate section ${j + 1} (${similarity.toFixed(0)}% similar): "${preview}..."`);
      }
    }
  }
  
  // Rebuild content with only kept sections
  const cleaned = sections
    .filter((_, index) => sectionsToKeep[index])
    .map(section => section.text)
    .join('')
    .replace(/\n{4,}/g, '\n\n\n'); // Clean up excessive line breaks
  
  return { cleaned, removedCount, details };
};

// Specific cleanup for the known issues you mentioned
export const cleanupSpecificIssues = (content: string): string => {
  let cleaned = content;
  
  // Remove the meta-commentary line if present
  cleaned = cleaned.replace(
    /Here is the refined manuscript draft.*?better readability and presentation.*?\./gi,
    ''
  );
  
  // Remove duplicate ## Chapter 1 heading if there are two
  const chapterMatches = [...cleaned.matchAll(/^##\s*Chapter\s+1\b/gim)];
  if (chapterMatches.length > 1) {
    // Keep only the first one
    const secondIndex = chapterMatches[1].index!;
    
    // Remove the second heading
    cleaned = cleaned.substring(0, secondIndex) + 
             cleaned.substring(secondIndex).replace(/^##\s*Chapter\s+1\b/im, '');
  }
  
  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');
  cleaned = cleaned.trim();
  
  return cleaned;
};

// Main cleanup function
export const performFullCleanup = (content: string): { 
  cleaned: string; 
  removedCount: number; 
  details: string[] 
} => {
  // First, handle specific known issues
  let cleaned = cleanupSpecificIssues(content);
  
  // Then do general duplicate detection
  const result = cleanupDuplicates(cleaned);
  
  return {
    cleaned: result.cleaned,
    removedCount: result.removedCount,
    details: result.details
  };
};
