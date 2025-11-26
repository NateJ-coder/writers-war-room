// index.js
// Main application logic

import {
  initFirebase,
  getCurrentUserId,
  getIsAuthReady,
  getDb
} from './firebase-config.js';

// Initialize Firebase when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initFirebase();
    console.log('Firebase initialized. User ID:', getCurrentUserId());
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
});

// Add your application logic here
