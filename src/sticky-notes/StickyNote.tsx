import React from 'react';
import type { Note } from '../types';

interface StickyNoteProps {
  note: Note;
  onMouseDown: (e: React.MouseEvent, note: Note) => void;
  onUpdateNote: (id: string, text: string) => void;
  onDeleteNote: (id: string) => void;
  onRefineNote: (id: string) => void;
  onThumbTackMouseDown: (e: React.MouseEvent, noteId: string) => void;
  isAiProcessing: boolean;
}

const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  onMouseDown,
  onUpdateNote,
  onDeleteNote,
  onRefineNote,
  onThumbTackMouseDown,
  isAiProcessing
}) => {
  return (
    <div
      key={note.id}
      className={`sticky-note ${note.type === 'image' ? 'image-note' : ''}`}
      onMouseDown={(e) => onMouseDown(e, note)}
      style={{ 
        transform: `rotate(${note.rotation}deg)`,
        left: `${note.x}px`,
        top: `${note.y}px`,
        cursor: 'move'
      }}
    >
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
          title="AI Refine"
          disabled={isAiProcessing || note.type === 'image'}
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

      {note.type === 'image' && note.imageUrl ? (
        <div className="note-image-container">
          <img src={note.imageUrl} alt={note.text} className="note-image" />
          <div className="note-image-label">{note.text}</div>
        </div>
      ) : (
        <div
          className="note-content"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onUpdateNote(note.id, e.currentTarget.textContent || '')}
          dangerouslySetInnerHTML={{ __html: note.text }}
        />
      )}

      <div className="note-timestamp">
        {new Date(note.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default StickyNote;
