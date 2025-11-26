import { useState, useEffect, useRef } from 'react';
import { refineBookDraft, analyzeDraftForElements } from '../services/geminiService';
import { saveWebsiteContent, updateBookDraftFile, selectExistingBookDraft, getWebsiteContext } from '../services/contentContext';
import { getDb, collection, doc, setDoc, serverTimestamp } from '../services/firebase';

const Writing = () => {
  const [draft, setDraft] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotification, setSaveNotification] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [fileLinked, setFileLinked] = useState(false);
  const autoSaveTimerRef = useRef<number | null>(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('writing-draft');
    if (saved) {
      setDraft(saved);
    }
    const savedTime = localStorage.getItem('writing-last-saved');
    if (savedTime) {
      setLastSaved(new Date(savedTime));
    }
  }, []);

  // Auto-save effect
  useEffect(() => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer
    autoSaveTimerRef.current = window.setTimeout(() => {
      if (draft) {
        saveDraft();
      }
    }, 30000); // 30 seconds

    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [draft]);

  const handleSelectFile = async () => {
    try {
      const selected = await selectExistingBookDraft();
      if (selected) {
        setFileLinked(true);
        setSaveNotification('✅ File linked successfully!');
        setTimeout(() => setSaveNotification(''), 3000);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      setSaveNotification('❌ Failed to select file');
      setTimeout(() => setSaveNotification(''), 3000);
    }
  };

  const saveDraft = async () => {
    if (!draft.trim()) return;
    
    setIsSaving(true);
    setSaveNotification('Saving...');

    try {
      // 1. Save raw draft to localStorage
      localStorage.setItem('writing-draft', draft);
      const now = new Date();
      localStorage.setItem('writing-last-saved', now.toISOString());
      setLastSaved(now);

      // 2. Refine draft with AI
      setSaveNotification('Refining with AI...');
      const refinedDraft = await refineBookDraft(draft);
      
      // Save refined draft to localStorage
      saveWebsiteContent({ refinedBookDraft: refinedDraft });
      
      // 3. Update book-draft.txt file
      setSaveNotification('Updating book-draft.txt...');
      const fileUpdated = await updateBookDraftFile(refinedDraft);
      
      if (!fileUpdated) {
        // If file update failed, prompt user to select file
        setSaveNotification('⚠️ Please select book-draft.txt file first');
        setTimeout(() => setSaveNotification(''), 5000);
        setIsSaving(false);
        return;
      }
      
      setFileLinked(true);

      // 4. Save to Firebase
      setSaveNotification('Backing up to cloud...');
      try {
        const db = getDb();
        const userId = 'default-user'; // Replace with actual user ID when auth is implemented
        const draftRef = doc(collection(db, 'users', userId, 'drafts'), 'current');
        await setDoc(draftRef, {
          content: draft,
          refinedContent: refinedDraft,
          lastModified: serverTimestamp(),
          wordCount: draft.split(/\s+/).filter(w => w.length > 0).length
        });
      } catch (firebaseError) {
        console.error('Firebase save error:', firebaseError);
        // Continue even if Firebase fails
      }

      // 5. Analyze draft and extract elements
      setSaveNotification('Analyzing content...');
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

      setSaveNotification('✅ Saved successfully!');
      setTimeout(() => setSaveNotification(''), 3000);

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
        {!fileLinked && (
          <button onClick={handleSelectFile} className="link-file-btn" style={{
            backgroundColor: 'var(--neon-yellow)',
            color: 'var(--burgundy)',
            fontWeight: 'bold'
          }}>
            📎 Link book-draft.txt
          </button>
        )}
        <button onClick={saveDraft} className="save-btn" disabled={isSaving || !draft}>
          {isSaving ? '💫 Saving...' : fileLinked ? '💾 Save & Update File' : '💾 Save Now'}
        </button>
        <button 
          onClick={handleReview} 
          disabled={isReviewing || !draft || isSaving}
          className="review-btn"
        >
          {isReviewing ? '🤔 Reviewing...' : '🤖 AI Review'}
        </button>
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

      <textarea
        className="writing-area"
        placeholder="Begin your epic tale here..."
        value={draft}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
      />

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
