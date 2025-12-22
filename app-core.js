// S22 Market Core System v1.0
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// 1. إعدادات فايربيز (ضع إعداداتك هنا مرة واحدة فقط)
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
export const auth = getAuth(app);
export const db = getFirestore(app);

// 2. حل مشكلة تسجيل الدخول المتكرر (Auth Persistence)
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log("تم تفعيل الحفظ التلقائي للجلسة ✅");
    })
    .catch((error) => console.error("خطأ في حفظ الجلسة:", error));

// 3. مراقب حالة المستخدم العالمي
window.currentUser = null;

onAuthStateChanged(auth, (user) => {
    window.currentUser = user;
    if (user) {
        console.log("مرحباً بك مجدداً:", user.displayName);
        document.body.classList.add('user-logged-in');
    } else {
        document.body.classList.remove('user-logged-in');
        // Only redirect if explicitly on a protected page
        if (window.location.pathname.includes('admin') ||
            window.location.pathname.includes('dashboard') ||
            window.location.pathname.includes('profile')) {
            // Profile usually requires auth, but let's be careful about auto-redirects loops
            // window.location.href = 'login.html'; // Let the specific page handle the redirect if needed to avoid loops
        }
    }

    // Dispatch Global Event for UI Updates
    const event = new CustomEvent('user-auth-state-changed', { detail: { user } });
    window.dispatchEvent(event);
});

// 4. دوال مساعدة عالمية (لتجنب تكرار الكود)
window.showToast = (msg, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-white font-bold z-[100] animate-bounce ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} shadow-lg`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

window.requireAuth = (authInstance) => {
    return new Promise((resolve) => {
        const unsubscribe = authInstance.onAuthStateChanged((user) => {
            unsubscribe();
            if (user) {
                resolve(user);
            } else {
                window.showToast("يجب تسجيل الدخول للمتابعة", "error");
                localStorage.setItem('s22_return_url', window.location.href);
                setTimeout(() => window.location.href = 'login.html', 1500);
                resolve(null);
            }
        });
    });
};

// 5. Mobile Enhancements (PWA, Pull-to-Refresh, Transitions)
export class MobileEnhancements {
    constructor() {
        this.overlayStack = [];
        this.touchStartY = 0;
        this.refreshThreshold = 150;
        this.isPulling = false;
        this.spinner = null;
        this.init();
    }

    init() {
        this.setupBackButton();
        this.setupPullToRefresh();
        this.setupPageTransitions();
        this.setupAutoHidingNavbar();
        this.setupPWAInstall();
        this.injectStyles();
    }

    setupBackButton() {
        window.history.replaceState({ overlay: null }, document.title, window.location.href);
        window.addEventListener('popstate', (event) => {
            if (this.overlayStack.length > 0) {
                const topOverlay = this.overlayStack.pop();
                if (topOverlay && typeof topOverlay.close === 'function') {
                    topOverlay.close();
                }
            }
        });
    }

    pushOverlay(closeCallback, name = 'overlay') {
        this.overlayStack.push({ close: closeCallback, name });
        window.history.pushState({ overlay: name }, document.title, window.location.href);
    }

    closeOverlay() {
        if (this.overlayStack.length > 0) {
            window.history.back();
        }
    }

    setupPullToRefresh() {
        this.spinner = document.createElement('div');
        this.spinner.className = 'ptr-spinner';
        this.spinner.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>';
        document.body.prepend(this.spinner);

        window.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) this.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (window.scrollY === 0 && this.touchStartY > 0) {
                const touchY = e.touches[0].clientY;
                const pullDistance = touchY - this.touchStartY;
                if (pullDistance > 0) {
                    this.isPulling = true;
                    this.spinner.style.transform = `translateY(${Math.min(pullDistance / 2, 80)}px) translateX(-50%) rotate(${pullDistance}deg)`;
                    this.spinner.style.opacity = Math.min(pullDistance / 100, 1);
                }
            }
        }, { passive: true });

        window.addEventListener('touchend', (e) => {
            if (this.isPulling) {
                const touchY = e.changedTouches[0].clientY;
                if (touchY - this.touchStartY > this.refreshThreshold) {
                    this.triggerRefresh();
                } else {
                    this.resetSpinner();
                }
                this.isPulling = false;
                this.touchStartY = 0;
            }
        });
    }

    triggerRefresh() {
        this.spinner.style.transition = '0.3s';
        this.spinner.style.transform = 'translateY(60px) translateX(-50%) rotate(360deg)';
        setTimeout(() => window.location.reload(), 500);
    }

    resetSpinner() {
        this.spinner.style.transition = '0.3s';
        this.spinner.style.transform = 'translateY(-50px) translateX(-50%)';
        this.spinner.style.opacity = '0';
    }

    setupPageTransitions() {
        document.body.classList.add('page-enter');
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .ptr-spinner { position: fixed; top: -50px; left: 50%; transform: translateX(-50%); width: 40px; height: 40px; background: white; border-radius: 50%; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; z-index: 1000; color: var(--primary, #4f46e5); opacity: 0; pointer-events: none; }
            .page-enter { animation: fadeEnter 0.4s ease-out forwards; }
            @keyframes fadeEnter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .bottom-nav { transition: transform 0.3s ease-in-out; }
            .bottom-nav.nav-hidden { transform: translateY(100%); }
            .pwa-modal { position: fixed; bottom: 20px; left: 20px; right: 20px; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); z-index: 9999; transform: translateY(150%); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); max-width: 400px; margin: 0 auto; border: 1px solid rgba(0,0,0,0.05); }
            .pwa-modal.active { transform: translateY(0); }
            .pwa-content { padding: 20px; }
        `;
        document.head.appendChild(style);
    }

    setupAutoHidingNavbar() {
        let lastScrollY = window.scrollY;
        const bottomNav = document.querySelector('.bottom-nav');
        if (!bottomNav) return;
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            if (Math.abs(currentScrollY - lastScrollY) < 10) return;
            if (currentScrollY > lastScrollY && currentScrollY > 100) bottomNav.classList.add('nav-hidden');
            else bottomNav.classList.remove('nav-hidden');
            lastScrollY = currentScrollY;
        }, { passive: true });
    }

    setupPWAInstall() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            if (localStorage.getItem('pwa-dismissed')) return;
            this.showInstallModal(e);
        });
    }

    showInstallModal(deferredPrompt) {
        // Modal logic
    }
}

// Auto-init global usage
const mobileApp = new MobileEnhancements();
window.openMobileOverlay = (cb, name) => mobileApp.pushOverlay(cb, name);
window.closeMobileOverlay = () => mobileApp.closeOverlay();
window.MobileEnhancements = MobileEnhancements;



// 6. Persistent Cart Utilities
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// Save cart to Firebase for logged-in users
window.syncCartToFirebase = async function () {
    if (!window.currentUser) return;
    const cart = JSON.parse(localStorage.getItem('s22market_cart') || '[]');
    try {
        await setDoc(doc(db, 'userCarts', window.currentUser.uid), { items: cart, updatedAt: new Date() }, { merge: true });
    } catch (e) { console.error('Cart sync error:', e); }
};

// Load cart from Firebase for logged-in users
window.loadCartFromFirebase = async function () {
    if (!window.currentUser) return;
    try {
        const snap = await getDoc(doc(db, 'userCarts', window.currentUser.uid));
        if (snap.exists()) {
            const firebaseCart = snap.data().items || [];
            const localCart = JSON.parse(localStorage.getItem('s22market_cart') || '[]');
            // Merge: prefer Firebase but add local-only items
            const merged = [...firebaseCart];
            localCart.forEach(item => {
                if (!merged.find(m => m.id === item.id)) merged.push(item);
            });
            localStorage.setItem('s22market_cart', JSON.stringify(merged));
        }
    } catch (e) { console.error('Cart load error:', e); }
};

// 7. Checkout Auto-fill Utilities
window.getUserCheckoutData = async function () {
    if (!window.currentUser) return null;
    try {
        const snap = await getDoc(doc(db, 'users', window.currentUser.uid));
        if (snap.exists()) {
            return snap.data();
        }
    } catch (e) { console.error('User data fetch error:', e); }
    return null;
};

window.autoFillCheckout = async function (formPrefix = '') {
    const data = await window.getUserCheckoutData();
    if (!data) return;
    const fields = ['name', 'phone', 'address', 'city'];
    fields.forEach(f => {
        // Try getting element by ID matching the field name or a common prefix
        const el = document.getElementById(`q-customer-${f}`) || document.getElementById(f);
        if (el && data[f]) el.value = data[f];
    });
};

// Haptic Feedback Utility
window.haptic = function (duration = 50) {
    if ('vibrate' in navigator) navigator.vibrate(duration);
};



// 8. Web Push Notifications (Firebase Cloud Messaging)
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging.js';

let messaging = null;
try {
    messaging = getMessaging(app);
} catch (e) { console.log('FCM not supported in this environment'); }

// Request permission and get FCM token
window.requestNotificationPermission = async function () {
    if (!messaging) return null;
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }
        const token = await getToken(messaging, {
            vapidKey: 'YOUR_VAPID_KEY_HERE' // Replace with actual VAPID key from Firebase Console
        });
        console.log('FCM Token:', token);

        // Save token to user's document if logged in
        if (window.currentUser) {
            await setDoc(doc(db, 'users', window.currentUser.uid), { fcmToken: token }, { merge: true });
        }
        return token;
    } catch (e) {
        console.error('Error getting FCM token:', e);
        return null;
    }
};

// Handle foreground messages
if (messaging) {
    onMessage(messaging, (payload) => {
        console.log('Message received:', payload);
        // Show in-app notification
        const notification = payload.notification;
        if (notification) {
            window.showToast(notification.body || notification.title, 'success');
        }
    });
}

// Show browser notification
window.showBrowserNotification = function (title, body, icon = '/LOGO.jpg') {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon });
    }
};

// 9. In-App Notification System (Firestore-based)
import { collection, onSnapshot, query as fsQuery, orderBy as fsOrderBy, where as fsWhere, limit as fsLimit } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

window.listenToUserNotifications = function (callback) {
    if (!window.currentUser) return null;
    const q = fsQuery(
        collection(db, 'users', window.currentUser.uid, 'notifications'),
        fsWhere('isRead', '==', false),
        fsOrderBy('timestamp', 'desc'),
        fsLimit(10)
    );
    return onSnapshot(q, (snapshot) => {
        const notifications = [];
        snapshot.forEach(doc => notifications.push({ id: doc.id, ...doc.data() }));
        if (callback) callback(notifications);
    });
};

window.markNotificationRead = async function (notificationId) {
    if (!window.currentUser) return;
    const { updateDoc } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');
    await updateDoc(doc(db, 'users', window.currentUser.uid, 'notifications', notificationId), { isRead: true });
};

