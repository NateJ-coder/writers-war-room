import { useState, useCallback, useEffect } from 'react';
import { EditorPanel } from '../components/editor/EditorPanel';
import { SuggestionsPanel } from '../components/editor/SuggestionsPanel';
import { getEditingSuggestions } from '../services/geminiService';
import type { Suggestion } from '../types/editor';
import { SuggestionType } from '../types/editor';
import { saveWebsiteContent, updateBookDraftFile, isFileLinked } from '../services/contentContext';

const Editor = () => {
  const [manuscriptText, setManuscriptText] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<SuggestionType>>(new Set(Object.values(SuggestionType)));
  const [saveNotification, setSaveNotification] = useState('');
  const [fileLinked] = useState(isFileLinked());

  // Load book draft on mount
  useEffect(() => {
    const bookDraft = localStorage.getItem('refined-book-draft') || '';
    if (bookDraft) {
      setManuscriptText(bookDraft);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!manuscriptText.trim()) {
      setError("Please enter some text to analyze.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const result = await getEditingSuggestions(manuscriptText);
      setSuggestions(result);
      if (result.length === 0) {
        setError("No suggestions found. Your manuscript looks great!");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred while analyzing the text.");
    } finally {
      setIsLoading(false);
    }
  }, [manuscriptText]);
  
  const handleAccept = useCallback((suggestionToAccept: Suggestion) => {
    setManuscriptText(prev => prev.replace(suggestionToAccept.original, suggestionToAccept.suggestion));
    setSuggestions(prev => prev.filter(s => s !== suggestionToAccept));
  }, []);

  const handleReject = useCallback((suggestionToReject: Suggestion) => {
    setSuggestions(prev => prev.filter(s => s !== suggestionToReject));
  }, []);
  
  const toggleFilter = (filter: SuggestionType) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(filter)) {
        newFilters.delete(filter);
      } else {
        newFilters.add(filter);
      }
      return newFilters;
    });
  };

  const handleSave = async () => {
    setSaveNotification('Saving...');
    
    try {
      // Save to localStorage
      saveWebsiteContent({ refinedBookDraft: manuscriptText });
      
      // Update file if linked
      if (fileLinked) {
        await updateBookDraftFile(manuscriptText);
      }
      
      setSaveNotification('✅ Saved successfully!');
      setTimeout(() => setSaveNotification(''), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveNotification('❌ Save failed');
      setTimeout(() => setSaveNotification(''), 3000);
    }
  };

  const filteredSuggestions = suggestions.filter(s => activeFilters.has(s.type));

  return (
    <div className="editor-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 120px)',
      padding: '20px',
      gap: '20px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <h2 style={{ margin: 0, fontFamily: 'Bebas Neue, sans-serif', fontSize: '2em', color: 'var(--neon-yellow)' }}>
          📝 AI Manuscript Editor
        </h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {saveNotification && (
            <span style={{ 
              color: saveNotification.includes('✅') ? 'var(--neon-green)' : 'var(--neon-pink)',
              fontFamily: 'Bebas Neue, sans-serif'
            }}>
              {saveNotification}
            </span>
          )}
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--neon-green)',
              color: 'var(--dark-brown)',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            💾 Save Changes
          </button>
        </div>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        flexGrow: 1,
        overflow: 'hidden'
      }}>
        <EditorPanel 
          text={manuscriptText}
          onTextChange={setManuscriptText}
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
        />
        <SuggestionsPanel 
          suggestions={filteredSuggestions}
          isLoading={isLoading}
          error={error}
          onAccept={handleAccept}
          onReject={handleReject}
          activeFilters={activeFilters}
          toggleFilter={toggleFilter}
          totalSuggestions={suggestions.length}
        />
      </div>
    </div>
  );
};

export default Editor;
