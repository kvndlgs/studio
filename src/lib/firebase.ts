import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  "projectId": "suckerpunch",
  "appId": "1:469315916206:web:cc34c554c425cbf13b383f",
  "storageBucket": "suckerpunch.firebasestorage.app",
  "apiKey": "AIzaSyA9kn5DxbBL3KTqPrKGZKML3IsmtxuCwOw",
  "authDomain": "suckerpunch.firebaseapp.com",
  "measurementId": "G-YSYZ0LDK67",
  "messagingSenderId": "469315916206"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');
const auth = getAuth(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
    try {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
        connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    } catch (error) {
        console.error("Error connecting to Firebase emulators:", error);
    }
}

export { app, auth, db, functions };