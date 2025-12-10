
import { initializeApp } from "firebase/app";
import { getAuth, sendPasswordResetEmail as firebaseSendPasswordResetEmail } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDczQMruqr9jF5WRJXnA0PomjSpp2__8_M",
  authDomain: "areyeng-f63a3.firebaseapp.com",
  projectId: "areyeng-f63a3",
  storageBucket: "areyeng-f63a3.firebasestorage.app",
  messagingSenderId: "670129299602",
  appId: "1:670129299602:web:49217c3cd86f43cd76864b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const sendPasswordResetEmail = firebaseSendPasswordResetEmail;
