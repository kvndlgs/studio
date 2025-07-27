// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA9kn5DxbBL3KTqPrKGZKML3IsmtxuCwOw",
  authDomain: "suckerpunch.firebaseapp.com",
  projectId: "suckerpunch",
  storageBucket: "suckerpunch.firebasestorage.app",
  messagingSenderId: "469315916206",
  appId: "1:469315916206:web:cc34c554c425cbf13b383f",
  measurementId: "G-YSYZ0LDK67"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);