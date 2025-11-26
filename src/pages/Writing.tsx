import { useState, useEffect, useRef } from 'react';
import { refineBookDraft, analyzeDraftForElements, searchBookDraft } from '../services/geminiService';
import { saveWebsiteContent, updateBookDraftFile, selectExistingBookDraft, isFileLinked, getWebsiteContext } from '../services/contentContext';
import { useWritingPreferences } from '../contexts/WritingPreferencesContext';
import { saveVersion, getVersionHistory, getVersion, createSnapshot, restoreVersion, type BookVersion } from '../services/versionHistory';
import { checkConsistency, type ConsistencyIssue } from '../services/consistencyChecker';
import { exportToPDF, exportToWord, exportToText, exportToMarkdown } from '../services/exportService';
import { loadChapters, saveChapters, updateChapter, type Chapter } from '../services/chapterManager';

const Writing = () => {
  const [draft, setDraft] = useState('');
  const [sessionActive, setSessionActive] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotification, setSaveNotification] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [fileLinked, setFileLinked] = useState(false);
  const [highlightedText, setHighlightedText] = useState<string | null>(null);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const [consistencyOpen, setConsistencyOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [consistencyIssues, setConsistencyIssues] = useState<ConsistencyIssue[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [versions, setVersions] = useState<BookVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [currentChapter, setCurrentChapter] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  
  const preferences = useWritingPreferences();

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedTime = localStorage.getItem('writing-last-saved');
    if (savedTime) {
      setLastSaved(new Date(savedTime));
    }
    // Check if file is already linked
    setFileLinked(isFileLinked());
    
    // Check if there's an active session
    const activeSession = sessionStorage.getItem('writing-session-active');
    const sessionContent = sessionStorage.getItem('writing-session-content');
    if (activeSession === 'true' && sessionContent) {
      setSessionActive(true);
      setDraft(sessionContent);
    }

    // Listen for AI commands from chatbot
    const handleAICommand = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const command = customEvent.detail;
      
      if (command.action === 'search_book') {
        await handleSearchBook(command.query, command.excerpt);
      } else if (command.action === 'highlight_text') {
        handleHighlightText(command.text, command.context);
      }
    };

    window.addEventListener('ai-writing-command', handleAICommand);
    
    return () => {
      window.removeEventListener('ai-writing-command', handleAICommand);
    };
  }, []);

  // Auto-save session content to sessionStorage (not to cloud/file)
  useEffect(() => {
    if (sessionActive && draft) {
      sessionStorage.setItem('writing-session-content', draft);
    }
  }, [draft, sessionActive]);

  // Autofocus textarea when session starts
  useEffect(() => {
    if (sessionActive && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [sessionActive]);

  // Auto-save version snapshots every 2 minutes during active session
  useEffect(() => {
    if (!sessionActive) return;
    
    const autoSaveInterval = setInterval(() => {
      const currentDraft = localStorage.getItem('refined-book-draft') || '';
      if (currentDraft) {
        saveVersion(currentDraft, 'Auto-save');
      }
    }, 120000); // 2 minutes
    
    return () => clearInterval(autoSaveInterval);
  }, [sessionActive]);

  // Calculate word count
  useEffect(() => {
    const count = draft.split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(count);
  }, [draft]);

  // Handle draft changes for undo/redo
  const handleDraftChange = (newDraft: string) => {
    if (draft !== newDraft) {
      undoStack.current.push(draft);
      if (undoStack.current.length > 50) undoStack.current.shift();
      redoStack.current = [];
    }
    setDraft(newDraft);
  };

  // Undo/Redo functions
  const handleUndo = () => {
    if (undoStack.current.length > 0) {
      const previousDraft = undoStack.current.pop()!;
      redoStack.current.push(draft);
      setDraft(previousDraft);
    }
  };

  const handleRedo = () => {
    if (redoStack.current.length > 0) {
      const nextDraft = redoStack.current.pop()!;
      undoStack.current.push(draft);
      setDraft(nextDraft);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setFindReplaceOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (sessionActive) endSession();
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [draft, sessionActive]);

  const handleFindNext = () => {
    if (!findText) return;
    const index = draft.indexOf(findText);
    if (index !== -1) {
      setSaveNotification(`✅ Found at position ${index}`);
      setTimeout(() => setSaveNotification(''), 2000);
    } else {
      setSaveNotification('❌ Not found');
      setTimeout(() => setSaveNotification(''), 2000);
    }
  };

  const handleReplaceOne = () => {
    if (!findText) return;
    const index = draft.indexOf(findText);
    if (index !== -1) {
      const newDraft = draft.substring(0, index) + replaceText + draft.substring(index + findText.length);
      handleDraftChange(newDraft);
      setSaveNotification('✅ Replaced 1 occurrence');
      setTimeout(() => setSaveNotification(''), 2000);
    }
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    const newDraft = draft.split(findText).join(replaceText);
    handleDraftChange(newDraft);
    const count = draft.split(findText).length - 1;
    setSaveNotification(`✅ Replaced ${count} occurrences`);
    setTimeout(() => setSaveNotification(''), 2000);
  };

  const handleSelectFile = async () => {
    try {
      setSaveNotification('📁 Select your book-draft.txt file...');
      const selected = await selectExistingBookDraft();
      if (selected) {
        setFileLinked(true);
        setSaveNotification('✅ File linked successfully!');
        setTimeout(() => setSaveNotification(''), 3000);
      } else {
        setSaveNotification('❌ Failed to link file - please try again');
        setTimeout(() => setSaveNotification(''), 4000);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      setSaveNotification('❌ Error linking file - ' + (error as Error).message);
      setTimeout(() => setSaveNotification(''), 5000);
    }
  };

  const handleSearchBook = async (query: string, excerpt?: string) => {
    setSaveNotification('🔍 Searching book...');
    
    try {
      // Get the full book content
      const bookContent = localStorage.getItem('refined-book-draft') || '';
      
      if (!bookContent) {
        setSaveNotification('⚠️ No book content found to search');
        setTimeout(() => setSaveNotification(''), 3000);
        return;
      }

      // If excerpt provided by AI, use it directly
      if (excerpt) {
        // Load the excerpt into the draft area for editing
        setDraft(excerpt);
        setHighlightedText(excerpt);
        setSaveNotification('✅ Found and loaded excerpt');
        setTimeout(() => {
          setSaveNotification('');
          setHighlightedText(null);
        }, 5000);
        return;
      }

      // Otherwise search using AI
      const result = await searchBookDraft(query, bookContent);
      
      if (result.found && result.excerpt) {
        setDraft(result.excerpt);
        setHighlightedText(result.excerpt);
        setSaveNotification('✅ Found matching content');
        setTimeout(() => {
          setSaveNotification('');
          setHighlightedText(null);
        }, 5000);
      } else {
        setSaveNotification('❌ No matching content found');
        setTimeout(() => setSaveNotification(''), 3000);
      }
    } catch (error) {
      console.error('Error searching book:', error);
      setSaveNotification('❌ Search failed');
      setTimeout(() => setSaveNotification(''), 3000);
    }
  };

  const handleHighlightText = (text: string, context?: string) => {
    setHighlightedText(text);
    setDraft(text);
    setSaveNotification(context ? `💡 ${context}` : '✨ Content highlighted');
    setTimeout(() => {
      setSaveNotification('');
      setHighlightedText(null);
    }, 5000);
  };

  const beginSession = () => {
    setSessionActive(true);
    setDraft('');
    setHighlightedText(null);
    sessionStorage.setItem('writing-session-active', 'true');
    sessionStorage.setItem('writing-session-content', '');
    setSaveNotification('📝 Session started - write freely!');
    setTimeout(() => setSaveNotification(''), 3000);
  };

  const endSession = async () => {
    if (!draft.trim()) {
      // Just close the session if nothing was written
      setSessionActive(false);
      sessionStorage.removeItem('writing-session-active');
      sessionStorage.removeItem('writing-session-content');
      setSaveNotification('Session ended (no content to save)');
      setTimeout(() => setSaveNotification(''), 3000);
      return;
    }

    await saveDraft();
    
    // Clear session after successful save
    setSessionActive(false);
    sessionStorage.removeItem('writing-session-active');
    sessionStorage.removeItem('writing-session-content');
  };

  // Version History Functions
  const loadVersionHistory = () => {
    const versions = getVersionHistory();
    setVersions(versions);
    setVersionsOpen(true);
  };

  const handleLoadVersion = (versionId: string) => {
    const version = getVersion(versionId);
    if (version) {
      setDraft(version.content);
      setSelectedVersion(versionId);
      setSaveNotification(`✅ Loaded version from ${new Date(version.timestamp).toLocaleString()}`);
      setTimeout(() => setSaveNotification(''), 3000);
      setVersionsOpen(false);
    }
  };

  const handleCreateSnapshot = () => {
    const currentDraft = localStorage.getItem('refined-book-draft') || '';
    const label = prompt('Enter a label for this snapshot:');
    if (label) {
      createSnapshot(currentDraft, label);
      const versions = getVersionHistory();
      setVersions(versions);
      setSaveNotification(`✅ Snapshot "${label}" created`);
      setTimeout(() => setSaveNotification(''), 3000);
    }
  };

  const handleRollback = (versionId: string) => {
    if (confirm('Are you sure you want to rollback to this version? Current changes will be lost.')) {
      const success = restoreVersion(versionId);
      if (success) {
        const version = getVersion(versionId);
        if (version) {
          setDraft(version.content);
          setSaveNotification(`✅ Rolled back to ${new Date(version.timestamp).toLocaleString()}`);
          setTimeout(() => setSaveNotification(''), 3000);
          setVersionsOpen(false);
        }
      }
    }
  };

  // Chapter Management Functions
  const loadChaptersData = () => {
    const chapters = loadChapters();
    setChapters(chapters);
    setChaptersOpen(true);
  };

  const handleSwitchChapter = (chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (chapter) {
      setDraft(chapter.content);
      setCurrentChapter(chapterId);
      setSaveNotification(`✅ Loaded ${chapter.title}`);
      setTimeout(() => setSaveNotification(''), 3000);
      setChaptersOpen(false);
    }
  };

  const handleUpdateChapterContent = () => {
    if (!currentChapter) return;
    updateChapter(currentChapter, { content: draft, wordCount: draft.split(/\s+/).length });
    const updatedChapters = loadChapters();
    setChapters(updatedChapters);
    setSaveNotification('✅ Chapter updated');
    setTimeout(() => setSaveNotification(''), 2000);
  };

  const handleCreateChapter = () => {
    const title = prompt('Enter chapter title:');
    if (title) {
      const newChapter: Chapter = {
        id: Date.now().toString(),
        number: chapters.length + 1,
        title,
        content: '',
        wordCount: 0,
        status: 'draft',
        order: chapters.length + 1
      };
      const updatedChapters = [...chapters, newChapter];
      saveChapters(updatedChapters);
      setChapters(updatedChapters);
      setSaveNotification(`✅ Created "${title}"`);
      setTimeout(() => setSaveNotification(''), 2000);
    }
  };

  // Consistency Checker Functions
  const runConsistencyCheck = async () => {
    setConsistencyOpen(true);
    setSaveNotification('🔍 Analyzing manuscript for consistency issues...');
    
    try {
      const bookContent = localStorage.getItem('refined-book-draft') || '';
      const issues = await checkConsistency(bookContent);
      setConsistencyIssues(issues);
      setSaveNotification(`✅ Found ${issues.length} potential issues`);
      setTimeout(() => setSaveNotification(''), 3000);
    } catch (error) {
      console.error('Consistency check error:', error);
      setSaveNotification('❌ Consistency check failed');
      setTimeout(() => setSaveNotification(''), 3000);
    }
  };

  // Export Functions
  const handleExport = async (format: 'pdf' | 'docx' | 'markdown' | 'txt') => {
    setSaveNotification(`📄 Exporting as ${format.toUpperCase()}...`);
    
    try {
      const bookContent = localStorage.getItem('refined-book-draft') || '';
      const bookTitle = 'My Novel'; // Could be dynamic from metadata
      
      switch (format) {
        case 'pdf':
          await exportToPDF(bookContent, bookTitle);
          break;
        case 'docx':
          exportToWord(bookContent, bookTitle);
          break;
        case 'markdown':
          exportToMarkdown(bookContent, bookTitle);
          break;
        case 'txt':
          exportToText(bookContent, bookTitle);
          break;
      }
      
      setSaveNotification(`✅ Exported as ${format.toUpperCase()}`);
      setTimeout(() => setSaveNotification(''), 3000);
      setExportOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      setSaveNotification(`❌ Export failed: ${(error as Error).message}`);
      setTimeout(() => setSaveNotification(''), 4000);
    }
  };

  const saveDraft = async () => {
    if (!draft.trim()) return;
    
    setIsSaving(true);
    setSaveNotification('Saving...');

    try {
      // 1. Get existing book draft content
      const existingDraft = localStorage.getItem('refined-book-draft') || '';
      
      // 2. Refine NEW session content with AI
      setSaveNotification('Refining new content with AI...');
      const refinedNewContent = await refineBookDraft(draft);
      
      // 3. Merge with existing content (append, don't duplicate)
      setSaveNotification('Merging with existing content...');
      const mergedDraft = existingDraft 
        ? `${existingDraft}\n\n${refinedNewContent}` 
        : refinedNewContent;
      
      // Save merged draft to localStorage
      saveWebsiteContent({ refinedBookDraft: mergedDraft });
      
      // 4. Update book-draft.txt file
      if (fileLinked) {
        setSaveNotification('Updating book-draft.txt...');
        const fileUpdated = await updateBookDraftFile(mergedDraft);
        
        if (!fileUpdated) {
          // If file update failed, reset link status
          setFileLinked(false);
          setSaveNotification('⚠️ File link lost - please link file again');
          setTimeout(() => setSaveNotification(''), 5000);
          setIsSaving(false);
          return;
        }
      } else {
        // No file linked yet - skip file update but continue with other saves
        console.log('No file linked - skipping file update');
      }

      // 5. Update last saved time
      const now = new Date();
      localStorage.setItem('writing-last-saved', now.toISOString());
      setLastSaved(now);
      
      // 6. All data saved locally - no cloud backup needed
      console.log('✅ Content saved locally');

      // 7. Analyze NEW content and extract elements
      setSaveNotification('Analyzing new content...');
      const elements = await analyzeDraftForElements(draft);
      
      // Merge with existing content (don't replace, add new ones)
      const context = getWebsiteContext();
      
      // Add new characters that don't exist
      const newCharacters = elements.characters.filter(newChar => 
        !context.characters.some(existing => 
          existing.name.toLowerCase() === newChar.name.toLowerCase()
        )
      );
      
      // Add new places
      const newPlaces = elements.places.filter(newPlace => 
        !context.places.some(existing => 
          existing.name.toLowerCase() === newPlace.name.toLowerCase()
        )
      );
      
      // Add new events
      const newEvents = elements.events.filter(newEvent => 
        !context.events.some(existing => 
          existing.name.toLowerCase() === newEvent.name.toLowerCase()
        )
      );

      if (newCharacters.length > 0 || newPlaces.length > 0 || newEvents.length > 0) {
        saveWebsiteContent({
          characters: [...context.characters, ...newCharacters],
          places: [...context.places, ...newPlaces],
          events: [...context.events, ...newEvents]
        });
        window.dispatchEvent(new Event('storage'));
      }

      const addedCount = (newCharacters.length || 0) + (newPlaces.length || 0) + (newEvents.length || 0);
      const sessionWordCount = draft.split(/\s+/).filter(w => w.length > 0).length;
      
      // 8. Save version history
      saveVersion(mergedDraft, `Session ended - ${new Date().toLocaleString()}`);
      
      // 9. Update writing stats
      preferences.addWordsToday(sessionWordCount);
      preferences.updateStreak();
      
      setSaveNotification(`✅ Saved ${sessionWordCount} words${addedCount > 0 ? `, added ${addedCount} new items` : ''}!`);
      setTimeout(() => setSaveNotification(''), 4000);
      
      // Clear the writing area
      setDraft('');
      undoStack.current = [];
      redoStack.current = [];

    } catch (error) {
      console.error('Error saving draft:', error);
      setSaveNotification('❌ Error saving. Please try again.');
      setTimeout(() => setSaveNotification(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReview = () => {
    setIsReviewing(true);
    // Simulate AI review with a timeout
    setTimeout(() => {
      const feedback = generateMockFeedback(draft);
      setReviewFeedback(feedback);
      setIsReviewing(false);
    }, 2000);
  };

  const generateMockFeedback = (text: string): string => {
    if (!text || text.length < 50) {
      return "📝 Your draft is quite short. Consider expanding your ideas with more details and descriptions.";
    }

    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = sentences.length > 0 ? Math.round(wordCount / sentences.length) : 0;

    let feedback = `📊 Draft Analysis:\n\n`;
    feedback += `- Word Count: ${wordCount}\n`;
    feedback += `- Sentences: ${sentences.length}\n`;
    feedback += `- Average words per sentence: ${avgWordsPerSentence}\n\n`;

    if (avgWordsPerSentence > 25) {
      feedback += `💡 Consider breaking up longer sentences for better readability.\n`;
    }
    if (avgWordsPerSentence < 10) {
      feedback += `💡 Try varying sentence length to create better rhythm.\n`;
    }

    feedback += `\n✨ Keep writing! Your story is taking shape.`;
    return feedback;
  };

  return (
    <div className="writing-container">
      <h2>✏️ Writing Space</h2>
      
      <div className="writing-controls">
        {!sessionActive ? (
          <>
            {!fileLinked && (
              <button onClick={handleSelectFile} className="link-file-btn" style={{
                backgroundColor: 'var(--burgundy)',
                color: 'var(--neon-yellow)',
                border: '2px solid var(--neon-yellow)',
                fontWeight: 'bold',
                textShadow: 'none'
              }}>
                📎 Link book-draft.txt
              </button>
            )}
            <button onClick={beginSession} className="begin-session-btn" style={{
              backgroundColor: 'var(--neon-green)',
              color: 'var(--dark-brown)',
              border: '2px solid var(--neon-green)',
              fontWeight: 'bold',
              fontSize: '1.1em',
              padding: '12px 24px',
              textShadow: 'none'
            }}>
              ▶️ Begin Session
            </button>
          </>
        ) : (
          <>
            <button onClick={endSession} className="end-session-btn" disabled={isSaving} style={{
              backgroundColor: 'var(--neon-blue)',
              color: 'var(--dark-brown)',
              border: '2px solid var(--neon-blue)',
              fontWeight: 'bold',
              fontSize: '1.1em',
              padding: '12px 24px',
              textShadow: 'none'
            }}>
              {isSaving ? '💫 Saving & Ending...' : '⏹️ End Session & Save'}
            </button>
            <button 
              onClick={handleReview} 
              disabled={isReviewing || !draft || isSaving}
              className="review-btn"
            >
              {isReviewing ? '🤔 Reviewing...' : '🤖 AI Review'}
            </button>
            <button onClick={() => handleUndo()} disabled={undoStack.current.length === 0} title="Undo (Ctrl+Z)" style={{ padding: '8px 16px' }}>
              ↶ Undo
            </button>
            <button onClick={() => handleRedo()} disabled={redoStack.current.length === 0} title="Redo (Ctrl+Y)" style={{ padding: '8px 16px' }}>
              ↷ Redo
            </button>
            <button onClick={() => setFindReplaceOpen(true)} title="Find & Replace (Ctrl+F)" style={{ padding: '8px 16px' }}>
              🔍 Find
            </button>
          </>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '15px' }}>
          {wordCount > 0 && (
            <span className="word-count-badge" style={{
              background: 'var(--neon-blue)',
              color: 'var(--dark-brown)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontFamily: 'Bebas Neue, sans-serif',
              fontWeight: 'bold',
              fontSize: '0.95em'
            }}>
              {wordCount} words
            </span>
          )}
          {saveNotification && (
            <span className="save-notification" style={{ 
              color: saveNotification.includes('✅') ? 'var(--neon-green)' : 
                     saveNotification.includes('❌') ? 'var(--neon-pink)' : 
                     'var(--neon-yellow)',
              fontFamily: 'Bebas Neue, sans-serif',
              letterSpacing: '1px',
              textShadow: '0 0 10px currentColor'
            }}>
              {saveNotification}
            </span>
          )}
          {lastSaved && !saveNotification && (
            <span className="last-saved" style={{ color: 'var(--brass)' }}>
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Toolbar with advanced features */}
      <div className="writing-toolbar" style={{
        display: 'flex',
        gap: '10px',
        padding: '15px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
        marginBottom: '15px',
        flexWrap: 'wrap'
      }}>
        <button onClick={loadVersionHistory} style={{ padding: '8px 16px', fontSize: '0.9em' }}>
          📜 Version History
        </button>
        <button onClick={loadChaptersData} style={{ padding: '8px 16px', fontSize: '0.9em' }}>
          📖 Chapters
        </button>
        <button onClick={runConsistencyCheck} style={{ padding: '8px 16px', fontSize: '0.9em' }}>
          🔍 Check Consistency
        </button>
        <button onClick={() => setExportOpen(true)} style={{ padding: '8px 16px', fontSize: '0.9em' }}>
          💾 Export
        </button>
        {sessionActive && preferences.dailyWordGoal > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>
              Goal: {preferences.wordsWrittenToday}/{preferences.dailyWordGoal}
            </span>
            <div style={{
              width: '100px',
              height: '8px',
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(100, (preferences.wordsWrittenToday / preferences.dailyWordGoal) * 100)}%`,
                height: '100%',
                background: preferences.wordsWrittenToday >= preferences.dailyWordGoal ? 'var(--neon-green)' : 'var(--neon-blue)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}
      </div>

      {sessionActive ? (
        <div style={{ position: 'relative' }}>
          <textarea
            ref={textareaRef}
            className="writing-area"
            placeholder="Begin your epic tale here... (Session active - changes are temporary until you end the session)"
            value={draft}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
            style={{
              backgroundColor: highlightedText ? 'rgba(0, 217, 255, 0.1)' : undefined,
              transition: 'background-color 0.3s ease'
            }}
          />
          {highlightedText && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'var(--neon-blue)',
              color: 'var(--dark-brown)',
              padding: '8px 16px',
              borderRadius: '4px',
              fontWeight: 'bold',
              fontSize: '0.9em',
              pointerEvents: 'none',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              ✨ AI Retrieved Content
            </div>
          )}
        </div>
      ) : (
        <div className="session-placeholder" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          border: '2px dashed var(--brass)',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          <h3 style={{ color: 'var(--neon-yellow)', fontFamily: 'Bebas Neue, sans-serif', fontSize: '2em', marginBottom: '20px' }}>
            Ready to Write?
          </h3>
          <p style={{ fontSize: '1.2em', marginBottom: '15px' }}>
            Click "Begin Session" to start writing.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95em', maxWidth: '600px' }}>
            Your work will be saved only when you end the session. The AI will merge your new content with existing work, avoiding duplicates.
          </p>
          {fileLinked && (
            <p style={{ color: 'var(--neon-green)', marginTop: '20px', fontWeight: 'bold' }}>
              ✓ book-draft.txt is linked and ready
            </p>
          )}
        </div>
      )}

      {reviewFeedback && (
        <div className="review-feedback">
          <h3 style={{ color: 'var(--neon-green)', fontFamily: 'Bebas Neue, sans-serif', marginTop: 0 }}>AI Feedback</h3>
          <pre style={{ fontFamily: 'Courier Prime, monospace', whiteSpace: 'pre-wrap' }}>{reviewFeedback}</pre>
        </div>
      )}

      {/* Find & Replace Dialog */}
      {findReplaceOpen && (
        <div className="modal-overlay" onClick={() => setFindReplaceOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h3 style={{ color: 'var(--neon-blue)', fontFamily: 'Bebas Neue, sans-serif', marginTop: 0 }}>
              Find & Replace
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input
                type="text"
                placeholder="Find..."
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--brass)' }}
              />
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--brass)' }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={handleFindNext} disabled={!findText}>Find Next</button>
                <button onClick={handleReplaceOne} disabled={!findText}>Replace</button>
                <button onClick={handleReplaceAll} disabled={!findText}>Replace All</button>
                <button onClick={() => setFindReplaceOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {versionsOpen && (
        <div className="modal-overlay" onClick={() => setVersionsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <h3 style={{ color: 'var(--neon-blue)', fontFamily: 'Bebas Neue, sans-serif', marginTop: 0 }}>
              📜 Version History
            </h3>
            <button onClick={handleCreateSnapshot} style={{ marginBottom: '15px' }}>
              📸 Create Snapshot
            </button>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {versions.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No saved versions yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {versions.map(v => (
                    <div key={v.id} style={{
                      padding: '15px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '8px',
                      border: selectedVersion === v.id ? '2px solid var(--neon-blue)' : '1px solid var(--brass)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <strong style={{ color: 'var(--neon-yellow)' }}>{v.label}</strong>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9em', margin: '5px 0' }}>
                            {new Date(v.timestamp).toLocaleString()}
                          </p>
                          <p style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>
                            {v.wordCount} words
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleLoadVersion(v.id)} style={{ fontSize: '0.85em' }}>
                            Load
                          </button>
                          <button onClick={() => handleRollback(v.id)} style={{ fontSize: '0.85em' }}>
                            Rollback
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginTop: '15px', textAlign: 'right' }}>
              <button onClick={() => setVersionsOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Chapter Manager Modal */}
      {chaptersOpen && (
        <div className="modal-overlay" onClick={() => setChaptersOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <h3 style={{ color: 'var(--neon-blue)', fontFamily: 'Bebas Neue, sans-serif', marginTop: 0 }}>
              📖 Chapter Manager
            </h3>
            <button onClick={handleCreateChapter} style={{ marginBottom: '15px' }}>
              ➕ New Chapter
            </button>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {chapters.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No chapters yet. Create your first chapter!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {chapters.map(ch => (
                    <div key={ch.id} style={{
                      padding: '15px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '8px',
                      border: currentChapter === ch.id ? '2px solid var(--neon-blue)' : '1px solid var(--brass)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <strong style={{ color: 'var(--neon-yellow)' }}>{ch.title}</strong>
                          <p style={{ fontSize: '0.85em', color: 'var(--text-muted)', margin: '5px 0' }}>
                            {ch.wordCount} words
                          </p>
                        </div>
                        <button onClick={() => handleSwitchChapter(ch.id)} style={{ fontSize: '0.85em' }}>
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginTop: '15px', textAlign: 'right' }}>
              {currentChapter && (
                <button onClick={handleUpdateChapterContent} style={{ marginRight: '10px' }}>
                  💾 Save Chapter
                </button>
              )}
              <button onClick={() => setChaptersOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Consistency Checker Modal */}
      {consistencyOpen && (
        <div className="modal-overlay" onClick={() => setConsistencyOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <h3 style={{ color: 'var(--neon-blue)', fontFamily: 'Bebas Neue, sans-serif', marginTop: 0 }}>
              🔍 Consistency Analysis
            </h3>
            {consistencyIssues.length === 0 ? (
              <p style={{ color: 'var(--neon-green)', textAlign: 'center', padding: '40px' }}>
                ✨ No consistency issues found! Your manuscript looks good.
              </p>
            ) : (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {consistencyIssues.map((issue, idx) => (
                  <div key={idx} style={{
                    padding: '15px',
                    marginBottom: '10px',
                    background: issue.severity === 'high' ? 'rgba(255, 0, 110, 0.1)' : 'rgba(0, 217, 255, 0.1)',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${issue.severity === 'high' ? 'var(--neon-pink)' : 'var(--neon-yellow)'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <strong style={{ color: 'var(--neon-yellow)' }}>{issue.type}</strong>
                      <span style={{
                        fontSize: '0.75em',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: issue.severity === 'high' ? 'var(--neon-pink)' : 'var(--neon-yellow)',
                        color: 'var(--dark-brown)',
                        fontWeight: 'bold'
                      }}>
                        {issue.severity.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ margin: '8px 0' }}>{issue.issue}</p>
                    <p style={{ fontSize: '0.85em', color: 'var(--text-muted)', marginTop: '5px' }}>📍 {issue.location}</p>
                    {issue.suggestion && (
                      <p style={{ fontSize: '0.9em', color: 'var(--neon-green)', fontStyle: 'italic' }}>
                        💡 {issue.suggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: '15px', textAlign: 'right' }}>
              <button onClick={runConsistencyCheck} style={{ marginRight: '10px' }}>
                🔄 Re-analyze
              </button>
              <button onClick={() => setConsistencyOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Options Modal */}
      {exportOpen && (
        <div className="modal-overlay" onClick={() => setExportOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h3 style={{ color: 'var(--neon-blue)', fontFamily: 'Bebas Neue, sans-serif', marginTop: 0 }}>
              💾 Export Your Book
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Choose your export format:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <button
                onClick={() => handleExport('pdf')}
                style={{
                  padding: '30px 20px',
                  fontSize: '1.1em',
                  background: 'rgba(0, 217, 255, 0.1)',
                  border: '2px solid var(--neon-blue)'
                }}
              >
                📄 PDF
              </button>
              <button
                onClick={() => handleExport('docx')}
                style={{
                  padding: '30px 20px',
                  fontSize: '1.1em',
                  background: 'rgba(0, 217, 255, 0.1)',
                  border: '2px solid var(--neon-blue)'
                }}
              >
                📝 Word (DOCX)
              </button>
              <button
                onClick={() => handleExport('markdown')}
                style={{
                  padding: '30px 20px',
                  fontSize: '1.1em',
                  background: 'rgba(0, 217, 255, 0.1)',
                  border: '2px solid var(--neon-blue)'
                }}
              >
                📝 Markdown
              </button>
              <button
                onClick={() => handleExport('txt')}
                style={{
                  padding: '30px 20px',
                  fontSize: '1.1em',
                  background: 'rgba(0, 217, 255, 0.1)',
                  border: '2px solid var(--neon-blue)'
                }}
              >
                📋 Plain Text
              </button>
            </div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button onClick={() => setExportOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Writing;
