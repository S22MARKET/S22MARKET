import { auth } from './firebase-config.js';
import { initAuthObserver } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("App Loaded");

    // Sidebar Logic
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const closeSidebarBtn = document.getElementById('close-sidebar');

    if (menuBtn && sidebar && overlay && closeSidebarBtn) {
        function toggleSidebar() {
            sidebar.classList.toggle('translate-x-full');
            sidebar.classList.toggle('translate-x-0');
            overlay.classList.toggle('hidden');
        }

        menuBtn.addEventListener('click', toggleSidebar);
        closeSidebarBtn.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', toggleSidebar);
    }

    // Dark Mode Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;
    const icon = themeToggle ? themeToggle.querySelector('i') : null;

    if (themeToggle && icon) {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            html.classList.add('dark');
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }

        themeToggle.addEventListener('click', () => {
            html.classList.toggle('dark');
            if (html.classList.contains('dark')) {
                localStorage.theme = 'dark';
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                localStorage.theme = 'light';
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        });
    }

    // Auth Guard & Routing
    let isInitialized = false;

    initAuthObserver((user) => {
        const hash = window.location.hash.slice(1);

        // If not logged in and not on login page, redirect
        if (!user && hash !== 'login') {
            window.location.hash = 'login';
        }

        // If logged in and on login page, redirect to home
        if (user && hash === 'login') {
            window.location.hash = 'home';
        }

        // Update UI
        if (user) {
            // Show sidebar button
            if (menuBtn) menuBtn.classList.remove('hidden');
            updateProfileUI(user);
        } else {
            // Hide sidebar button
            if (menuBtn) menuBtn.classList.add('hidden');
            // Close sidebar if open
            if (sidebar && !sidebar.classList.contains('translate-x-full')) {
                sidebar.classList.add('translate-x-full');
                sidebar.classList.remove('translate-x-0');
                if (overlay) overlay.classList.add('hidden');
            }
        }

        isInitialized = true;
        // Handle route after auth check
        handleRoute();
    });

    // Basic Routing (Hash based)
    window.addEventListener('hashchange', handleRoute);

    function handleRoute() {
        if (!isInitialized) return; // Wait for initial auth check

        const hash = window.location.hash.slice(1) || 'home';
        console.log("Navigating to:", hash);

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href').slice(1);
            if (href === hash) {
                link.classList.add('bg-brand-50', 'text-brand-600', 'dark:bg-gray-800', 'dark:text-brand-400');
                link.classList.remove('text-gray-600', 'dark:text-gray-300');
            } else {
                link.classList.remove('bg-brand-50', 'text-brand-600', 'dark:bg-gray-800', 'dark:text-brand-400');
                link.classList.add('text-gray-600', 'dark:text-gray-300');
            }
        });

        // Load content
        loadPage(hash);

        // Close sidebar on mobile
        if (window.innerWidth < 1024 && sidebar && !sidebar.classList.contains('translate-x-full')) {
            sidebar.classList.add('translate-x-full');
            sidebar.classList.remove('translate-x-0');
            if (overlay) overlay.classList.add('hidden');
        }
    }

    async function loadPage(pageName) {
        const container = document.getElementById('page-container');

        try {
            let module;
            switch (pageName) {
                case 'home':
                    module = await import('./pages/home.js');
                    container.innerHTML = module.renderHome();
                    if (module.initHome) module.initHome();
                    break;
                case 'submit':
                    module = await import('./pages/submit.js');
                    container.innerHTML = module.renderSubmit();
                    if (module.initSubmit) module.initSubmit();
                    break;
                case 'chat':
                    module = await import('./pages/chat.js');
                    container.innerHTML = module.renderChat();
                    if (module.initChat) module.initChat();
                    break;
                case 'admin':
                    module = await import('./pages/admin.js');
                    container.innerHTML = module.renderAdmin();
                    if (module.initAdmin) module.initAdmin();
                    break;
                case 'challenge':
                    // module = await import('./pages/challenge.js');
                    container.innerHTML = `<div class="p-6 text-center text-gray-500">جاري العمل على صفحة التحدي...</div>`;
                    break;
                case 'members':
                    module = await import('./pages/members.js');
                    container.innerHTML = module.renderMembers();
                    if (module.initMembers) module.initMembers();
                    break;
                case 'profile':
                    module = await import('./pages/profile.js');
                    container.innerHTML = module.renderProfile();
                    if (module.initProfile) module.initProfile();
                    break;
                case 'login':
                    module = await import('./pages/login.js');
                    container.innerHTML = module.renderLogin();
                    if (module.initLogin) module.initLogin();
                    break;
                default:
                    container.innerHTML = `<div class="p-6 text-center text-red-500">الصفحة غير موجودة</div>`;
            }
        } catch (error) {
            console.error("Error loading page:", error);
            container.innerHTML = `<div class="text-red-500 p-4">حدث خطأ أثناء تحميل الصفحة.<br>${error.message}</div>`;
        }
    }

    function updateProfileUI(user) {
        // Find profile image in header and update it if possible
        const profileImg = document.querySelector('header img');
        if (profileImg && user.photoURL) {
            profileImg.src = user.photoURL;
        }
    }
});
