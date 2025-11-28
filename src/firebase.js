import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Konfigurasi Firebase (Anda perlu ganti dengan key sebenar nanti)
const firebaseConfig = {
  apiKey: "AIzaSyDZcn4lr9nHoE5w1IMcJYDMzljhtVvGZz4",
  authDomain: "wellspace-46dd9.firebaseapp.com",
  projectId: "wellspace-46dd9",
  storageBucket: "wellspace-46dd9.firebasestorage.app",
  messagingSenderId: "607659971454",
  appId: "1:607659971454:web:3e060fd04f5bd5a904592f"
};

// Initialize Firebase
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

export const auth = firebase.auth();
export const db = firebase.firestore();

export default app;