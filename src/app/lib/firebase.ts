/**
 * firebase.ts — Firebase app & auth singleton
 *
 * All Firebase config values are read from VITE_FIREBASE_* environment
 * variables so they are never hard-coded in source. Copy .env.example to
 * .env.local and fill in the values from your Firebase project console:
 *   Firebase Console → Project Settings → Your apps → SDK setup and configuration
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             as string,
};

// Initialize Firebase exactly once
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firebase Functions
export const functions = getFunctions(app);

// Initialize Firestore — used to read organization subscription data
export const db = getFirestore(app);
