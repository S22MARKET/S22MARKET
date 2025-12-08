import { auth, onAuthStateChanged, signOut, db, doc, getDoc } from './firebase-config.js';

export function initAuthListener(callbacks) {
    const { onLogin, onLogout } = callbacks;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Check if user has a profile in Firestore (optional, but good for custom fields)
            try {
                // You can fetch extra user data here if needed
                // const userDoc = await getDoc(doc(db, "users", user.uid));
                // const userData = userDoc.exists() ? userDoc.data() : {};
                onLogin(user);
            } catch (error) {
                console.error("Error fetching user profile:", error);
                onLogin(user); // Still log them in even if profile fetch fails
            }
        } else {
            onLogout();
        }
    });
}

export async function logoutUser() {
    try {
        await signOut(auth);
        return true;
    } catch (error) {
        console.error("Logout Error:", error);
        return false;
    }
}
