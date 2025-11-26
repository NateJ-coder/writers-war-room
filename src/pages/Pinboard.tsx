import { useState, useEffect } from 'react';
import type { Note } from '../types';

const Pinboard = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draggedNote, setDraggedNote] = useState<Note | null>(null);

  // Load notes from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pinboard-notes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotes(parsed);
      } catch (e) {
        console.error('Error loading notes:', e);
      }
    }
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pinboard-notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      text: 'New note...',
      timestamp: Date.now(),
      rotation: Math.random() * 6 - 3 // Random rotation between -3 and 3 degrees
    };
    setNotes([...notes, newNote]);
  };

  const updateNote = (id: string, text: string) => {
    setNotes(notes.map((note: Note) => 
      note.id === id ? { ...note, text } : note
    ));
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((note: Note) => note.id !== id));
  };

  const sortChronologically = () => {
    setNotes([...notes].sort((a, b) => a.timestamp - b.timestamp));
  };

  const handleDragStart = (e: React.DragEvent, note: Note) => {
    setDraggedNote(note);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetNote: Note) => {
    e.preventDefault();
    if (!draggedNote || draggedNote.id === targetNote.id) return;

    const draggedIdx = notes.findIndex((n: Note) => n.id === draggedNote.id);
    const targetIdx = notes.findIndex((n: Note) => n.id === targetNote.id);

    const newNotes = [...notes];
    newNotes.splice(draggedIdx, 1);
    newNotes.splice(targetIdx, 0, draggedNote);

    setNotes(newNotes);
    setDraggedNote(null);
  };

  return (
    <div className="pinboard-container">
      <div className="pinboard-actions">
        <button onClick={addNote} className="add-note-btn">+ Add Sticky Note</button>
        <button onClick={sortChronologically} className="sort-btn">📅 Sort Chronologically</button>
      </div>

      <div className="pinboard" id="pinboard">
        {notes.map((note: Note) => (
          <div
            key={note.id}
            className="sticky-note"
            draggable
            onDragStart={(e) => handleDragStart(e, note)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, note)}
            style={{ transform: `rotate(${note.rotation}deg)` }}
          >
            <button 
              className="delete-note" 
              onClick={() => deleteNote(note.id)}
              title="Delete Note"
            >
              ×
            </button>
            <div
              className="note-content"
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateNote(note.id, e.currentTarget.textContent || '')}
              dangerouslySetInnerHTML={{ __html: note.text }}
            />
            <div className="note-timestamp">
              {new Date(note.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pinboard;
