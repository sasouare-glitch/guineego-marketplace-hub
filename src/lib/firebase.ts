import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator,
  GoogleAuthProvider,
  FacebookAuthProvider
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Configuration Firebase GuineeGo
const firebaseConfig = {
  apiKey: "AIzaSyCsvYHumm9Nad6VAFT3CYoQZ2KTO7YHkt4",
  authDomain: "guineego.firebaseapp.com",
  projectId: "guineego",
  storageBucket: "guineego.firebasestorage.app",
  messagingSenderId: "1002625910773",
  appId: "1:1002625910773:web:9f503619289e2750fac2bc",
  measurementId: "G-2G8MMS1VBJ"
};

// Initialisation de l'app Firebase
const app = initializeApp(firebaseConfig);

// Services Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Providers OAuth
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// Configuration des providers
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Connexion aux émulateurs en développement
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

export default app;
