
import React from 'react';
import { Role, ChatMessage } from '../types';

interface MessageProps {
  message: ChatMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  const userStyles = 'bg-[#268bd2] text-white self-end rounded-br-none';
  const modelStyles = 'bg-[#eee8d5] text-gray-800 self-start rounded-bl-none';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`rounded-xl p-3 max-w-xs md:max-w-md lg:max-w-lg shadow-md whitespace-pre-wrap ${
          isUser ? userStyles : modelStyles
        }`}
      >
        {message.content}
      </div>
    </div>
  );
};

export default Message;
