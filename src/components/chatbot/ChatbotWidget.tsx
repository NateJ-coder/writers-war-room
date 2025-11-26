import { useState, useEffect, useRef } from 'react';
import { Message, Role } from '../../types/chatbot';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { getChatResponse } from '../../services/geminiService';
import { getWebsiteContext, saveWebsiteContent } from '../../services/contentContext';
import type { Note } from '../../types';

interface ChatbotWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatbotWidget = ({ isOpen, onClose }: ChatbotWidgetProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: Role.MODEL,
      content: "Hi! I'm your AI writing assistant with full access to your project. I can see your pinboard notes, characters, places, events, outline, and writing draft. I can also execute commands like adding sticky notes. What would you like to work on?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const executeCommand = (command: any) => {
    const context = getWebsiteContext();
    
    try {
      switch (command.action) {
        case 'add_note':
          const newNote: Note = {
            id: `note-${Date.now()}`,
            text: command.text || 'New note',
            timestamp: Date.now(),
            rotation: Math.random() * 6 - 3,
            x: 100 + Math.random() * 200,
            y: 100 + Math.random() * 200,
            type: 'text',
            connections: []
          };
          context.pinboardNotes.push(newNote);
          saveWebsiteContent({ pinboardNotes: context.pinboardNotes });
          window.dispatchEvent(new Event('storage')); // Trigger refresh
          break;
          
        case 'add_character':
          context.characters.push({
            name: command.name,
            description: command.description
          });
          saveWebsiteContent({ characters: context.characters });
          window.dispatchEvent(new Event('storage'));
          break;
          
        case 'add_place':
          context.places.push({
            name: command.name,
            description: command.description
          });
          saveWebsiteContent({ places: context.places });
          window.dispatchEvent(new Event('storage'));
          break;
          
        case 'add_event':
          context.events.push({
            name: command.name,
            description: command.description
          });
          saveWebsiteContent({ events: context.events });
          window.dispatchEvent(new Event('storage'));
          break;
          
        case 'search_book':
        case 'highlight_text':
          // Dispatch custom event to be handled by Writing page
          window.dispatchEvent(new CustomEvent('ai-writing-command', { 
            detail: command 
          }));
          break;
      }
    } catch (error) {
      console.error('Error executing command:', error);
    }
  };

  const handleSendMessage = async (userInput: string) => {
    if (!userInput.trim()) return;

    const userMessage: Message = { role: Role.USER, content: userInput };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Include context with every request
      const response = await getChatResponse(newMessages, true);
      
      // Execute any commands returned by AI
      if (response.commands && response.commands.length > 0) {
        response.commands.forEach(cmd => executeCommand(cmd));
      }
      
      const modelMessage: Message = { role: Role.MODEL, content: response.text, sources: response.sources };
      setMessages((prevMessages) => [...prevMessages, modelMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      const errorBotMessage: Message = {
        role: Role.MODEL,
        content: `Sorry, I'm having trouble connecting. ${errorMessage.includes('not configured') ? 'The API key may not be set up.' : 'Please try again.'}`,
      }
      setMessages((prevMessages) => [...prevMessages, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chatbot-widget">
      <div className="chatbot-widget-header">
        <div className="chatbot-widget-title">
          <span className="chatbot-widget-icon">🤖</span>
          <span>AI Writing Assistant</span>
        </div>
        <button onClick={onClose} className="chatbot-widget-close" aria-label="Close chat">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="chatbot-widget-messages">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isLoading && (
          <div className="chatbot-loading">
            <div className="chatbot-loading-avatar"></div>
            <div className="chatbot-loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="chatbot-widget-footer">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};
