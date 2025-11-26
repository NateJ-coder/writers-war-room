import React, { useState, useRef } from 'react';
import type { Note } from '../types';

interface StickyNoteProps {
  note: Note;
  onMouseDown: (e: React.MouseEvent, note: Note) => void;
  onUpdateNote: (id: string, text: string) => void;
  onDeleteNote: (id: string) => void;
  onRefineNote: (id: string) => void;
  onThumbTackMouseDown: (e: React.MouseEvent, noteId: string) => void;
  onToggleSelect?: (id: string) => void;
  isAiProcessing: boolean;
  showCheckbox?: boolean;
}

const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  onMouseDown,
  onUpdateNote,
  onDeleteNote,
  onRefineNote,
  onThumbTackMouseDown,
  onToggleSelect,
  isAiProcessing,
  showCheckbox = false
}) => {
  const [showToolbar, setShowToolbar] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (contentRef.current) {
      onUpdateNote(note.id, contentRef.current.innerHTML);
    }
  };

  return (
    <div
      key={note.id}
      className={`sticky-note ${note.type === 'image' || note.type === 'ai-image' ? 'image-note' : ''} ${note.selected ? 'selected' : ''}`}
      onMouseDown={(e) => onMouseDown(e, note)}
      style={{ 
        transform: `rotate(${note.rotation}deg)`,
        left: `${note.x}px`,
        top: `${note.y}px`,
        cursor: 'move',
        border: note.selected ? '3px solid var(--neon-blue)' : undefined
      }}
    >
      {/* Selection checkbox */}
      {showCheckbox && onToggleSelect && (
        <div 
          className="note-checkbox"
          style={{
            position: 'absolute',
            top: '5px',
            left: '5px',
            zIndex: 20,
            cursor: 'pointer'
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(note.id);
          }}
        >
          <input
            type="checkbox"
            checked={note.selected || false}
            onChange={() => {}}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>
      )}

      {/* Clickable thumbtack for drawing connections */}
      <div 
        className="thumbtack" 
        onMouseDown={(e) => onThumbTackMouseDown(e, note.id)}
        style={{
          position: 'absolute',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '20px',
          height: '20px',
          cursor: 'crosshair',
          zIndex: 10
        }}
      />

      <div className="note-actions">
        <button 
          className="refine-note" 
          onClick={(e) => {
            e.stopPropagation();
            onRefineNote(note.id);
          }}
          title="AI Format & Refine"
          disabled={isAiProcessing || note.type === 'image' || note.type === 'ai-image'}
        >
          ✨
        </button>
        <button 
          className="delete-note" 
          onClick={(e) => {
            e.stopPropagation();
            onDeleteNote(note.id);
          }}
          title="Delete Note"
        >
          ×
        </button>
      </div>

      {(note.type === 'image' || note.type === 'ai-image') && note.imageUrl ? (
        <div className="note-image-container">
          <img src={note.imageUrl} alt={note.text} className="note-image" />
          <div className="note-image-label">{note.text}</div>
          {note.annotations && (
            <div className="note-annotations" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}>
              <div dangerouslySetInnerHTML={{ __html: note.annotations }} />
            </div>
          )}
        </div>
      ) : (
        <>
          {showToolbar && (
            <div className="note-formatting-toolbar" style={{
              position: 'absolute',
              top: '30px',
              left: '5px',
              right: '5px',
              background: 'rgba(255,255,255,0.95)',
              padding: '5px',
              borderRadius: '4px',
              display: 'flex',
              gap: '4px',
              flexWrap: 'wrap',
              zIndex: 15,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); formatText('bold'); }}
                title="Bold"
                style={{ padding: '4px 8px', fontSize: '12px', fontWeight: 'bold' }}
              >
                B
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); formatText('italic'); }}
                title="Italic"
                style={{ padding: '4px 8px', fontSize: '12px', fontStyle: 'italic' }}
              >
                I
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); formatText('underline'); }}
                title="Underline"
                style={{ padding: '4px 8px', fontSize: '12px', textDecoration: 'underline' }}
              >
                U
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); formatText('hiliteColor', '#ffeb3b'); }}
                title="Highlight"
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                🖍️
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); formatText('insertUnorderedList'); }}
                title="Bullet List"
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                •
              </button>
            </div>
          )}
          <div
            ref={contentRef}
            className="note-content"
            contentEditable
            suppressContentEditableWarning
            onFocus={() => setShowToolbar(true)}
            onBlur={(e) => {
              setShowToolbar(false);
              onUpdateNote(note.id, e.currentTarget.innerHTML);
            }}
            dangerouslySetInnerHTML={{ __html: note.text }}
          />
        </>
      )}

      <div className="note-timestamp">
        {new Date(note.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default StickyNote;
