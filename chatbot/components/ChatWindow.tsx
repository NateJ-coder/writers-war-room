import React, { useState, useEffect, useRef } from 'react';

enum Role {
  USER = 'user',
  MODEL = 'model'
}

interface ChatMessage {
  role: Role;
  content: string;
}

const SYSTEM_INSTRUCTION = `You are a friendly historical consultant for novelists writing about the American Revolutionary War era.`;


// Simple Message component
const Message: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === Role.USER;
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isUser ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
      }`}>
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  );
};

// Simple UserInput component
const UserInput: React.FC<{ onSendMessage: (text: string) => void; isLoading: boolean }> = ({
  onSendMessage,
  isLoading
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-600">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </form>
  );
};

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Initialize the page with a greeting; actual chat happens via the server proxy.
    setMessages([
      { role: Role.MODEL, content: "Hello! I'm your Revolutionary War story assistant. How can I help you brainstorm today?" }
    ]);
    setIsLoading(false);
  }, []);

  const handleSendMessage = async (input: string) => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    const userMessage: ChatMessage = { role: Role.USER, content: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, system: SYSTEM_INSTRUCTION })
      });
      if (!resp.ok) throw new Error('Bad response from proxy');
      const data = await resp.json();
      const text = data?.response || 'No response';
      setMessages((prev) => [...prev, { role: Role.MODEL, content: text }]);
    } catch (e) {
      console.error(e);
      const errorMessage = 'Sorry, an error occurred. Please try again.';
      setError(errorMessage);
      setMessages((prev) => [...prev, { role: Role.MODEL, content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <Message key={index} message={msg} />
        ))}
        {isLoading && messages.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-400">Initializing historical consultant...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {error && <div className="p-4 mx-4 mb-2 text-red-400 bg-red-900/50 rounded">{error}</div>}
      <UserInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatWindow;
