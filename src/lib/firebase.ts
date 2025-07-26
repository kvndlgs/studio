import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  "projectId": "suckerpunch",
  "appId": "1:469315916206:web:cc34c554c425cbf13b383f",
  "storageBucket": "suckerpunch.firebasestorage.app",
  "apiKey": "AIzaSyA9kn5DxbBL3KTqPrKGZKML3IsmtxuCwOw",
  "authDomain": "suckerpunch.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "469315916206"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
