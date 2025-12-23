/**
 * S22 Theme Manager v1.0
 * Handles switching between Day, Night, and Eye Care modes.
 * Persists choice in localStorage.
 */

const ThemeManager = {
    // Available Themes
    THEMES: {
        LIGHT: 'light',   // Default Day
        DARK: 'dark',     // Night Mode
        EYE_CARE: 'eye-care' // Sepia/Comfort
    },

    // Initialize Theme
    init() {
        const savedTheme = localStorage.getItem('s22-theme') || this.THEMES.LIGHT;
        this.applyTheme(savedTheme);
        this.injectGlobalStyles(); // For extra safeguards
    },

    // Apply Theme
    applyTheme(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('s22-theme', themeName);

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeName } }));

        // Update UI if switcher exists
        this.updateActiveButton(themeName);
    },

    // Inject styles for transitions if missing
    injectGlobalStyles() {
        if (!document.getElementById('theme-transition-style')) {
            const style = document.createElement('style');
            style.id = 'theme-transition-style';
            style.textContent = `
                * { transition: background-color 0.3s ease, border-color 0.3s ease, color 0.2s ease, box-shadow 0.3s ease; }
                .theme-btn-active { border: 2px solid var(--primary); transform: scale(1.1); }
            `;
            document.head.appendChild(style);
        }
    },

    // Helper: Create the standard Floating Switcher (Deprecated preferred in Sidebar)
    createFloatingSwitcher() {
        // Disabling for now based on user feedback to prioritize sidebar
        // If specific legacy pages need it, we can re-enable or check a flag.
        if (sessionStorage.getItem('use-floating-theme')) {
            // ... existing code ...
        }
    },

    // New: Render Controls into a Sidebar Container
    renderSidebarControl(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const modes = [
            { id: this.THEMES.LIGHT, icon: 'fa-sun', label: 'النهار', bg: 'bg-amber-100', text: 'text-amber-600' },
            { id: this.THEMES.DARK, icon: 'fa-moon', label: 'الليل', bg: 'bg-indigo-100', text: 'text-indigo-600' },
            { id: this.THEMES.EYE_CARE, icon: 'fa-eye', label: 'حماية', bg: 'bg-stone-100', text: 'text-stone-600' }
        ];

        container.innerHTML = `
            <div class="px-4 py-2 mt-4 border-t border-gray-700/50">
                <p class="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">المظهر</p>
                <div class="flex gap-2 justify-between bg-black/20 p-1 rounded-lg">
                    ${modes.map(m => `
                        <button onclick="ThemeManager.applyTheme('${m.id}')" 
                                class="flex-1 py-1.5 rounded-md text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1 theme-btn-${m.id} text-gray-400 hover:bg-white/10"
                                title="${m.label}">
                            <i class="fas ${m.icon}"></i>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        this.updateSidebarActiveState();
    },

    updateSidebarActiveState() {
        const current = localStorage.getItem('s22-theme') || this.THEMES.LIGHT;
        document.querySelectorAll(`[class*="theme-btn-"]`).forEach(btn => {
            // Reset
            btn.className = btn.className.replace('bg-white text-gray-900 shadow-sm', 'text-gray-400 hover:bg-white/10');

            if (btn.classList.contains(`theme-btn-${current}`)) {
                btn.classList.remove('text-gray-400', 'hover:bg-white/10');
                btn.classList.add('bg-white', 'text-gray-900', 'shadow-sm');
            }
        });
    },

    // Override updateActiveButton to also update sidebar
    updateActiveButton(activeTheme) {
        // Legacy Floating
        document.querySelectorAll('.theme-option-btn').forEach(btn => {
            if (btn.dataset.themeTarget === activeTheme) {
                btn.style.border = '2px solid white';
                btn.style.outline = '2px solid var(--primary)';
            } else {
                btn.style.border = 'none';
                btn.style.outline = 'none';
            }
        });

        // New Sidebar UI
        this.updateSidebarActiveState();
    }
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
