interface ChatbotToggleProps {
  onClick: () => void;
  isOpen: boolean;
  unreadCount?: number;
}

export const ChatbotToggle = ({ onClick, isOpen, unreadCount }: ChatbotToggleProps) => {
  return (
    <button
      onClick={onClick}
      className="chatbot-toggle"
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      {!isOpen && unreadCount && unreadCount > 0 && (
        <span className="chatbot-badge">{unreadCount}</span>
      )}
      {isOpen ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )}
    </button>
  );
};
