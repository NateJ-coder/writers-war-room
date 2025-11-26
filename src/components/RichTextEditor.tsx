import React, { useRef, useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onBlur?: () => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, onBlur }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const createList = (ordered: boolean) => {
    formatText(ordered ? 'insertOrderedList' : 'insertUnorderedList');
  };

  return (
    <div className="rich-text-editor">
      <div className="editor-toolbar">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); formatText('bold'); }}
          title="Bold (Ctrl+B)"
          className="toolbar-btn"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); formatText('italic'); }}
          title="Italic (Ctrl+I)"
          className="toolbar-btn"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); formatText('underline'); }}
          title="Underline (Ctrl+U)"
          className="toolbar-btn"
        >
          <u>U</u>
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); formatText('hiliteColor', '#ffeb3b'); }}
          title="Highlight"
          className="toolbar-btn"
        >
          🖍️
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); createList(false); }}
          title="Bullet List"
          className="toolbar-btn"
        >
          • List
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); createList(true); }}
          title="Numbered List"
          className="toolbar-btn"
        >
          1. List
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); formatText('removeFormat'); }}
          title="Clear Formatting"
          className="toolbar-btn"
        >
          ✖️
        </button>
      </div>
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        onInput={handleInput}
        onBlur={onBlur}
        suppressContentEditableWarning
      />
    </div>
  );
};
