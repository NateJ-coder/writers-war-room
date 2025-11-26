
import React from 'react';
import { Message, Role } from '../types';
import { BotIcon, UserIcon, SourceIcon } from './icons';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === Role.MODEL;

  return (
    <div className={`flex items-start gap-4 mb-6 ${!isModel && 'flex-row-reverse'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isModel ? 'bg-amber-900/50' : 'bg-stone-700'}`}>
        {isModel ? <BotIcon /> : <UserIcon />}
      </div>
      <div className={`max-w-xl p-4 rounded-lg shadow-md ${isModel ? 'bg-stone-800/60 rounded-tl-none' : 'bg-sky-900/50 rounded-tr-none'}`}>
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-amber-800/40">
            <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-2">
              <SourceIcon />
              Sources
            </h4>
            <ul className="space-y-1">
              {message.sources.map((source, index) => (
                <li key={index}>
                  <a
                    href={source.web.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-stone-400 hover:text-amber-300 transition-colors duration-200 underline"
                  >
                    {source.web.title || new URL(source.web.uri).hostname}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
