import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAXDZVpNYZWKPIpjYNrdlu_mh7R3k42sMk",
  authDomain: "notification-c0a2c.firebaseapp.com",
  databaseURL: "https://notification-c0a2c-default-rtdb.firebaseio.com",
  projectId: "notification-c0a2c",
  storageBucket: "notification-c0a2c.firebasestorage.app",
  messagingSenderId: "8802883750",
  appId: "1:8802883750:web:7b1c9f8c3b64227353fc67",
  measurementId: "G-JR4K03441R",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only if in browser environment
let analytics;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Analytics initialization failed:", error);
  }
}

export const db = getFirestore(app);
export const auth = getAuth(app);
