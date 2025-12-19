// S22 Market Extended Features v1.0
// AI Search, Reviews, and Chat Utilities

// ==========================================
// 10. AI-Enhanced Search Utilities
// ==========================================
const SYNONYMS = {
    // Vehicles
    'سيارة': ['voiture', 'auto', 'car', 'مركبة', 'سيارات'],
    'voiture': ['سيارة', 'auto', 'car', 'مركبة'],
    // Electronics
    'هاتف': ['phone', 'mobile', 'smartphone', 'جوال', 'تلفون', 'iphone', 'samsung', 'redmi'],
    'phone': ['هاتف', 'mobile', 'smartphone', 'جوال'],
    'ordinateur': ['pc', 'laptop', 'كمبيوتر', 'حاسوب', 'micro', 'portable'],
    'pc': ['ordinateur', 'laptop', 'كمبيوتر', 'حاسوب'],
    // Real Estate
    'منزل': ['house', 'home', 'appt', 'appartement', 'بيت', 'دار', 'شقة'],
    'house': ['منزل', 'home', 'appt', 'appartement', 'دار'],
    // Fashion  
    'ملابس': ['vetement', 'clothes', 'لبس', 'shirt', 'robe', 'pantalon', 'سروال', 'فستان'],
    'vetement': ['ملابس', 'clothes', 'لبس'],
    'chaussure': ['صباط', 'حذاء', 'shoes', 'basket', 'سبادري'],
    'shoes': ['صباط', 'حذاء', 'chaussure'],
    // General
    'تخفيض': ['promo', 'solde', 'discount', 'عرض', 'offer'],
    'promo': ['تخفيض', 'solde', 'discount', 'عرض'],
    // Food
    'بيتزا': ['pizza', 'پیزا'],
    'برغر': ['burger', 'همبرغر', 'hamburger'],
    'شاورما': ['shawarma', 'chawarma']
};

window.expandSearchTerms = function (term) {
    if (!term) return [];
    const lower = term.toLowerCase().trim();
    let terms = [lower];

    if (SYNONYMS[lower]) {
        terms.push(...SYNONYMS[lower]);
    } else {
        Object.keys(SYNONYMS).forEach(key => {
            if (key.includes(lower) || lower.includes(key)) {
                terms.push(...SYNONYMS[key]);
            }
        });
    }
    return [...new Set(terms)];
};

// Intelligent search with fuzzy matching
window.searchProducts = function (products, searchTerm, options = {}) {
    if (!searchTerm) return products;

    const terms = window.expandSearchTerms(searchTerm);
    const { minPrice, maxPrice } = options;

    return products.filter(p => {
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const cat = (p.categoryName || '').toLowerCase();

        const textMatch = terms.some(t => name.includes(t) || desc.includes(t) || cat.includes(t));

        let priceMatch = true;
        if (minPrice !== undefined) priceMatch = priceMatch && (p.price >= minPrice);
        if (maxPrice !== undefined) priceMatch = priceMatch && (p.price <= maxPrice);

        return textMatch && priceMatch;
    });
};

// Highlight search term in text
window.highlightSearchTerm = function (text, term) {
    if (!term || !text) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-0.5">$1</mark>');
};

// ==========================================
// 11. Video/Photo Reviews Utilities
// ==========================================
window.ReviewManager = {
    // Submit a review with optional media
    async submit(productId, rating, text, mediaFiles = []) {
        if (!window.currentUser) {
            window.showToast('يرجى تسجيل الدخول أولاً', 'error');
            return null;
        }

        const { collection, addDoc, serverTimestamp, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');
        const { db } = await import('./app-core.js');

        // Get product info for the review
        let productName = '', productImage = '';
        try {
            const productSnap = await getDoc(doc(db, 'products', productId));
            if (productSnap.exists()) {
                const p = productSnap.data();
                productName = p.name || '';
                productImage = (p.imageUrls && p.imageUrls[0]) || p.image || '';
            }
        } catch (e) { console.error('Product fetch for review:', e); }

        const reviewData = {
            productId,
            productName,
            productImage,
            userId: window.currentUser.uid,
            userName: window.currentUser.displayName || 'عميل',
            userPhoto: window.currentUser.photoURL || '',
            rating,
            text,
            mediaUrls: mediaFiles, // Array of URLs (upload handled separately)
            createdAt: serverTimestamp(),
            isApproved: true, // Auto-approve or require moderation
            helpful: 0
        };

        try {
            const docRef = await addDoc(collection(db, 'reviews'), reviewData);
            window.showToast('تم إرسال التقييم بنجاح!', 'success');
            return docRef.id;
        } catch (e) {
            console.error('Review submit error:', e);
            window.showToast('حدث خطأ أثناء إرسال التقييم', 'error');
            return null;
        }
    },

    // Load reviews for a product
    async loadForProduct(productId, limit = 10) {
        const { collection, query, where, orderBy, limit: fsLimit, getDocs } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');
        const { db } = await import('./app-core.js');

        try {
            const q = query(
                collection(db, 'reviews'),
                where('productId', '==', productId),
                where('isApproved', '==', true),
                orderBy('createdAt', 'desc'),
                fsLimit(limit)
            );
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.error('Load reviews error:', e);
            return [];
        }
    },

    // Calculate average rating
    calculateAverage(reviews) {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
        return (sum / reviews.length).toFixed(1);
    },

    // Render stars HTML
    renderStars(rating, size = 'sm') {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
        const sizeClass = size === 'lg' ? 'text-xl' : 'text-sm';

        let html = '';
        for (let i = 0; i < fullStars; i++) html += `<i class="fas fa-star text-yellow-400 ${sizeClass}"></i>`;
        if (hasHalf) html += `<i class="fas fa-star-half-alt text-yellow-400 ${sizeClass}"></i>`;
        for (let i = 0; i < emptyStars; i++) html += `<i class="far fa-star text-gray-300 ${sizeClass}"></i>`;
        return html;
    }
};

// ==========================================
// 12. In-App Chat Utilities
// ==========================================
window.ChatManager = {
    activeConversation: null,
    unsubscribe: null,

    // Start or get existing conversation with a seller
    async startConversation(sellerId) {
        if (!window.currentUser) {
            window.showToast('يرجى تسجيل الدخول أولاً', 'error');
            return null;
        }

        const { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');
        const { db } = await import('./app-core.js');

        const myId = window.currentUser.uid;
        const participantIds = [myId, sellerId].sort();
        const conversationKey = participantIds.join('_');

        // Check for existing conversation
        const q = query(collection(db, 'conversations'), where('participantKey', '==', conversationKey));
        const snap = await getDocs(q);

        if (!snap.empty) {
            this.activeConversation = { id: snap.docs[0].id, ...snap.docs[0].data() };
            return this.activeConversation;
        }

        // Get seller info
        let sellerName = 'البائع';
        try {
            const sellerDoc = await getDoc(doc(db, 'users', sellerId));
            if (sellerDoc.exists()) sellerName = sellerDoc.data().displayName || sellerDoc.data().storeName || 'البائع';
        } catch (e) { }

        // Create new conversation
        const convData = {
            participantIds,
            participantKey: conversationKey,
            participants: {
                [myId]: { name: window.currentUser.displayName || 'أنا', photo: window.currentUser.photoURL || '' },
                [sellerId]: { name: sellerName, photo: '' }
            },
            lastMessage: '',
            lastMessageAt: serverTimestamp(),
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'conversations'), convData);
        this.activeConversation = { id: docRef.id, ...convData };
        return this.activeConversation;
    },

    // Send a message
    async sendMessage(text, conversationId = null) {
        if (!window.currentUser) return;
        const convId = conversationId || this.activeConversation?.id;
        if (!convId) return;

        const { collection, addDoc, updateDoc, doc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');
        const { db } = await import('./app-core.js');

        const msgData = {
            senderId: window.currentUser.uid,
            senderName: window.currentUser.displayName || 'أنا',
            text,
            createdAt: serverTimestamp(),
            isRead: false
        };

        await addDoc(collection(db, 'conversations', convId, 'messages'), msgData);
        await updateDoc(doc(db, 'conversations', convId), {
            lastMessage: text.substring(0, 50),
            lastMessageAt: serverTimestamp()
        });
    },

    // Listen to messages in real-time
    async listenToMessages(conversationId, callback) {
        if (this.unsubscribe) this.unsubscribe();

        const { collection, query, orderBy, onSnapshot } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');
        const { db } = await import('./app-core.js');

        const q = query(
            collection(db, 'conversations', conversationId, 'messages'),
            orderBy('createdAt', 'asc')
        );

        this.unsubscribe = onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            if (callback) callback(messages);
        });
    },

    // Get user's conversations
    async getMyConversations() {
        if (!window.currentUser) return [];

        const { collection, query, where, orderBy, getDocs } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');
        const { db } = await import('./app-core.js');

        const q = query(
            collection(db, 'conversations'),
            where('participantIds', 'array-contains', window.currentUser.uid),
            orderBy('lastMessageAt', 'desc')
        );

        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
};

console.log('S22 Extended Features loaded ✅');
