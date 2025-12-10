/**
 * Mobile Enhancements Script
 * Handles back button for overlays, pull-to-refresh, and page transitions.
 */

class MobileEnhancements {
    constructor() {
        this.overlayStack = []; // Stack to track open overlays (sidebar, modals)
        this.touchStartY = 0;
        this.refreshThreshold = 150; // Pull distance to trigger refresh
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

    // --- Back Button Logic ---

    setupBackButton() {
        // Push initial state to handle the first back press
        window.history.replaceState({ overlay: null }, document.title, window.location.href);

        window.addEventListener('popstate', (event) => {
            if (this.overlayStack.length > 0) {
                // If overlays are open, close the top one
                const topOverlay = this.overlayStack.pop();
                if (topOverlay && typeof topOverlay.close === 'function') {
                    topOverlay.close();
                    // Prevent default back navigation by pushing state again ONLY if we closed something
                    // However, popstate already happened, effectively "going back".
                    // If we want to stay on page, we need to push state again.
                    // But standard pattern:
                    // Open Overlay -> Push State
                    // Back Press -> Pop State -> Close Overlay

                    // So we don't need to push state here. The "Back" action removed the state we added when opening.
                }
            } else {
                // Normal back navigation matches browser behavior
            }
        });
    }

    /**
     * Call this when opening an overlay (Sidebar, Modal)
     * @param {Function} closeCallback - Function to actually close the UI element
     * @param {string} name - Name for debugging
     */
    pushOverlay(closeCallback, name = 'overlay') {
        this.overlayStack.push({ close: closeCallback, name });
        window.history.pushState({ overlay: name }, document.title, window.location.href);
    }

    /**
     * Call this when closing an overlay Programmatically (e.g. clicking 'X' button)
     * This ensures the history state is kept in sync (removes the state we added)
     */
    closeOverlay() {
        if (this.overlayStack.length > 0) {
            // We do NOT pop here. We let the popstate event handler do it.
            // This ensures consistent behavior whether the user presses Back or clicks 'X'.
            window.history.back();
        }
    }

    // --- Pull to Refresh Logic ---

    setupPullToRefresh() {
        // Create Spinner
        this.spinner = document.createElement('div');
        this.spinner.className = 'ptr-spinner';
        this.spinner.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>';
        document.body.prepend(this.spinner);

        window.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                this.touchStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (window.scrollY === 0 && this.touchStartY > 0) {
                const touchY = e.touches[0].clientY;
                const pullDistance = touchY - this.touchStartY;

                if (pullDistance > 0) {
                    this.isPulling = true;
                    // Visual feedback
                    this.spinner.style.transform = `translateY(${Math.min(pullDistance / 2, 80)}px) translateX(-50%) rotate(${pullDistance}deg)`;
                    this.spinner.style.opacity = Math.min(pullDistance / 100, 1);
                }
            }
        }, { passive: true });

        window.addEventListener('touchend', (e) => {
            if (this.isPulling) {
                const touchY = e.changedTouches[0].clientY;
                const pullDistance = touchY - this.touchStartY;

                if (pullDistance > this.refreshThreshold) {
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
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }

    resetSpinner() {
        this.spinner.style.transition = '0.3s';
        this.spinner.style.transform = 'translateY(-50px) translateX(-50%)';
        this.spinner.style.opacity = '0';
    }

    // --- Page Transitions ---

    setupPageTransitions() {
        document.body.classList.add('page-enter');

        // Hijack internal links for exit animation (optional, can be disabled if buggy)
        // document.addEventListener('click', (e) => {
        //     const link = e.target.closest('a');
        //     if (link && link.href && link.href.startsWith(window.location.origin) && !link.target) {
        //         e.preventDefault();
        //         document.body.classList.add('page-exit');
        //         setTimeout(() => {
        //             window.location.href = link.href;
        //         }, 300);
        //     }
        // });
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Pull to Refresh Spinner */
            .ptr-spinner {
                position: fixed;
                top: -50px;
                left: 50%;
                transform: translateX(-50%);
                width: 40px;
                height: 40px;
                background: white;
                border-radius: 50%;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                color: var(--primary, #4f46e5);
                opacity: 0;
                pointer-events: none;
            }

            /* Page Transitions */
            .page-enter {
                animation: fadeEnter 0.4s ease-out forwards;
            }
            @keyframes fadeEnter {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .page-exit {
                opacity: 0;
                transform: scale(0.98);
                transition: 0.3s;
            }

            /* Auto Hide Navbar */
            .bottom-nav {
                transition: transform 0.3s ease-in-out;
            }
            .bottom-nav.nav-hidden {
                transform: translateY(100%);
            }

            /* PWA Modal */
            .pwa-modal {
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                z-index: 9999;
                transform: translateY(150%);
                transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                max-width: 400px;
                margin: 0 auto;
                border: 1px solid rgba(0,0,0,0.05);
            }
            
            .pwa-modal.active {
                transform: translateY(0);
            }

            .pwa-content {
                padding: 20px;
            }
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
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                bottomNav.classList.add('nav-hidden');
            } else {
                bottomNav.classList.remove('nav-hidden');
            }
            lastScrollY = currentScrollY;
        }, { passive: true });
    }

    // --- PWA Install Logic 📲 ---
    setupPWAInstall() {
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;

            // Check if user already dismissed it recently (optional: use localStorage)
            if (localStorage.getItem('pwa-dismissed')) return;

            // Show Custom Modal
            this.showInstallModal(deferredPrompt);
        });
    }

    showInstallModal(deferredPrompt) {
        // Create Modal HTML
        const modal = document.createElement('div');
        modal.className = 'pwa-modal';
        modal.innerHTML = `
            <div class="pwa-content">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 text-2xl">
                        <i class="fas fa-mobile-alt"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-lg text-gray-800">تثبيت التطبيق</h3>
                        <p class="text-xs text-gray-500">تجربة أسرع وأفضل بدون إنترنت!</p>
                    </div>
                </div>
                <div class="flex gap-3">
                    <button id="pwa-dismiss" class="flex-1 py-2 text-gray-500 font-bold bg-gray-50 rounded-lg">ليس الآن</button>
                    <button id="pwa-install" class="flex-1 py-2 text-white font-bold bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">تثبيت</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Animate In
        setTimeout(() => modal.classList.add('active'), 100);

        // Handlers
        document.getElementById('pwa-dismiss').onclick = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
            localStorage.setItem('pwa-dismissed', 'true');
        };

        document.getElementById('pwa-install').onclick = async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                deferredPrompt = null;
            }
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };
    }
}

// Initialize
const mobileApp = new MobileEnhancements();

// Global Helper for existing code to call
window.openMobileOverlay = (closeCallback, name) => mobileApp.pushOverlay(closeCallback, name);
window.closeMobileOverlay = () => mobileApp.closeOverlay();
