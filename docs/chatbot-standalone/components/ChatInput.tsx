
import React, { useState } from 'react';
import { SendIcon } from './icons';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question about the Revolution..."
        rows={1}
        className="flex-1 bg-stone-800/80 border border-stone-600 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none transition-all duration-200 placeholder:text-stone-500"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:bg-amber-500 disabled:bg-stone-600 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
        aria-label="Send message"
      >
        <SendIcon />
      </button>
    </form>
  );
};
