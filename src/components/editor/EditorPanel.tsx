import React from 'react';

interface EditorPanelProps {
  text: string;
  onTextChange: (newText: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

const AnalyzeIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12h.01M12 12h.01M9 12h.01M6 12h.01M12 9h.01M12 6h.01" />
    </svg>
);

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const EditorPanel: React.FC<EditorPanelProps> = ({ text, onTextChange, onAnalyze, isLoading }) => {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = text.length;

  return (
    <div className="flex flex-col bg-slate-800 rounded-lg shadow-2xl overflow-hidden h-full">
      <div className="flex-grow flex flex-col p-1">
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Paste your manuscript here..."
          className="w-full h-full p-4 bg-slate-900 text-slate-300 rounded-t-md resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 font-serif text-lg leading-relaxed selection:bg-cyan-400/20"
          spellCheck="false"
        />
      </div>
      <div className="flex-shrink-0 flex items-center justify-between p-3 bg-slate-800 border-t border-slate-700">
        <div className="text-sm text-slate-400 font-mono">
            <span>Words: {wordCount}</span>
            <span className="mx-2">|</span>
            <span>Chars: {charCount}</span>
        </div>
        <button
          onClick={onAnalyze}
          disabled={isLoading || !text.trim()}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-cyan-600 text-white font-semibold rounded-md shadow-md hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500"
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              Analyzing...
            </>
          ) : (
            <>
              <AnalyzeIcon className="h-5 w-5" />
              Analyze & Edit
            </>
          )}
        </button>
      </div>
    </div>
  );
};
