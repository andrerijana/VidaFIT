// dashboard/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBqRF7sgFP-1JP9QIyOJ3b4Z3tnFLDgQ5Y",
  authDomain: "app-gestion-de-pruebas.firebaseapp.com",
  projectId: "app-gestion-de-pruebas",
  storageBucket: "app-gestion-de-pruebas.firebasestorage.app",
  messagingSenderId: "580009585775",
  appId: "1:580009585775:web:e086fb73d1381cb4edb19a",
  measurementId: "G-ED9KFV6FZ5"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
