import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCwyxlpIo2C7dVYyQloN948p4_obgdYwt0",
  authDomain: "ccmastersfarewell.firebaseapp.com",
  projectId: "ccmastersfarewell",
  storageBucket: "ccmastersfarewell.firebasestorage.app",
  messagingSenderId: "862997376942",
  appId: "1:862997376942:web:1c6bfce1a14331e2a1223f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export const ADMIN_EMAIL = "tanvirazadzakaria02@gmail.com";
export const ADMIN_UID = "lcYoGUwfULfdnT9z3wtOIVtajg32";
