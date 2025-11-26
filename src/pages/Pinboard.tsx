import { useState, useEffect, useRef } from 'react';
import type { Note } from '../types';
import { getChatResponse } from '../services/geminiService';
import { Role } from '../types/chatbot';

const Pinboard = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draggedNote, setDraggedNote] = useState<Note | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingMode, setConnectingMode] = useState(false);
  const [selectedNoteForConnection, setSelectedNoteForConnection] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const pinboardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load notes from localStorage on mount and listen for changes
  useEffect(() => {
    const loadNotes = () => {
      const saved = localStorage.getItem('pinboard-notes');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setNotes(parsed);
        } catch (e) {
          console.error('Error loading notes:', e);
        }
      }
    };

    loadNotes();

    // Listen for storage changes (from chatbot commands)
    window.addEventListener('storage', loadNotes);
    return () => window.removeEventListener('storage', loadNotes);
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
      rotation: Math.random() * 6 - 3,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      type: 'text',
      connections: []
    };
    setNotes([...notes, newNote]);
  };

  const addImageNote = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newNote: Note = {
          id: `note-${Date.now()}`,
          text: file.name,
          timestamp: Date.now(),
          rotation: Math.random() * 6 - 3,
          x: 100 + Math.random() * 200,
          y: 100 + Math.random() * 200,
          type: 'image',
          imageUrl: event.target?.result as string,
          connections: []
        };
        setNotes([...notes, newNote]);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateNote = (id: string, text: string) => {
    setNotes(notes.map((note: Note) => 
      note.id === id ? { ...note, text } : note
    ));
  };

  const deleteNote = (id: string) => {
    // Remove this note and all connections to it
    setNotes(notes.filter((note: Note) => note.id !== id).map(note => ({
      ...note,
      connections: note.connections?.filter(connId => connId !== id) || []
    })));
  };

  const refineNote = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note || note.type === 'image') return;

    setIsAiProcessing(true);
    try {
      const prompt = `Please refine and improve the following note text for clarity and grammar while maintaining its original meaning and keeping it concise:\n\n"${note.text}"`;
      const response = await getChatResponse([{ role: Role.USER, content: prompt }]);
      
      setNotes(notes.map(n => 
        n.id === id ? { ...n, text: response.text } : n
      ));
    } catch (error) {
      console.error('Error refining note:', error);
      alert('Failed to refine note. Please try again.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const sortChronologically = async () => {
    setIsAiProcessing(true);
    try {
      const notesText = notes.map((n, idx) => `Note ${idx + 1}: ${n.text}`).join('\n\n');
      const prompt = `Analyze these story notes and determine their chronological order in the narrative timeline. Return ONLY a JSON array of note numbers in chronological order, like [3, 1, 5, 2, 4]. Here are the notes:\n\n${notesText}`;
      
      const response = await getChatResponse([{ role: Role.USER, content: prompt }]);
      
      // Extract JSON array from response
      const match = response.text.match(/\[[\d,\s]+\]/);
      if (match) {
        const order: number[] = JSON.parse(match[0]);
        const sortedNotes = order.map(idx => notes[idx - 1]).filter(Boolean);
        
        // Position notes in a grid based on chronological order
        const sorted = sortedNotes.map((note, idx) => ({
          ...note,
          x: 100 + (idx % 4) * 280,
          y: 100 + Math.floor(idx / 4) * 220
        }));
        
        setNotes(sorted);
      } else {
        // Fallback to timestamp sorting
        setNotes([...notes].sort((a, b) => a.timestamp - b.timestamp).map((note, idx) => ({
          ...note,
          x: 100 + (idx % 4) * 280,
          y: 100 + Math.floor(idx / 4) * 220
        })));
      }
    } catch (error) {
      console.error('Error sorting chronologically:', error);
      // Fallback to timestamp sorting
      setNotes([...notes].sort((a, b) => a.timestamp - b.timestamp).map((note, idx) => ({
        ...note,
        x: 100 + (idx % 4) * 280,
        y: 100 + Math.floor(idx / 4) * 220
      })));
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, note: Note) => {
    if ((e.target as HTMLElement).classList.contains('delete-note') ||
        (e.target as HTMLElement).classList.contains('refine-note') ||
        (e.target as HTMLElement).classList.contains('connect-note') ||
        (e.target as HTMLElement).contentEditable === 'true') {
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDraggedNote(note);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNote || !pinboardRef.current) return;

    const rect = pinboardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    setNotes(notes.map(note =>
      note.id === draggedNote.id ? { ...note, x, y } : note
    ));
  };

  const handleMouseUp = () => {
    setDraggedNote(null);
  };

  const toggleConnectionMode = () => {
    setConnectingMode(!connectingMode);
    setSelectedNoteForConnection(null);
  };

  const handleNoteClick = (noteId: string) => {
    if (!connectingMode) return;

    if (!selectedNoteForConnection) {
      setSelectedNoteForConnection(noteId);
    } else {
      // Create connection
      if (selectedNoteForConnection !== noteId) {
        setNotes(notes.map(note => {
          if (note.id === selectedNoteForConnection) {
            return {
              ...note,
              connections: [...(note.connections || []), noteId]
            };
          }
          return note;
        }));
      }
      setSelectedNoteForConnection(null);
      setConnectingMode(false);
    }
  };

  const removeConnection = (fromId: string, toId: string) => {
    setNotes(notes.map(note =>
      note.id === fromId
        ? { ...note, connections: note.connections?.filter(id => id !== toId) || [] }
        : note
    ));
  };

  // Render red strings between connected notes
  const renderConnections = () => {
    const lines: JSX.Element[] = [];
    notes.forEach(note => {
      note.connections?.forEach(connId => {
        const targetNote = notes.find(n => n.id === connId);
        if (targetNote && note.x !== undefined && note.y !== undefined && targetNote.x !== undefined && targetNote.y !== undefined) {
          const x1 = note.x + 110; // Center of note
          const y1 = note.y + 90;
          const x2 = targetNote.x + 110;
          const y2 = targetNote.y + 90;
          
          // Calculate control point for curved string (sag effect)
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          const sag = distance * 0.15; // 15% sag for natural droop
          
          // Perpendicular offset for natural droop
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const controlX = midX + Math.sin(angle) * sag;
          const controlY = midY - Math.cos(angle) * sag;
          
          const pathData = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
          
          lines.push(
            <g key={`${note.id}-${connId}`}>
              {/* Shadow for depth */}
              <path
                d={pathData}
                stroke="rgba(0, 0, 0, 0.3)"
                strokeWidth="4"
                fill="none"
                transform="translate(2, 2)"
                style={{ filter: 'blur(2px)', pointerEvents: 'none' }}
              />
              {/* Main string */}
              <path
                d={pathData}
                stroke="#dc143c"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                style={{ cursor: 'pointer' }}
                onClick={() => removeConnection(note.id, connId)}
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 0.5,-0.3; 0,0; -0.5,0.3; 0,0"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </path>
              {/* Highlight strand for texture */}
              <path
                d={pathData}
                stroke="rgba(255, 100, 120, 0.5)"
                strokeWidth="1"
                fill="none"
                strokeDasharray="2,3"
                strokeLinecap="round"
                style={{ pointerEvents: 'none' }}
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 0.5,-0.3; 0,0; -0.5,0.3; 0,0"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </path>
            </g>
          );
        }
      });
    });
    return lines;
  };

  return (
    <div className="pinboard-container">
      <div className="pinboard-actions">
        <button onClick={addNote} className="add-note-btn" disabled={isAiProcessing}>
          📝 Add Text Note
        </button>
        <button onClick={addImageNote} className="add-note-btn" disabled={isAiProcessing}>
          🖼️ Add Image
        </button>
        <button 
          onClick={toggleConnectionMode} 
          className={`sort-btn ${connectingMode ? 'active-mode' : ''}`}
          disabled={isAiProcessing}
        >
          {connectingMode ? '✓ Connect Mode' : '🔗 Connect Notes'}
        </button>
        <button 
          onClick={sortChronologically} 
          className="sort-btn"
          disabled={isAiProcessing}
        >
          {isAiProcessing ? '🤔 AI Sorting...' : '📅 AI Sort Chronologically'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />

      <div 
        className="pinboard" 
        ref={pinboardRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg className="connection-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <g style={{ pointerEvents: 'auto' }}>
            {renderConnections()}
          </g>
        </svg>

        {notes.map((note: Note) => (
          <div
            key={note.id}
            className={`sticky-note ${note.type === 'image' ? 'image-note' : ''} ${selectedNoteForConnection === note.id ? 'selected-for-connection' : ''}`}
            onMouseDown={(e) => handleMouseDown(e, note)}
            onClick={() => handleNoteClick(note.id)}
            style={{ 
              transform: `rotate(${note.rotation}deg)`,
              left: `${note.x}px`,
              top: `${note.y}px`,
              cursor: connectingMode ? 'pointer' : 'move'
            }}
          >
            <div className="note-actions">
              <button 
                className="refine-note" 
                onClick={(e) => {
                  e.stopPropagation();
                  refineNote(note.id);
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
                  deleteNote(note.id);
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
                onBlur={(e) => updateNote(note.id, e.currentTarget.textContent || '')}
                dangerouslySetInnerHTML={{ __html: note.text }}
              />
            )}

            <div className="note-timestamp">
              {new Date(note.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {connectingMode && (
        <div className="connection-instructions">
          {selectedNoteForConnection 
            ? '📍 Click another note to connect them with a red string'
            : '📍 Click a note to start connecting'}
        </div>
      )}
    </div>
  );
};

export default Pinboard;
