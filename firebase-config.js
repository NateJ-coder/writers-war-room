// firebase-config.js
// Firebase configuration and initialization module

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
  getFirestore, doc, onSnapshot, collection, query, orderBy, 
  addDoc, serverTimestamp, setDoc, getDoc, setLogLevel 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Get Firebase configuration from window (set in index.html)
const firebaseConfig = window.__firebaseConfig || {
  apiKey: "AIzaSyBHo3T6TRjInJ2pBkHNXdMbStY_ec7aRM8",
  authDomain: "writer-s-war-room.firebaseapp.com",
  projectId: "writer-s-war-room",
  storageBucket: "writer-s-war-room.firebasestorage.app",
  messagingSenderId: "827308712794",
  appId: "1:827308712794:web:b11cf4c42bbdf483f9c963"
};

const appId = 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Firebase services
let app, db, auth;
let currentUserId = null;
let isAuthReady = false;

/**
 * Defines the path for a public collection shared by all users of this app.
 * @param {string} collectionName The name of the collection (e.g., 'chatLog', 'draftOutline').
 * @returns {string} The full Firestore path.
 */
export const getPublicCollectionPath = (collectionName) => {
  // Path format: /artifacts/{appId}/public/data/{collectionName}
  return `artifacts/${appId}/public/data/${collectionName}`;
};

/**
 * Handles Firebase initialization and authentication.
 * @returns {Promise<void>}
 */
export const initFirebase = async () => {
  try {
    setLogLevel('debug');
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    // Sign in using the custom token or anonymously
    if (initialAuthToken) {
      await signInWithCustomToken(auth, initialAuthToken);
    } else {
      await signInAnonymously(auth);
    }

    return new Promise((resolve) => {
      // Auth state listener to set user ID and readiness
      onAuthStateChanged(auth, (user) => {
        if (user) {
          currentUserId = user.uid;
        } else {
          // Should not happen after sign-in, but handle fallback
          currentUserId = 'ANON';
        }
        isAuthReady = true;
        resolve();
      });
    });

  } catch (error) {
    console.error("Firebase Initialization/Auth Error:", error);
    throw error;
  }
};

/**
 * Get the current user ID
 * @returns {string|null}
 */
export const getCurrentUserId = () => currentUserId;

/**
 * Check if auth is ready
 * @returns {boolean}
 */
export const getIsAuthReady = () => isAuthReady;

/**
 * Get Firestore instance
 * @returns {Firestore}
 */
export const getDb = () => db;

/**
 * Export Firestore functions for use in other modules
 */
export { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  setDoc, 
  getDoc 
};
