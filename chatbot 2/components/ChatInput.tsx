
import React, { useState, useEffect } from 'react';
import { SendIcon } from './icons/SendIcon';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  loading: boolean;
  mode: 'dialogue' | 'accuracy' | 'chronology' | null;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, loading, mode }) => {
  const [text, setText] = useState('');

  const getPlaceholderText = () => {
    switch (mode) {
      case 'dialogue':
        return 'Paste dialogue here to enhance...';
      case 'accuracy':
        return 'Paste a scene here to check for inaccuracies...';
      case 'chronology':
        return 'Ask about an event or timeline placement...';
      default:
        return 'Ask a question or paste text for review...';
    }
  };
  
  // Clear text if mode changes
  useEffect(() => {
    setText('');
  }, [mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !loading) {
      onSendMessage(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={getPlaceholderText()}
        className="flex-1 p-3 bg-zinc-800/90 text-stone-200 rounded-lg border border-amber-800/50 focus:ring-2 focus:ring-amber-600 focus:outline-none transition-shadow duration-300"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="p-3 bg-amber-700 text-white rounded-full hover:bg-amber-600 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
        aria-label="Send message"
      >
        <SendIcon className="w-6 h-6" />
      </button>
    </form>
  );
};
