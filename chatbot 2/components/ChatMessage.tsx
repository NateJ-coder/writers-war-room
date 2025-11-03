
import React from 'react';
import type { Message } from '../types';
import { Role } from '../types';
import { UserIcon } from './icons/UserIcon';
import { BotIcon } from './icons/BotIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading = false }) => {
  const isUserModel = message.role === Role.MODEL;

  const containerClasses = `flex items-start gap-4 my-6 ${!isUserModel ? 'flex-row-reverse' : ''}`;
  const bubbleClasses = `relative max-w-xl px-5 py-3 rounded-2xl shadow ${isUserModel 
    ? 'bg-zinc-800/80 text-stone-200 rounded-bl-none' 
    : 'bg-amber-800/80 text-white rounded-br-none'
  }`;

  const icon = isUserModel 
    ? <BotIcon className="w-8 h-8 text-amber-100 flex-shrink-0" />
    : <UserIcon className="w-8 h-8 text-stone-300 flex-shrink-0" />;

  const formattedText = message.parts[0]?.text.split('\n').map((line, i) => (
    <React.Fragment key={i}>
      {line}
      <br />
    </React.Fragment>
  ));

  return (
    <div className={containerClasses}>
      {icon}
      <div className={bubbleClasses}>
        {isLoading ? (
          <div className="flex items-center justify-center p-2">
            <SpinnerIcon className="w-6 h-6 text-stone-300" />
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{formattedText}</p>
        )}
      </div>
    </div>
  );
};
