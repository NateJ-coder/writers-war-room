import React from 'react';
import type { Suggestion } from '../../types/editor';

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAccept: (suggestion: Suggestion) => void;
  onReject: (suggestion: Suggestion) => void;
  typeDetails: { label: string; color: string };
}

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const XIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, onAccept, onReject, typeDetails }) => {
  return (
    <div className="bg-slate-900/70 border border-slate-700 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:border-cyan-500/50">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className={`px-3 py-1 text-xs font-bold text-white rounded-full ${typeDetails.color}`}>
            {typeDetails.label}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-400 mb-1">Original Text</p>
            <p className="p-2 bg-red-900/30 border-l-4 border-red-500 rounded text-red-200 font-mono text-sm">
              <del>{suggestion.original}</del>
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-400 mb-1">Suggestion</p>
            <p className="p-2 bg-green-900/30 border-l-4 border-green-500 rounded text-green-200 font-mono text-sm">
              <ins className="no-underline">{suggestion.suggestion}</ins>
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-400 mb-1">Explanation</p>
            <p className="text-slate-300 text-sm">{suggestion.explanation}</p>
          </div>
        </div>
      </div>
      <div className="bg-slate-800/50 p-2 flex justify-end gap-2">
        <button 
          onClick={() => onReject(suggestion)}
          className="px-3 py-1 text-sm font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors duration-200 flex items-center gap-1"
          aria-label="Reject suggestion"
        >
          <XIcon />
          Reject
        </button>
        <button
          onClick={() => onAccept(suggestion)}
          className="px-3 py-1 text-sm font-semibold text-white bg-green-600 hover:bg-green-500 rounded-md transition-colors duration-200 flex items-center gap-1"
          aria-label="Accept suggestion"
        >
          <CheckIcon />
          Accept
        </button>
      </div>
    </div>
  );
};
