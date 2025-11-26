export interface BookVersion {
  id: string;
  content: string;
  timestamp: number;
  wordCount: number;
  label?: string;
  isSnapshot?: boolean;
}

export const saveVersion = (content: string, label?: string, isSnapshot: boolean = false): void => {
  const versions = getVersionHistory();
  
  const newVersion: BookVersion = {
    id: `version-${Date.now()}`,
    content,
    timestamp: Date.now(),
    wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
    label,
    isSnapshot
  };
  
  versions.unshift(newVersion);
  
  // Keep last 50 versions, but always keep snapshots
  const snapshots = versions.filter(v => v.isSnapshot);
  const regularVersions = versions.filter(v => !v.isSnapshot).slice(0, 50);
  const trimmedVersions = [...snapshots, ...regularVersions].sort((a, b) => b.timestamp - a.timestamp);
  
  localStorage.setItem('book-version-history', JSON.stringify(trimmedVersions));
};

export const getVersionHistory = (): BookVersion[] => {
  const saved = localStorage.getItem('book-version-history');
  return saved ? JSON.parse(saved) : [];
};

export const getVersion = (id: string): BookVersion | null => {
  const versions = getVersionHistory();
  return versions.find(v => v.id === id) || null;
};

export const deleteVersion = (id: string): void => {
  const versions = getVersionHistory();
  const filtered = versions.filter(v => v.id !== id);
  localStorage.setItem('book-version-history', JSON.stringify(filtered));
};

export const restoreVersion = (id: string): boolean => {
  const version = getVersion(id);
  if (!version) return false;
  
  // Save current as backup before restoring
  const currentContent = localStorage.getItem('refined-book-draft') || '';
  if (currentContent) {
    saveVersion(currentContent, 'Auto-backup before restore', false);
  }
  
  // Restore the version
  localStorage.setItem('refined-book-draft', version.content);
  return true;
};

export const createSnapshot = (content: string, label: string): void => {
  saveVersion(content, label, true);
};
