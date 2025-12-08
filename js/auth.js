import { auth, db } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Login function
export async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}

// Signup function with enhanced user profile
export async function signup(email, password, displayName) {
    try {
        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Generate unique username from email
        const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const randomSuffix = Math.floor(Math.random() * 1000);
        const username = `${baseUsername}_${randomSuffix}`;

        // Update display name
        await updateProfile(user, {
            displayName: displayName
        });

        // Create comprehensive user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
            // Basic Info
            uid: user.uid,
            displayName: displayName,
            username: username, // Unique username
            email: email,
            phoneNumber: null, // Optional phone number
            photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0ea5e9&color=fff`,

            // Account Status
            role: 'trainee', // Default role for new users
            rank: 'متدرب', // Arabic rank name
            level: 1,
            points: 0, // Start with 0 points

            // Weekly Progress
            weeklyProgress: {
                count: 0, // Posts this week
                target: 20, // Weekly target
                lastReset: serverTimestamp(),
                weekStartDate: serverTimestamp()
            },

            // Statistics
            stats: {
                totalSubmissions: 0,
                approvedSubmissions: 0,
                rejectedSubmissions: 0,
                totalPointsEarned: 0,
                currentStreak: 0,
                longestStreak: 0
            },

            // Achievements & Badges
            badges: [],
            achievements: [],

            // Account Metadata
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            accountStatus: 'active', // active, suspended, banned

            // Preferences
            preferences: {
                notifications: true,
                darkMode: false,
                language: 'ar'
            }
        });

        console.log("User account created successfully with default values");
        return user;
    } catch (error) {
        console.error("Signup error:", error);
        throw error;
    }
}

// Password Reset function
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email, {
            url: window.location.origin + '/index.html',
            handleCodeInApp: false
        });
        return true;
    } catch (error) {
        console.error("Password reset error:", error);
        throw error;
    }
}

// Logout function
export async function logout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout error:", error);
        throw error;
    }
}

// Auth state observer
export function initAuthObserver(callback) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Update last login
            setDoc(doc(db, "users", user.uid), {
                lastLogin: serverTimestamp()
            }, { merge: true }).catch(err => console.error("Error updating last login:", err));
        }
        callback(user);
    });
}

// Get user rank based on points
export function getUserRank(points) {
    if (points >= 5000) return { name: 'قائد', icon: 'fas fa-crown', color: '#9333ea' };
    if (points >= 3000) return { name: 'نائب القائد', icon: 'fas fa-star', color: '#eab308' };
    if (points >= 1500) return { name: 'مشرف أول', icon: 'fas fa-shield-alt', color: '#3b82f6' };
    if (points >= 500) return { name: 'مشرف نشيط', icon: 'fas fa-user-shield', color: '#10b981' };
    return { name: 'متدرب', icon: 'fas fa-user', color: '#6b7280' };
}

// Calculate user level
export function getUserLevel(points) {
    return Math.floor(points / 100) + 1;
}
