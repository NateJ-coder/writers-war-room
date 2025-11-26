// script.js
// Main application logic for Writer's War-Room

import {
    initFirebase,
    getCurrentUserId,
    getIsAuthReady,
    getDb
} from './firebase-config.js';

// Initialize Firebase when DOM is ready
let firebaseReady = false;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initFirebase();
        firebaseReady = true;
        console.log('Firebase initialized. User ID:', getCurrentUserId());
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }

    // --- 1. Outline Page Population ---
    const outlineData = [
        { act: "Act I: The Hunt", chapter: "1-3", section: "Inciting Incident", description: "Introduce the general, his companion (the mouse), and the kingdom's problem with the vampires. Show his dedication as a leader. A gory crime scene sets him on his path." },
        { act: "Act I: The Hunt", chapter: "4-8", section: "Rising Action", description: "The general and his men track the vampire. Gruesome aftermath shown. Alternating monologues: general's rage vs. vampire's enigmatic loneliness. The mouse observes changing emotions. Pattern of hunt and escape builds tension." },
        { act: "Act I: The Hunt", chapter: "9-12", section: "Midpoint Reveal", description: "The general almost catches the vampire. A fleeting conflict shows her intellect and humanity. First crack in her monstrous facade." },
        { act: "Act II: The Capture and The Shift", chapter: "13-15", section: "Climax of the Chase", description: "The general corners the vampire. Intense fight reveals equality and resilience. He wins but feels something unexpected." },
        { act: "Act II: The Capture and The Shift", chapter: "16-20", section: "Captivity and Discovery", description: "The vampire is captured. Not a simple cage—dialogues show her code, history, and pain. Romance begins through respect and shared loneliness." },
        { act: "Act II: The Capture and The Shift", chapter: "21-25", section: "Forbidden Love", description: "The general falls for the vampire. He accepts her vampiric nature. Suggests peace after witnessing feeding. Mouse notes compassion and preoccupation." },
        { act: "Act III: The Reckoning", chapter: "26-29", section: "The Kingdom's Rejection", description: "The kingdom discovers his love. Accusations of enchantment. Public confrontation. He defends love passionately." },
        { act: "Act III: The Reckoning", chapter: "30-32", section: "Final Conflict", description: "The general chooses between old life and new. Battle or standoff. He and vampire fight together, solidifying bond." },
        { act: "Act III: The Reckoning", chapter: "Epilogue", section: "Happily-for-Us", description: "The lovers find peace—not traditional, but defiant and personal." }
    ];

    const outlineGrid = document.getElementById('outline-grid');
    if (outlineGrid) {
        outlineData.forEach(item => {
            const card = document.createElement('div');
            card.className = 'outline-card';
            card.innerHTML = `
                <h3>${item.section} (Ch. ${item.chapter})</h3>
                <p><strong>${item.act}</strong></p>
                <p>${item.description}</p>
            `;
            outlineGrid.appendChild(card);
        });
    }

    // --- 2. Pinboard Page Functionality ---
    const addNoteBtn = document.getElementById('add-note-btn');
    const sortNotesBtn = document.getElementById('sort-notes-btn');
    const pinboardContainer = document.getElementById('pinboard-container');

    if (addNoteBtn && pinboardContainer) {
        let noteCount = 0;
        let notes = [];

        // Add note functionality
        addNoteBtn.addEventListener('click', () => {
            noteCount++;
            const timestamp = Date.now();
            const note = document.createElement('div');
            note.className = 'sticky-note';
            note.contentEditable = true;
            note.setAttribute('data-note-id', noteCount);
            note.setAttribute('data-timestamp', timestamp);
            note.style.setProperty('--rotation', (Math.random() * 6 - 3));
            note.style.left = `${50 + (noteCount * 20) % 300}px`;
            note.style.top = `${50 + (noteCount * 30) % 200}px`;
            note.innerText = `New Idea #${noteCount}: (Edit me!)\n\nAdd details here and move me around!`;
            
            pinboardContainer.appendChild(note);
            notes.push({ element: note, timestamp: timestamp });

            // Make note draggable
            makeDraggable(note);
        });

        // Sort notes chronologically
        if (sortNotesBtn) {
            sortNotesBtn.addEventListener('click', () => {
                // Sort notes by timestamp
                notes.sort((a, b) => a.timestamp - b.timestamp);
                
                // Rearrange notes in a neat grid
                notes.forEach((noteObj, index) => {
                    const row = Math.floor(index / 3);
                    const col = index % 3;
                    noteObj.element.style.left = `${50 + col * 220}px`;
                    noteObj.element.style.top = `${50 + row * 180}px`;
                    noteObj.element.style.setProperty('--rotation', 0);
                });
            });
        }

        // Drag and drop functionality
        function makeDraggable(element) {
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            
            element.onmousedown = dragMouseDown;

            function dragMouseDown(e) {
                e = e || window.event;
                e.preventDefault();
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = closeDragElement;
                document.onmousemove = elementDrag;
            }

            function elementDrag(e) {
                e = e || window.event;
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                element.style.top = (element.offsetTop - pos2) + "px";
                element.style.left = (element.offsetLeft - pos1) + "px";
            }

            function closeDragElement() {
                document.onmouseup = null;
                document.onmousemove = null;
            }
        }
    }

    // --- 3. Writing Page Functionality ---
    const writingArea = document.getElementById('writing-area');
    const reviewBtn = document.getElementById('review-btn');
    const saveBtn = document.getElementById('save-btn');
    const reviewFeedback = document.getElementById('review-feedback');

    if (writingArea && reviewBtn && saveBtn && reviewFeedback) {
        // Load saved draft from localStorage
        const savedDraft = localStorage.getItem('writingDraft');
        if (savedDraft) {
            writingArea.value = savedDraft;
            reviewBtn.disabled = false;
        }

        // Enable review button when text is present
        writingArea.addEventListener('input', () => {
            reviewBtn.disabled = writingArea.value.trim().length === 0;
        });

        // AI Review simulation
        reviewBtn.addEventListener('click', () => {
            const text = writingArea.value;
            reviewFeedback.innerHTML = `<p><strong>AI Reviewing...</strong></p><p>Analysis complete! This segment flows well, but consider clarifying the Lieutenant's motivation for walking the perimeter. <em>Suggestion: Use stronger verbs to describe the mouse's feeling of tension.</em></p><p><strong>Word Count:</strong> ${text.split(/\s+/).filter(w => w.length > 0).length} words</p>`;
        });

        // Save functionality with localStorage
        saveBtn.addEventListener('click', () => {
            const content = writingArea.value;
            const timestamp = new Date().toLocaleString();
            
            // Save to localStorage
            localStorage.setItem('writingDraft', content);
            localStorage.setItem('lastSaved', timestamp);
            
            reviewFeedback.innerHTML = `<p><strong>✓ Content saved successfully!</strong></p><p>Saved at: ${timestamp}</p><p>Total words: ${content.split(/\s+/).filter(w => w.length > 0).length}</p>`;
            
            // In a real application, this would sync to Firebase
            if (firebaseReady) {
                console.log('Draft would be synced to Firebase here');
            }
        });

        // Auto-save every 30 seconds
        setInterval(() => {
            if (writingArea.value.trim().length > 0) {
                localStorage.setItem('writingDraft', writingArea.value);
                console.log('Auto-saved draft');
            }
        }, 30000);
    }
});
