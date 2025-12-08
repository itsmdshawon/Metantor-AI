
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// PASTE YOUR FIREBASE CONFIG KEYS HERE FROM FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyAdAy3SnxKfSC4Aa-DwJV4mrHIItTxPwOA",
  authDomain: "metantor-ai.firebaseapp.com",
  projectId: "metantor-ai",
  storageBucket: "metantor-ai.firebasestorage.app",
  messagingSenderId: "419882822510",
  appId: "1:419882822510:web:982e704fd26cfc32d86f7f",
  measurementId: "G-MNGLYQ7Q28"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
