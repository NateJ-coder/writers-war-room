import { useState, useEffect, useRef } from 'react';
import { refineBookDraft, analyzeDraftForElements, searchBookDraft } from '../services/geminiService';
import { saveWebsiteContent, updateBookDraftFile, selectExistingBookDraft, isFileLinked, getWebsiteContext } from '../services/contentContext';
import { getDb, collection, doc, setDoc, serverTimestamp } from '../services/firebase';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      
      // 6. Save to Firebase
      setSaveNotification('Backing up to cloud...');
      try {
        const db = getDb();
        const userId = 'default-user'; // Replace with actual user ID when auth is implemented
        const draftRef = doc(collection(db, 'users', userId, 'drafts'), 'current');
        await setDoc(draftRef, {
          content: mergedDraft,
          refinedContent: mergedDraft,
          lastModified: serverTimestamp(),
          wordCount: mergedDraft.split(/\s+/).filter(w => w.length > 0).length
        });
      } catch (firebaseError) {
        console.error('Firebase save error:', firebaseError);
        // Continue even if Firebase fails
      }

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
      const wordCount = draft.split(/\s+/).filter(w => w.length > 0).length;
      
      setSaveNotification(`✅ Saved ${wordCount} words${addedCount > 0 ? `, added ${addedCount} new items` : ''}!`);
      setTimeout(() => setSaveNotification(''), 4000);
      
      // Clear the writing area
      setDraft('');

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
          </>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '15px' }}>
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
    </div>
  );
};

export default Writing;
