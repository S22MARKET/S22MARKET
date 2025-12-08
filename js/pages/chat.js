import { rtdb, auth } from '../firebase-config.js';
// rtdb is initialized instance. We need functions from SDK.
import { ref, push, onChildAdded, onChildRemoved, query, limitToLast, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Keep track of listener to avoid duplicates if returning to page
let chatRef = null;

export function renderChat() {
    return `
        <div class="flex flex-col h-[calc(100vh-180px)] sm:h-[calc(100vh-140px)] animate-fade-in">
            <!-- Chat Header -->
            <div class="bg-white dark:bg-dark-card p-4 rounded-t-2xl shadow-sm border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                        <i class="fas fa-hashtag text-xl"></i>
                    </div>
                    <div>
                        <h2 class="font-bold text-gray-900 dark:text-white">المحادثة اليومية</h2>
                        <p class="text-xs text-gray-500 dark:text-gray-400">تحذف الرسائل تلقائياً كل 24 ساعة</p>
                    </div>
                </div>
                <div class="flex -space-x-2 space-x-reverse overflow-hidden">
                    <!-- Online users placeholder -->
                    <img class="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800" src="https://ui-avatars.com/api/?name=User&background=random" alt=""/>
                    <img class="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800" src="https://ui-avatars.com/api/?name=Admin&background=random" alt=""/>
                    <span class="inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-300">+5</span>
                </div>
            </div>

            <!-- Messages Area -->
            <div id="messages-container" class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-dark-bg scroll-smooth">
                <!-- Messages will be injected here -->
                <div class="text-center text-gray-400 text-sm py-4">
                    بداية المحادثة لهذا اليوم...
                </div>
            </div>

            <!-- Input Area -->
            <form id="chat-form" class="bg-white dark:bg-dark-card p-4 rounded-b-2xl shadow-soft border-t border-gray-100 dark:border-gray-700">
                <div class="relative flex items-center gap-2">
                    <input type="text" id="message-input" autocomplete="off" class="block w-full pl-3 pr-10 py-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-colors shadow-sm" placeholder="اكتب رسالتك هنا..." required>
                    
                    <button type="button" class="absolute left-14 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <i class="far fa-smile text-lg"></i>
                    </button>
                    <button type="button" class="absolute left-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <i class="fas fa-paperclip text-lg"></i>
                    </button>

                    <button type="submit" class="bg-brand-600 hover:bg-brand-700 text-white p-3 rounded-xl shadow-md transition-colors flex items-center justify-center">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </form>
        </div>
    `;
}

export function initChat() {
    const messagesContainer = document.getElementById('messages-container');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    // Send Message
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();

        if (text && auth.currentUser) {
            const messagesRef = ref(rtdb, 'daily_chat');
            push(messagesRef, {
                userId: auth.currentUser.uid,
                username: auth.currentUser.displayName || 'User',
                text: text,
                timestamp: serverTimestamp(),
                photoURL: auth.currentUser.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser.displayName || 'User'}`
            });

            messageInput.value = '';
        } else if (!auth.currentUser) {
            alert("يرجى تسجيل الدخول للمشاركة في المحادثة");
        }
    });

    // Listen for Messages
    const messagesRef = query(ref(rtdb, 'daily_chat'), limitToLast(50));

    // Clear previous listener if any (simplistic approach, ideally we unsubscribe)
    // For this simple app, we just start listening. Duplicates might occur if we don't handle cleanup,
    // but app.js reloads module on nav, so we depend on DOM being fresh.

    // We need to check if we already have listeners to avoid double messages if we revisit the page in SPA
    // But since container is cleared on render, we just need to re-attach.
    // However, onChildAdded will fire for all existing messages.

    // Clear initial "Start of chat" text if messages exist
    let isFirstMessage = true;

    onChildAdded(messagesRef, (snapshot) => {
        if (isFirstMessage) {
            messagesContainer.innerHTML = ''; // Clear placeholder
            isFirstMessage = false;
        }

        const msg = snapshot.val();
        const isMe = auth.currentUser && msg.userId === auth.currentUser.uid;
        const div = document.createElement('div');

        if (isMe) {
            div.className = "flex justify-end items-end gap-2 animate-fade-in";
            div.innerHTML = `
                <div class="flex flex-col items-end max-w-[80%]">
                    <div class="bg-brand-600 text-white px-4 py-2 rounded-2xl rounded-tl-sm shadow-md text-sm">
                        ${escapeHtml(msg.text)}
                    </div>
                    <span class="text-[10px] text-gray-400 mt-1 mr-1">${formatTime(msg.timestamp)}</span>
                </div>
                <img src="${msg.photoURL}" class="w-8 h-8 rounded-full shadow-sm ring-2 ring-white dark:ring-gray-700">
            `;
        } else {
            div.className = "flex justify-start items-end gap-2 animate-fade-in";
            div.innerHTML = `
                <img src="${msg.photoURL}" class="w-8 h-8 rounded-full shadow-sm ring-2 ring-white dark:ring-gray-700">
                <div class="flex flex-col items-start max-w-[80%]">
                    <span class="text-[10px] text-gray-500 mb-1 ml-1">${escapeHtml(msg.username)}</span>
                    <div class="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-2xl rounded-tr-sm shadow-sm border border-gray-100 dark:border-gray-600 text-sm">
                        ${escapeHtml(msg.text)}
                    </div>
                    <span class="text-[10px] text-gray-400 mt-1 ml-1">${formatTime(msg.timestamp)}</span>
                </div>
            `;
        }

        messagesContainer.appendChild(div);
        scrollToBottom();
    });
}

function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatTime(timestamp) {
    if (!timestamp) return 'Now';
    return new Date(timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}
