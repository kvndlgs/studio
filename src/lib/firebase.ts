import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAuth } from "firebase/auth";

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
const functions = getFunctions(app);
const auth = getAuth(app);

export { app, auth };
