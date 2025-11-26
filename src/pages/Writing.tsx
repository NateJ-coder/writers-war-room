import { useState, useEffect, useRef } from 'react';

const Writing = () => {
  const [draft, setDraft] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState('');
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

  const saveDraft = () => {
    localStorage.setItem('writing-draft', draft);
    const now = new Date();
    localStorage.setItem('writing-last-saved', now.toISOString());
    setLastSaved(now);
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
      <div className="writing-header">
        <h2>✏️ Writing Space</h2>
        <div className="writing-info">
          {lastSaved && (
            <span className="last-saved">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button onClick={saveDraft} className="save-btn">💾 Save Now</button>
          <button 
            onClick={handleReview} 
            disabled={isReviewing || !draft}
            className="review-btn"
          >
            {isReviewing ? '🤔 Reviewing...' : '🤖 AI Review'}
          </button>
        </div>
      </div>

      <textarea
        id="writing-textarea"
        placeholder="Begin your epic tale here..."
        value={draft}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
      />

      {reviewFeedback && (
        <div className="review-feedback">
          <h3>AI Feedback</h3>
          <pre>{reviewFeedback}</pre>
        </div>
      )}
    </div>
  );
};

export default Writing;
