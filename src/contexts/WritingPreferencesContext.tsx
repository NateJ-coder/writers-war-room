import React, { createContext, useContext, useState, useEffect } from 'react';

interface WritingPreferences {
  fontFamily: string;
  fontSize: number;
  dailyWordGoal: number;
  currentStreak: number;
  lastWritingDate: string | null;
}

interface WritingPreferencesContextType extends WritingPreferences {
  setFontFamily: (font: string) => void;
  setFontSize: (size: number) => void;
  setDailyWordGoal: (goal: number) => void;
  updateStreak: () => void;
  getTodayWordCount: () => number;
  addWordsToday: (count: number) => void;
  wordsWrittenToday: number;
}

const defaultPreferences: WritingPreferences = {
  fontFamily: 'Courier Prime',
  fontSize: 16,
  dailyWordGoal: 500,
  currentStreak: 0,
  lastWritingDate: null
};

const WritingPreferencesContext = createContext<WritingPreferencesContextType | undefined>(undefined);

export const WritingPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<WritingPreferences>(() => {
    const saved = localStorage.getItem('writing-preferences');
    return saved ? JSON.parse(saved) : defaultPreferences;
  });

  useEffect(() => {
    localStorage.setItem('writing-preferences', JSON.stringify(preferences));
  }, [preferences]);

  const setFontFamily = (font: string) => {
    setPreferences(prev => ({ ...prev, fontFamily: font }));
  };

  const setFontSize = (size: number) => {
    setPreferences(prev => ({ ...prev, fontSize: size }));
  };

  const setDailyWordGoal = (goal: number) => {
    setPreferences(prev => ({ ...prev, dailyWordGoal: goal }));
  };

  const updateStreak = () => {
    const today = new Date().toDateString();
    const lastDate = preferences.lastWritingDate;
    
    if (!lastDate) {
      setPreferences(prev => ({ ...prev, currentStreak: 1, lastWritingDate: today }));
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastDate === today) {
      return; // Already wrote today
    } else if (lastDate === yesterday.toDateString()) {
      setPreferences(prev => ({ ...prev, currentStreak: prev.currentStreak + 1, lastWritingDate: today }));
    } else {
      setPreferences(prev => ({ ...prev, currentStreak: 1, lastWritingDate: today }));
    }
  };

  const getTodayWordCount = (): number => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem(`word-count-${today}`);
    return saved ? parseInt(saved) : 0;
  };

  const addWordsToday = (count: number) => {
    const today = new Date().toDateString();
    const current = getTodayWordCount();
    localStorage.setItem(`word-count-${today}`, (current + count).toString());
  };

  return (
    <WritingPreferencesContext.Provider value={{
      ...preferences,
      setFontFamily,
      setFontSize,
      setDailyWordGoal,
      updateStreak,
      getTodayWordCount,
      addWordsToday,
      wordsWrittenToday: getTodayWordCount()
    }}>
      {children}
    </WritingPreferencesContext.Provider>
  );
};

export const useWritingPreferences = () => {
  const context = useContext(WritingPreferencesContext);
  if (!context) throw new Error('useWritingPreferences must be used within WritingPreferencesProvider');
  return context;
};
