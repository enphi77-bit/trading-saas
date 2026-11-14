import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCH0bmgMA5vWjpIjSWgU6shb41i_RRJKVg",
  authDomain: "trading-saas-7974f.firebaseapp.com",
  projectId: "trading-saas-7974f",
  storageBucket: "trading-saas-7974f.firebasestorage.app",
  messagingSenderId: "10056526865",
  appId: "1:10056526865:web:ca47f5d153f3a64377d5b0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);