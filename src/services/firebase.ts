import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  setDoc, 
  getDoc,
  Firestore 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBHo3T6TRjInJ2pBkHNXdMbStY_ec7aRM8",
  authDomain: "writer-s-war-room.firebaseapp.com",
  projectId: "writer-s-war-room",
  storageBucket: "writer-s-war-room.firebasestorage.app",
  messagingSenderId: "827308712794",
  appId: "1:827308712794:web:b11cf4c42bbdf483f9c963"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUserId: string | null = null;
let isAuthReady = false;

/**
 * Defines the path for a public collection shared by all users of this app.
 */
export const getPublicCollectionPath = (collectionName: string): string => {
  const appId = 'default-app-id';
  return `artifacts/${appId}/public/data/${collectionName}`;
};

/**
 * Handles Firebase initialization and authentication.
 */
export const initFirebase = async (): Promise<void> => {
  try {
    await signInAnonymously(auth);

    return new Promise((resolve) => {
      onAuthStateChanged(auth, (user: User | null) => {
        if (user) {
          currentUserId = user.uid;
        } else {
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
 */
export const getCurrentUserId = (): string | null => currentUserId;

/**
 * Check if auth is ready
 */
export const getIsAuthReady = (): boolean => isAuthReady;

/**
 * Get Firestore instance
 */
export const getDb = (): Firestore => db;

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
