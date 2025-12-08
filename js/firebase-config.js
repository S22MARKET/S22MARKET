// Firebase Configuration
export const firebaseConfig = {
    apiKey: "AIzaSyDonGBKsvWjcXYcEYXWUeLxtFwcYTJFDMA",
    authDomain: "admi-c9f65.firebaseapp.com",
    projectId: "admi-c9f65",
    storageBucket: "admi-c9f65.firebasestorage.app",
    messagingSenderId: "708784939336",
    appId: "1:708784939336:web:cfd94d3bd2cb6fa396137d",
    measurementId: "G-Z617ZDGNVP"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
const analytics = getAnalytics(app);

console.log("Firebase Initialized with Analytics");
