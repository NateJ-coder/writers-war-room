
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Message } from './types';
import { Role } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { runChat } from './services/geminiService';
import { BotIcon } from './components/icons/BotIcon';

const BACKGROUND_IMAGE_URL = 'https://storage.googleapis.com/pr-newsroom-site/2024/05/Writers-War-Room-1.png';

type Mode = 'dialogue' | 'accuracy' | 'chronology';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: Role.MODEL,
      parts: [{ text: "Greetings, author. I have studied your outline and initial chapters. I am prepared to serve as your historical advisor for the American Revolutionary War. Use the buttons below to focus my analysis, or ask me anything directly. How may I assist?" }],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    let fullPrompt = text;
    let userMessageText = text;

    if (mode) {
      const modeTitle = mode.charAt(0).toUpperCase() + mode.slice(1);
      userMessageText = `[${modeTitle} Analysis]\n${text}`;
      switch (mode) {
        case 'dialogue':
          fullPrompt = `Please act as a Period-Accurate Language & Dialogue Enhancer. Analyze the following text and suggest improvements to make it sound authentic to the American Revolutionary War era. Explain your changes.\n\nTEXT:\n"""\n${text}\n"""`;
          break;
        case 'accuracy':
          fullPrompt = `Please act as a Historical Accuracy Checker. Scrutinize the following text for any historical inaccuracies or anachronisms related to the American Revolutionary War. Detail any errors and provide corrected, period-appropriate alternatives.\n\nTEXT:\n"""\n${text}\n"""`;
          break;
        case 'chronology':
          fullPrompt = `Please act as a Chronological Ordering Assistant. Based on my novel's outline and historical events, please answer the following question or analyze the following event placement:\n\nQUESTION/EVENT:\n"""\n${text}\n"""`;
          break;
      }
    }

    const userMessage: Message = { role: Role.USER, parts: [{ text: userMessageText }] };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    if (mode) setMode(null);

    try {
      const responseText = await runChat(fullPrompt);
      const modelMessage: Message = { role: Role.MODEL, parts: [{ text: responseText }] };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: Role.MODEL,
        parts: [{ text: "My apologies, I seem to be having trouble connecting. Please check your API key and network connection and try again." }],
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  const getButtonClasses = (buttonMode: Mode) => {
    const baseClasses = 'px-4 py-1.5 text-xs font-semibold rounded-full border transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/20';
    if (mode === buttonMode) {
      return `${baseClasses} bg-amber-600 text-white border-amber-500`;
    }
    return `${baseClasses} bg-zinc-800/80 text-amber-200 border-amber-800/50 hover:bg-amber-800/60 hover:text-white`;
  };

  return (
    <div
      className="h-screen w-screen bg-cover bg-center bg-fixed font-serif"
      style={{ backgroundImage: `url(${BACKGROUND_IMAGE_URL})` }}
    >
      <div className="relative flex flex-col h-full w-full bg-black/60 backdrop-blur-sm">
        <header className="flex items-center justify-center p-4 border-b border-white/10 shadow-lg">
          <BotIcon className="w-8 h-8 text-amber-100 mr-3" />
          <h1 className="text-2xl font-bold text-amber-100 tracking-wider">Writer's War Room AI</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <div className="max-w-4xl mx-auto">
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
            ))}
            {loading && <ChatMessage message={{ role: Role.MODEL, parts: [{text: ''}] }} isLoading={true} />}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="p-4 md:p-6 bg-transparent">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center items-center gap-3 mb-3">
              <button onClick={() => setMode(mode === 'dialogue' ? null : 'dialogue')} className={getButtonClasses('dialogue')}>Enhance Dialogue</button>
              <button onClick={() => setMode(mode === 'accuracy' ? null : 'accuracy')} className={getButtonClasses('accuracy')}>Check Accuracy</button>
              <button onClick={() => setMode(mode === 'chronology' ? null : 'chronology')} className={getButtonClasses('chronology')}>Order Events</button>
            </div>
            <ChatInput onSendMessage={handleSendMessage} loading={loading} mode={mode} />
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
