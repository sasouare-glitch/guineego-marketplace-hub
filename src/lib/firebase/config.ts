/**
 * Firebase Configuration & SDK Initialization
 * Central configuration file for all Firebase services
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  GoogleAuthProvider,
  FacebookAuthProvider,
  type Auth
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore
} from 'firebase/firestore';
import {
  getStorage,
  connectStorageEmulator,
  type FirebaseStorage
} from 'firebase/storage';
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
  type Functions
} from 'firebase/functions';
import {
  getAnalytics,
  isSupported,
  type Analytics
} from 'firebase/analytics';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCsvYHumm9Nad6VAFT3CYoQZ2KTO7YHkt4",
  authDomain: "guineego.firebaseapp.com",
  projectId: "guineego",
  storageBucket: "guineego.firebasestorage.app",
  messagingSenderId: "1002625910773",
  appId: "1:1002625910773:web:9f503619289e2750fac2bc",
  measurementId: "G-2G8MMS1VBJ"
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let functions: Functions;
let analytics: Analytics | null = null;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize services
auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);
functions = getFunctions(app, 'europe-west1');

// NOTE:
// IndexedDB persistence is intentionally disabled because this project has
// multiple high-churn realtime listeners and Firebase 12.8.0 can hit the
// b815/ca9 internal assertion when local persistence + watch state drift.
// Default in-memory cache is more stable here and prevents blank-screen crashes.

// OAuth Providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// Cloud Functions callable helpers
export const callFunction = <TData = unknown, TResult = unknown>(
  name: string
) => {
  return httpsCallable<TData, TResult>(functions, name);
};

// Initialize Firebase Analytics (only in browser, check support)
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

// Export initialized services
export { app, auth, db, storage, functions, analytics };
export default app;
