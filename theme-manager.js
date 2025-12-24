/**
 * S22 Theme Manager v1.0
 * Handles switching between Day, Night, and Eye Care modes.
 * Persists choice in localStorage.
 */

const ThemeManager = {
    // Available Themes
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark'
    },

    // Initialize
    init() {
        const savedTheme = localStorage.getItem('s22-theme') || this.THEMES.LIGHT;
        const eyeCareEnabled = localStorage.getItem('s22-eye-care') === 'true';

        this.applyTheme(savedTheme);
        this.toggleEyeCare(eyeCareEnabled);

        this.injectGlobalStyles();
    },

    // Apply Main Theme (Light/Dark)
    applyTheme(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('s22-theme', themeName);

        // Dispatch
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeName } }));

        // Update UI
        this.updateUI();
    },

    // Toggle Eye Care Overlay
    toggleEyeCare(forceState = null) {
        let isActive = document.documentElement.classList.contains('eye-care-active');

        if (forceState !== null) {
            isActive = !forceState; // Logic flip below will fix it
        }

        if (!isActive) {
            document.documentElement.classList.add('eye-care-active');
            localStorage.setItem('s22-eye-care', 'true');
        } else {
            document.documentElement.classList.remove('eye-care-active');
            localStorage.setItem('s22-eye-care', 'false');
        }

        this.updateUI();
    },

    // Inject styles (kept for safety)
    injectGlobalStyles() {
        if (!document.getElementById('theme-transition-style')) {
            const style = document.createElement('style');
            style.id = 'theme-transition-style';
            style.textContent = `
                * { transition: background-color 0.3s ease, border-color 0.3s ease, color 0.2s ease, box-shadow 0.3s ease; }
            `;
            document.head.appendChild(style);
        }
    },

    // Render Controls (Sidebar)
    renderSidebarControl(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="px-4 py-2 mt-4 border-t border-gray-700/50">
                <p class="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">المظهر</p>
                
                <div class="flex gap-2">
                    <!-- Day/Night Toggle -->
                    <div class="flex-1 bg-black/20 p-1 rounded-lg flex gap-1">
                        <button onclick="ThemeManager.applyTheme('light')" 
                                id="theme-btn-light"
                                class="flex-1 py-1.5 rounded-md text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1 text-gray-400 hover:bg-white/10"
                                title="النهار">
                            <i class="fas fa-sun"></i>
                        </button>
                        <button onclick="ThemeManager.applyTheme('dark')" 
                                id="theme-btn-dark"
                                class="flex-1 py-1.5 rounded-md text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1 text-gray-400 hover:bg-white/10"
                                title="الليل">
                            <i class="fas fa-moon"></i>
                        </button>
                    </div>

                    <!-- Eye Care Toggle (Independent) -->
                    <button onclick="ThemeManager.toggleEyeCare()" 
                            id="theme-btn-eye-care"
                            class="w-10 bg-black/20 rounded-lg flex items-center justify-center text-gray-400 hover:bg-stone-800 transition-all border border-transparent"
                            title="حماية العين (فلتر)">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `;

        this.updateUI();
    },

    updateUI() {
        const currentTheme = localStorage.getItem('s22-theme') || this.THEMES.LIGHT;
        const isEyeCare = localStorage.getItem('s22-eye-care') === 'true';

        // 1. Update Day/Night Buttons
        const lightBtn = document.getElementById('theme-btn-light');
        const darkBtn = document.getElementById('theme-btn-dark');

        if (lightBtn && darkBtn) {
            // Reset
            const inactiveClass = "flex-1 py-1.5 rounded-md text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1 text-gray-400 hover:bg-white/10";
            const activeClass = "flex-1 py-1.5 rounded-md text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1 bg-white text-gray-900 shadow-sm";

            lightBtn.className = currentTheme === 'light' ? activeClass : inactiveClass;
            darkBtn.className = currentTheme === 'dark' ? activeClass : inactiveClass;
        }

        // 2. Update Eye Care Button
        const eyeBtn = document.getElementById('theme-btn-eye-care');
        if (eyeBtn) {
            if (isEyeCare) {
                eyeBtn.className = "w-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 shadow-sm transition-all border border-amber-200";
            } else {
                eyeBtn.className = "w-10 bg-black/20 rounded-lg flex items-center justify-center text-gray-400 hover:bg-stone-800 transition-all border border-transparent";
            }
        }
    },

    // Legacy Stub (Deprecated)
    updateActiveButton() { }
};

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    // Auto-inject switcher on specific pages or globally?
    // Let's protect it and only add if requested or on main pages.
    if (document.querySelector('body')) {
        // ThemeManager.createFloatingSwitcher(); // Uncomment to auto-add everywhere
    }
});

// Expose to window
window.ThemeManager = ThemeManager;
