import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, query, orderBy, serverTimestamp, where, limit, updateDoc, onSnapshot, arrayUnion, arrayRemove, setDoc, writeBatch, Timestamp, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDQwj4Sb7n40wey9UwsG_3fYPn7yg8KnrY",
    authDomain: "s22market-4e3e6.firebaseapp.com",
    projectId: "s22market-4e3e6",
    storageBucket: "s22market-4e3e6.appspot.com",
    messagingSenderId: "119186699901",
    appId: "1:119186699901:web:1b04100b5c5c40f5ca2314",
    measurementId: "G-MWYNCVP4WQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export {
    app, db, auth,
    collection, getDocs, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc,
    query, orderBy, serverTimestamp, where, limit, onSnapshot,
    writeBatch, Timestamp, arrayUnion, arrayRemove,
    onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail,
    setPersistence, browserLocalPersistence, browserSessionPersistence
};
