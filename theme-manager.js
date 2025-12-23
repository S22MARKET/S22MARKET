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

    // Helper: Create the standard Floating Switcher
    createFloatingSwitcher() {
        if (document.getElementById('s22-theme-floater')) return;

        const container = document.createElement('div');
        container.id = 's22-theme-floater';
        container.className = 'fixed bottom-24 left-4 z-50 flex flex-col gap-2 bg-white/90 backdrop-blur shadow-lg p-2 rounded-full border border-gray-200 transition-transform duration-300 transform translate-x-[-150%]';
        // Initially hidden off-screen, needs trigger

        // Define buttons
        const modes = [
            { id: this.THEMES.LIGHT, icon: 'fa-sun', color: '#f59e0b', title: 'وضع النهار' },
            { id: this.THEMES.DARK, icon: 'fa-moon', color: '#6366f1', title: 'وضع الليل' },
            { id: this.THEMES.EYE_CARE, icon: 'fa-eye', color: '#854d0e', title: 'حماية العين' }
        ];

        container.innerHTML = modes.map(m => `
            <button onclick="ThemeManager.applyTheme('${m.id}')" 
                class="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-110 theme-option-btn" 
                style="background-color: ${m.color}" 
                title="${m.title}" data-theme-target="${m.id}">
                <i class="fas ${m.icon}"></i>
            </button>
        `).join('');

        // Trigger Button (Visible)
        const triggerBtn = document.createElement('button');
        triggerBtn.className = 'fixed bottom-24 left-4 z-50 w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-all';
        triggerBtn.innerHTML = '<i class="fas fa-palette"></i>';
        triggerBtn.onclick = () => {
            const isHidden = container.classList.contains('translate-x-[-150%]');
            if (isHidden) {
                container.classList.remove('translate-x-[-150%]');
                container.classList.add('translate-x-0');
            } else {
                container.classList.add('translate-x-[-150%]');
                container.classList.remove('translate-x-0');
            }
        };

        document.body.appendChild(container);
        document.body.appendChild(triggerBtn);

        // Highlight active
        this.updateActiveButton(localStorage.getItem('s22-theme') || 'light');
    },

    updateActiveButton(activeTheme) {
        document.querySelectorAll('.theme-option-btn').forEach(btn => {
            if (btn.dataset.themeTarget === activeTheme) {
                btn.style.border = '2px solid white';
                btn.style.outline = '2px solid var(--primary)';
            } else {
                btn.style.border = 'none';
                btn.style.outline = 'none';
            }
        });
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
