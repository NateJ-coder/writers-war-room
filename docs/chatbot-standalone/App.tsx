
import React, { useState, useEffect, useRef } from 'react';
import { Message, Role } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { getChatResponse } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: Role.MODEL,
      content: "Greetings! Welcome to the club. What tales of the American Revolution can I spin for you today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (userInput: string) => {
    if (!userInput.trim()) return;

    const userMessage: Message = { role: Role.USER, content: userInput };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setError(null);

    try {
      const { text, sources } = await getChatResponse(newMessages);
      const modelMessage: Message = { role: Role.MODEL, content: text, sources };
      setMessages((prevMessages) => [...prevMessages, modelMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Apologies, the band is having some trouble. Please try again. (${errorMessage})`);
      const errorBotMessage: Message = {
        role: Role.MODEL,
        content: `Apologies, the band is having some trouble. Please try again.`,
      }
      setMessages((prevMessages) => [...prevMessages, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1a1a] flex flex-col h-screen text-stone-200">
      <header className="p-4 border-b border-amber-800/50 shadow-lg bg-[#242424]">
        <h1 className="text-2xl md:text-3xl text-amber-400 font-serif text-center">Revolutionary Jazz Chat</h1>
        <p className="text-center text-sm text-stone-400 mt-1">An American History Lounge</p>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="max-w-4xl mx-auto w-full">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
          {isLoading && (
            <div className="flex justify-start items-center space-x-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-amber-900/50 flex-shrink-0"></div>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-[#242424]/80 backdrop-blur-sm border-t border-amber-800/50">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </footer>
    </div>
  );
};

export default App;
