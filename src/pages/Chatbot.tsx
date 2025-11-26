import { useState, useEffect, useRef } from 'react';
import { Message, Role } from '../types/chatbot';
import { ChatMessage } from '../components/chatbot/ChatMessage';
import { ChatInput } from '../components/chatbot/ChatInput';
import { getChatResponse } from '../services/geminiService';

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: Role.MODEL,
      content: "Hello! I'm your AI writing assistant. I can help you with character development, plot ideas, world-building, and writing techniques. What would you like to discuss?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
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
      setError(`Sorry, I'm having some trouble. Please try again. (${errorMessage})`);
      const errorBotMessage: Message = {
        role: Role.MODEL,
        content: `Sorry, I'm having some trouble connecting. Please try again later.`,
      }
      setMessages((prevMessages) => [...prevMessages, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-page">
      <div className="chatbot-container">
        <div className="chatbot-header">
          <h2>🤖 AI Writing Assistant</h2>
          <p>Get help with your writing, characters, and plot development</p>
        </div>
        
        <main className="chatbot-messages">
          <div className="chatbot-messages-inner">
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
            ))}
            {isLoading && (
              <div className="loading-indicator">
                <div className="loading-avatar"></div>
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </main>

        <footer className="chatbot-footer">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </footer>
      </div>
    </div>
  );
};

export default Chatbot;
