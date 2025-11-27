import React from 'react';
import { SuggestionCard } from './SuggestionCard';
import type { Suggestion } from '../../types/editor';
import { SuggestionType } from '../../types/editor';

interface SuggestionsPanelProps {
  suggestions: Suggestion[];
  isLoading: boolean;
  error: string | null;
  onAccept: (suggestion: Suggestion) => void;
  onReject: (suggestion: Suggestion) => void;
  activeFilters: Set<SuggestionType>;
  toggleFilter: (filter: SuggestionType) => void;
  totalSuggestions: number;
}

const suggestionTypeDetails: Record<SuggestionType, { label: string; color: string }> = {
  [SuggestionType.GRAMMAR]: { label: 'Grammar', color: 'bg-blue-500' },
  [SuggestionType.CLARITY]: { label: 'Clarity', color: 'bg-green-500' },
  [SuggestionType.STYLE]: { label: 'Style', color: 'bg-purple-500' },
  [SuggestionType.REDUNDANCY]: { label: 'Redundancy', color: 'bg-yellow-500' },
  [SuggestionType.DUPLICATE]: { label: 'Duplicate', color: 'bg-red-500' },
  [SuggestionType.CHARACTER_CONSISTENCY]: { label: 'Character', color: 'bg-orange-500' },
  [SuggestionType.TONE_STYLE]: { label: 'Tone/Style', color: 'bg-pink-500' },
};

const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-slate-700/50 p-4 rounded-lg">
        <div className="h-4 bg-slate-600 rounded w-1/4 mb-3"></div>
        <div className="h-6 bg-slate-600 rounded w-full mb-2"></div>
        <div className="h-6 bg-slate-600 rounded w-3/4"></div>
      </div>
    ))}
  </div>
);

const EmptyState: React.FC = () => (
  <div className="text-center flex flex-col items-center justify-center h-full p-8">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
    <h3 className="text-xl font-semibold text-slate-300">Ready for Suggestions</h3>
    <p className="text-slate-400 mt-2">Enter your text in the editor and click "Analyze & Edit" to see AI-powered suggestions appear here.</p>
  </div>
);

export const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ suggestions, isLoading, error, onAccept, onReject, activeFilters, toggleFilter, totalSuggestions }) => {
  const hasSuggestions = suggestions.length > 0;
  
  return (
    <div className="flex flex-col bg-slate-800 rounded-lg shadow-2xl overflow-hidden h-full">
      <div className="flex-shrink-0 p-3 bg-slate-800 border-b border-slate-700 flex flex-col gap-3">
        <div className="flex justify-between items-center">
             <h2 className="text-lg font-bold">AI Suggestions</h2>
             <span className="text-sm font-mono px-2 py-1 bg-slate-700 rounded-md">
                {isLoading ? '...' : `${suggestions.length} / ${totalSuggestions}`}
            </span>
        </div>
        {(totalSuggestions > 0 || isLoading) && (
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(suggestionTypeDetails).map(([type, { label, color }]) => (
              <button
                key={type}
                onClick={() => toggleFilter(type as SuggestionType)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
                  activeFilters.has(type as SuggestionType)
                    ? `${color} text-white shadow-md`
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        {isLoading && <LoadingSkeleton />}
        {error && <div className="text-center p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">{error}</div>}
        
        {!isLoading && !error && !hasSuggestions && totalSuggestions === 0 && <EmptyState />}
        
        {!isLoading && !error && hasSuggestions && (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={onAccept}
                onReject={onReject}
                typeDetails={suggestionTypeDetails[suggestion.type]}
              />
            ))}
          </div>
        )}

        {!isLoading && !error && !hasSuggestions && totalSuggestions > 0 && (
            <div className="text-center text-slate-400 p-8">
                <p>All suggestions for the selected filters have been addressed.</p>
                <p>Try selecting other filter categories above.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export { suggestionTypeDetails };
