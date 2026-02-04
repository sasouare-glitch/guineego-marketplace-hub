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
  enableIndexedDbPersistence,
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

// Enable offline persistence for Firestore
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support offline persistence.');
    }
  });
}

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

// Export initialized services
export { app, auth, db, storage, functions };
export default app;
