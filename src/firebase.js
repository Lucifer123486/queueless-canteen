// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCKn7De1G5UZu7CT3w8KYlils-gRBilrAw",
  authDomain: "queless-canteen-db.firebaseapp.com",
  projectId: "queless-canteen-db",
  storageBucket: "queless-canteen-db.firebasestorage.app",
  messagingSenderId: "345902757795",
  appId: "1:345902757795:web:3f36a310f5e4f7bf9b8c16",
  measurementId: "G-WB0HGWMNKH"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
