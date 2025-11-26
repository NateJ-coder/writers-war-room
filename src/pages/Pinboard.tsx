import { useState, useEffect, useRef } from 'react';
import type { Note } from '../types';
import { getChatResponse, formatStickyNote, searchImages } from '../services/geminiService';
import { Role } from '../types/chatbot';
import { RedStringAnimation, StickyNote } from '../sticky-notes';
import '../sticky-notes/sticky-notes.css';

const Pinboard = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentBoard, setCurrentBoard] = useState(1);
  const [draggedNote, setDraggedNote] = useState<Note | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [drawingConnection, setDrawingConnection] = useState<{ noteId: string; startX: number; startY: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredThumbTack, setHoveredThumbTack] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
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

  // Get notes for current board
  const currentBoardNotes = notes.filter(note => (note.boardId || 1) === currentBoard);
  const selectedNotes = currentBoardNotes.filter(note => note.selected);

  const addNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      text: 'New note...',
      timestamp: Date.now(),
      rotation: Math.random() * 6 - 3,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      type: 'text',
      connections: [],
      boardId: currentBoard
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
    if (!note || note.type === 'image' || note.type === 'ai-image') return;

    setIsAiProcessing(true);
    try {
      const formattedText = await formatStickyNote(note.text);
      
      setNotes(notes.map(n => 
        n.id === id ? { ...n, text: formattedText } : n
      ));
    } catch (error) {
      console.error('Error refining note:', error);
      alert('Failed to refine note. Please try again.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const addAIImageNote = async () => {
    const query = prompt('Describe the image you want to find (e.g., "map of Hudson River during Revolutionary War"):');
    if (!query) return;

    setIsAiProcessing(true);
    try {
      const imageUrls = await searchImages(query);
      if (imageUrls && imageUrls.length > 0) {
        const newNote: Note = {
          id: `note-${Date.now()}`,
          text: query,
          timestamp: Date.now(),
          rotation: Math.random() * 6 - 3,
          x: 100 + Math.random() * 200,
          y: 100 + Math.random() * 200,
          type: 'ai-image',
          imageUrl: imageUrls[0],
          connections: [],
          boardId: currentBoard
        };
        setNotes([...notes, newNote]);
      }
    } catch (error) {
      console.error('Error fetching AI image:', error);
      alert('Failed to fetch image. Please try again.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const toggleNoteSelection = (id: string) => {
    setNotes(notes.map(note =>
      note.id === id ? { ...note, selected: !note.selected } : note
    ));
    setShowBulkMenu(true);
  };

  const moveSelectedNotes = (targetBoard: number) => {
    setNotes(notes.map(note =>
      note.selected ? { ...note, boardId: targetBoard, selected: false } : note
    ));
    setSelectionMode(false);
    setShowBulkMenu(false);
  };

  const deleteSelectedNotes = () => {
    if (!confirm(`Delete ${selectedNotes.length} selected note(s)?`)) return;
    const selectedIds = new Set(selectedNotes.map(n => n.id));
    setNotes(notes.filter(note => !selectedIds.has(note.id)).map(note => ({
      ...note,
      connections: note.connections?.filter(connId => !selectedIds.has(connId)) || [],
      selected: false
    })));
    setSelectionMode(false);
    setShowBulkMenu(false);
  };

  const aiRewriteSelected = async () => {
    if (selectedNotes.length === 0) return;
    
    setIsAiProcessing(true);
    try {
      const updates = await Promise.all(
        selectedNotes
          .filter(note => note.type === 'text')
          .map(async (note) => {
            const formatted = await formatStickyNote(note.text);
            return { id: note.id, text: formatted };
          })
      );

      setNotes(notes.map(note => {
        const update = updates.find(u => u.id === note.id);
        return update ? { ...note, text: update.text, selected: false } : note;
      }));
      
      setSelectionMode(false);
      setShowBulkMenu(false);
    } catch (error) {
      console.error('Error rewriting notes:', error);
      alert('Failed to rewrite notes. Please try again.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const clearSelection = () => {
    setNotes(notes.map(note => ({ ...note, selected: false })));
    setSelectionMode(false);
    setShowBulkMenu(false);
  };

  const sortChronologically = async () => {
    setIsAiProcessing(true);
    try {
      const boardNotes = currentBoardNotes.filter(n => n.type === 'text');
      const notesText = boardNotes.map((n, idx) => `Note ${idx + 1}: ${n.text}`).join('\n\n');
      const prompt = `Analyze these story notes and determine their chronological order in the narrative timeline. Return ONLY a JSON array of note numbers in chronological order, like [3, 1, 5, 2, 4]. Here are the notes:\n\n${notesText}`;
      
      const response = await getChatResponse([{ role: Role.USER, content: prompt }]);
      
      // Extract JSON array from response
      const match = response.text.match(/\[[\d,\s]+\]/);
      if (match) {
        const order: number[] = JSON.parse(match[0]);
        const sortedBoardNotes = order.map(idx => boardNotes[idx - 1]).filter(Boolean);
        
        // Position notes in a grid based on chronological order
        const sorted = sortedBoardNotes.map((note, idx) => ({
          ...note,
          x: 100 + (idx % 4) * 280,
          y: 100 + Math.floor(idx / 4) * 220
        }));
        
        // Update only notes on current board
        setNotes(notes.map(note => {
          const sortedNote = sorted.find(s => s.id === note.id);
          return sortedNote || note;
        }));
      } else {
        // Fallback to timestamp sorting for current board
        const sortedBoard = [...boardNotes].sort((a, b) => a.timestamp - b.timestamp).map((note, idx) => ({
          ...note,
          x: 100 + (idx % 4) * 280,
          y: 100 + Math.floor(idx / 4) * 220
        }));
        setNotes(notes.map(note => {
          const sortedNote = sortedBoard.find(s => s.id === note.id);
          return sortedNote || note;
        }));
      }
    } catch (error) {
      console.error('Error sorting chronologically:', error);
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

    // Position relative to the note (thumbtack is at center-top)
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
      <div className="pinboard-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={addNote} className="add-note-btn" disabled={isAiProcessing}>
            📝 Add Text Note
          </button>
          <button onClick={addImageNote} className="add-note-btn" disabled={isAiProcessing}>
            🖼️ Upload Image
          </button>
          <button onClick={addAIImageNote} className="add-note-btn" disabled={isAiProcessing}>
            🤖 AI Image Search
          </button>
          <button 
            onClick={sortChronologically} 
            className="sort-btn"
            disabled={isAiProcessing}
          >
            {isAiProcessing ? '🤔 AI Sorting...' : '📅 AI Sort Chronologically'}
          </button>
          <button 
            onClick={() => setSelectionMode(!selectionMode)}
            className="select-btn"
            style={{
              background: selectionMode ? 'var(--neon-blue)' : undefined,
              color: selectionMode ? 'var(--dark-brown)' : undefined
            }}
          >
            {selectionMode ? '✓ Selection Mode' : '☐ Select Notes'}
          </button>
        </div>

        {/* Board Navigation */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ color: 'var(--neon-yellow)', fontFamily: 'Bebas Neue', fontSize: '1.1em' }}>Board:</span>
          {[1, 2, 3, 4].map(boardNum => (
            <button
              key={boardNum}
              onClick={() => {
                setCurrentBoard(boardNum);
                clearSelection();
              }}
              className="board-nav-btn"
              style={{
                padding: '8px 16px',
                background: currentBoard === boardNum ? 'var(--neon-yellow)' : 'var(--surface-medium)',
                color: currentBoard === boardNum ? 'var(--dark-brown)' : 'var(--neon-yellow)',
                border: `2px solid var(--neon-yellow)`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontFamily: 'Bebas Neue'
              }}
            >
              {boardNum}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Operations Menu */}
      {showBulkMenu && selectedNotes.length > 0 && (
        <div className="bulk-operations-menu" style={{
          position: 'fixed',
          top: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--surface-dark)',
          border: '2px solid var(--neon-blue)',
          borderRadius: '8px',
          padding: '15px 20px',
          zIndex: 10000,
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
          boxShadow: '0 10px 30px rgba(0, 217, 255, 0.3)'
        }}>
          <span style={{ color: 'var(--neon-yellow)', fontWeight: 'bold' }}>
            {selectedNotes.length} note{selectedNotes.length > 1 ? 's' : ''} selected
          </span>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={aiRewriteSelected} disabled={isAiProcessing} style={{ padding: '8px 16px' }}>
              ✨ AI Rewrite
            </button>
            
            <select 
              onChange={(e) => moveSelectedNotes(parseInt(e.target.value))}
              defaultValue=""
              style={{ padding: '8px', borderRadius: '4px' }}
            >
              <option value="" disabled>Move to Board...</option>
              {[1, 2, 3, 4].filter(b => b !== currentBoard).map(b => (
                <option key={b} value={b}>Board {b}</option>
              ))}
            </select>

            <button 
              onClick={deleteSelectedNotes}
              style={{ 
                padding: '8px 16px',
                background: 'var(--neon-pink)',
                color: 'var(--dark-brown)'
              }}
            >
              🗑️ Delete
            </button>

            <button 
              onClick={clearSelection}
              style={{ padding: '8px 16px' }}
            >
              ✖️ Cancel
            </button>
          </div>
        </div>
      )}

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
        {/* Red string connections - only for current board */}
        <RedStringAnimation 
          connections={currentBoardNotes.flatMap(note => 
            (note.connections || []).map(connId => {
              const targetNote = currentBoardNotes.find(n => n.id === connId);
              if (targetNote && note.x !== undefined && note.y !== undefined && targetNote.x !== undefined && targetNote.y !== undefined) {
                return {
                  id: `${note.id}-${connId}`,
                  point1: [note.x + 110, note.y + 16] as [number, number], // Thumbtack position
                  point2: [targetNote.x + 110, targetNote.y + 16] as [number, number] // Target thumbtack
                };
              }
              return null;
            }).filter((conn): conn is NonNullable<typeof conn> => conn !== null)
          )}
        />

        {currentBoardNotes.map((note: Note) => (
          <StickyNote
            key={note.id}
            note={note}
            onMouseDown={handleMouseDown}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
            onRefineNote={refineNote}
            onThumbTackMouseDown={handleThumbTackMouseDown}
            onToggleSelect={toggleNoteSelection}
            showCheckbox={selectionMode}
            isAiProcessing={isAiProcessing}
          />
        ))}

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
    </div>
  );
};

export default Pinboard;
