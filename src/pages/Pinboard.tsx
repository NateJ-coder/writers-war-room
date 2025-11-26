import { useState, useEffect, useRef } from 'react';
import type { Note } from '../types';
import { getChatResponse } from '../services/geminiService';
import { Role } from '../types/chatbot';
import ThreeLineConnector from '../components/ThreeLineConnector';

const Pinboard = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draggedNote, setDraggedNote] = useState<Note | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [drawingConnection, setDrawingConnection] = useState<{ noteId: string; startX: number; startY: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredThumbTack, setHoveredThumbTack] = useState<string | null>(null);
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
        (e.target as HTMLElement).classList.contains('thumbtack') ||
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
    if (!pinboardRef.current) return;

    const rect = pinboardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setMousePos({ x: mouseX, y: mouseY });

    if (draggedNote) {
      const x = mouseX - dragOffset.x;
      const y = mouseY - dragOffset.y;
      setNotes(notes.map(note =>
        note.id === draggedNote.id ? { ...note, x, y } : note
      ));
    } else if (drawingConnection) {
      // Check for nearby thumbtacks
      const nearbyId = findNearbyThumbTack(mouseX, mouseY, drawingConnection.noteId);
      setHoveredThumbTack(nearbyId);
    }
  };

  const handleMouseUp = () => {
    if (drawingConnection && hoveredThumbTack) {
      // Create the connection
      setNotes(notes.map(note => {
        if (note.id === drawingConnection.noteId) {
          const existingConnections = note.connections || [];
          if (!existingConnections.includes(hoveredThumbTack)) {
            return {
              ...note,
              connections: [...existingConnections, hoveredThumbTack]
            };
          }
        }
        return note;
      }));
    }
    
    setDraggedNote(null);
    setDrawingConnection(null);
    setHoveredThumbTack(null);
  };

  const handleThumbTackMouseDown = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    const note = notes.find(n => n.id === noteId);
    if (!note || note.x === undefined || note.y === undefined) return;

    const thumbtackX = note.x + 110;
    const thumbtackY = note.y + 16;

    setDrawingConnection({ noteId, startX: thumbtackX, startY: thumbtackY });
  };

  const findNearbyThumbTack = (x: number, y: number, excludeId: string): string | null => {
    const snapDistance = 30; // pixels
    
    for (const note of notes) {
      if (note.id === excludeId || note.x === undefined || note.y === undefined) continue;
      
      const thumbtackX = note.x + 110;
      const thumbtackY = note.y + 16;
      const distance = Math.sqrt(Math.pow(x - thumbtackX, 2) + Math.pow(y - thumbtackY, 2));
      
      if (distance < snapDistance) {
        return note.id;
      }
    }
    return null;
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
        {/* Taut red string connections */}
        <ThreeLineConnector 
          connections={notes.flatMap(note => 
            (note.connections || []).map(connId => {
              const targetNote = notes.find(n => n.id === connId);
              if (targetNote && note.x !== undefined && note.y !== undefined && targetNote.x !== undefined && targetNote.y !== undefined) {
                return {
                  id: `${note.id}-${connId}`,
                  point1: [note.x + 110, note.y + 16, 0] as [number, number, number], // Thumbtack position
                  point2: [targetNote.x + 110, targetNote.y + 16, 0] as [number, number, number] // Target thumbtack
                };
              }
              return null;
            }).filter((conn): conn is NonNullable<typeof conn> => conn !== null)
          )}
        />

        {notes.map((note: Note) => (
          <div
            key={note.id}
            className={`sticky-note ${note.type === 'image' ? 'image-note' : ''}`}
            onMouseDown={(e) => handleMouseDown(e, note)}
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
              onMouseDown={(e) => handleThumbTackMouseDown(e, note.id)}
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

      {/* Drawing line preview */}
      {drawingConnection && (
        <svg 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          <line 
            x1={drawingConnection.startX}
            y1={drawingConnection.startY}
            x2={hoveredThumbTack ? notes.find(n => n.id === hoveredThumbTack)!.x! + 110 : mousePos.x}
            y2={hoveredThumbTack ? notes.find(n => n.id === hoveredThumbTack)!.y! + 16 : mousePos.y}
            stroke={hoveredThumbTack ? '#00ff00' : '#ff006e'}
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        </svg>
      )}
    </div>
  );
};

export default Pinboard;
