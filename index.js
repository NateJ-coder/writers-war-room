// index.js
// Main application logic

import {
  initFirebase,
  getCurrentUserId,
  getIsAuthReady,
  getDb,
  getPublicCollectionPath,
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  setDoc
} from './firebase-config.js';

// DOM elements
const authStatusEl = document.getElementById('auth-status');
const draftContentEl = document.getElementById('draft-outline-content');
const draftViewBtn = document.getElementById('draft-view-btn');
const outlineViewBtn = document.getElementById('outline-view-btn');
const chatMessagesEl = document.getElementById('chat-messages');
const chatInputEl = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat-btn');
const assetContentEl = document.getElementById('asset-content');
const assetControlBtns = document.querySelectorAll('.asset-controls .control-btn');
const wordCountEl = document.getElementById('word-count');

// State for Outline View
let currentView = 'draft';
let draftData = { draftText: 'Loading...', outlineText: 'Loading...' };

// --- Utility Functions ---

/**
 * Converts a string to a simple-to-read, persistent color for the chat.
 * @param {string} str The string (typically user ID).
 * @returns {string} A CSS color string.
 */
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

/**
 * Renders a single chat message element.
 * @param {object} message The message object from Firestore.
 * @returns {string} The HTML string for the message.
 */
const renderChatMessage = (message) => {
  const isSystem = message.userId === 'System';
  const userDisplay = isSystem ? 'System' : (message.userId.substring(0, 4) + '... (ID: ' + message.userId + ')');
  const time = message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '...';
  const color = isSystem ? 'var(--accent-muted)' : stringToColor(message.userId);

  return `
    <div class="chat-message" style="border-left: 2px solid ${color}; padding-left: 8px;">
      <div class="meta" style="color: ${color};">${time} · ${userDisplay}</div>
      <div class="text">${message.text}</div>
    </div>
  `;
};

// --- Firebase & Data Listeners ---

/**
 * Starts all Firestore real-time listeners.
 */
const startDataListeners = () => {
  if (!getIsAuthReady() || !getCurrentUserId() || !getDb()) return;

  listenForDraftOutline();
  listenForChatMessages();
};

/**
 * Listens for real-time updates to the Draft Outline document.
 */
const listenForDraftOutline = () => {
  const db = getDb();
  const outlineRef = doc(db, getPublicCollectionPath('draftState'), 'mainDraft');

  onSnapshot(outlineRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      draftData.draftText = data.draftText || 'No Draft Content available.';
      draftData.outlineText = data.outlineText || 'No Outline Content available.';
    } else {
      // If document doesn't exist, create a default structure
      console.log("Draft document not found. Creating default.");
      draftData.draftText = 'START YOUR DRAFT HERE\n\n[Collaborative writing space. All changes are synced in real-time.]';
      draftData.outlineText = 'CHAPTER I: SETUP\n- Introduce Kael and the siege preparations.\n- Foreshadow missing crates (Betrayal).';
      setDoc(outlineRef, draftData, { merge: true }).catch(e => console.error("Error setting initial draft:", e));
    }
    updateDraftOutlineUI();
  }, (error) => {
    console.error("Error listening to draft outline:", error);
    draftContentEl.textContent = 'ERROR LOADING DRAFT. Check console.';
  });
};

/**
 * Listens for real-time updates to the Chat Log.
 */
const listenForChatMessages = () => {
  const db = getDb();
  const chatQuery = query(
    collection(db, getPublicCollectionPath('chatLog')),
    orderBy('timestamp', 'desc')
    // Limiting to 50 messages for performance
  );

  onSnapshot(chatQuery, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push(doc.data());
    });

    // Reverse to show newest at the bottom
    const messageHtml = messages.reverse().map(renderChatMessage).join('');
    chatMessagesEl.innerHTML = messageHtml;

    // Scroll to bottom
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  }, (error) => {
    console.error("Error listening to chat log:", error);
  });
};

// --- UI Update & Interaction Handlers ---

/**
 * Updates the main Draft/Outline panel content based on the current view state.
 */
const updateDraftOutlineUI = () => {
  const content = currentView === 'draft' ? draftData.draftText : draftData.outlineText;
  draftContentEl.textContent = content;

  // Update Word Count (Draft View only)
  if (currentView === 'draft') {
    const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    wordCountEl.textContent = wordCount.toLocaleString();
  } else {
    wordCountEl.textContent = 'N/A';
  }
};

/**
 * Handles the toggle between Draft View and Outline View.
 * @param {string} view 'draft' or 'outline'.
 */
const handleViewToggle = (view) => {
  currentView = view;

  draftViewBtn.classList.remove('active');
  outlineViewBtn.classList.remove('active');

  if (view === 'draft') {
    draftViewBtn.classList.add('active');
  } else {
    outlineViewBtn.classList.add('active');
  }
  updateDraftOutlineUI();
};

/**
 * Sends a new chat message to Firestore.
 */
const handleSendChat = async () => {
  const text = chatInputEl.value.trim();
  if (!text || !getIsAuthReady() || !getDb()) return;

  try {
    const db = getDb();
    await addDoc(collection(db, getPublicCollectionPath('chatLog')), {
      userId: getCurrentUserId(),
      text: text,
      timestamp: serverTimestamp()
    });
    chatInputEl.value = ''; // Clear input on success
  } catch (error) {
    console.error("Error sending chat message:", error);
  }
};

/**
 * Updates the Asset Library content based on the button clicked.
 * @param {string} assetType The type of asset ('characters', 'weapons', 'locations').
 */
const updateAssetContent = (assetType) => {
  let title = '';
  let contentHtml = '';

  // Reset button active states
  assetControlBtns.forEach(btn => btn.classList.remove('active'));
  const activeBtn = Array.from(assetControlBtns).find(btn => btn.getAttribute('data-asset') === assetType);
  if (activeBtn) activeBtn.classList.add('active');

  switch (assetType) {
    case 'characters':
      title = 'Key Character Models';
      contentHtml = `
        <ul>
          <li><strong>Kael:</strong> Commander, protagonist. Arc: Guilt -> Acceptance.</li>
          <li><strong>Lyra:</strong> Captured Mercenary. Trust TBD. (Asset ID 42B)</li>
          <li><strong>The Oracle (AI):</strong> System advisor. Voice of logic.</li>
        </ul>
      `;
      break;
    case 'weapons':
      title = 'Standard Weapon Schematics';
      contentHtml = `
        <ul>
          <li><strong>Plasma-Caster (Mk IV):</strong> Standard issue rifle. High heat, low sustained fire.</li>
          <li><strong>Shield-Emitters (Siege):</strong> Heavy, portable energy shields for defense. Requires 2 men.</li>
          <li><strong>The Whisper:</strong> Kael's personal, silenced kinetic pistol. Unique.</li>
        </ul>
      `;
      break;
    case 'locations':
      title = 'Critical Location Concepts';
      contentHtml = `
        <ul>
          <li><strong>Sunken Tower:</strong> Main objective. Surrounded by tidal marsh.</li>
          <li><strong>Harbour District:</strong> Point of betrayal/supply drop. Dirty, fog-ridden.</li>
          <li><strong>Inner Wall Section 7:</strong> Where the breach occurs (Act II Midpoint).</li>
        </ul>
      `;
      break;
  }
  assetContentEl.innerHTML = `<h4>${title}</h4>${contentHtml}`;
};

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initial Firebase setup
  try {
    await initFirebase();
    authStatusEl.textContent = getCurrentUserId();
    startDataListeners();
  } catch (error) {
    authStatusEl.textContent = 'Error!';
  }

  // 2. Draft/Outline View Toggle
  draftViewBtn.addEventListener('click', () => handleViewToggle('draft'));
  outlineViewBtn.addEventListener('click', () => handleViewToggle('outline'));

  // 3. Chat Send Button
  sendChatBtn.addEventListener('click', handleSendChat);
  chatInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSendChat();
    }
  });

  // 4. Asset Library Controls
  assetControlBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const assetType = btn.getAttribute('data-asset');
      updateAssetContent(assetType);
    });
  });
  // Initial Asset Content Load
  updateAssetContent('characters');

  // 5. Initial state setup (Draft view by default)
  handleViewToggle('draft');
});
