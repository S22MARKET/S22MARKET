
export class SidebarManager {
    static async render(containerId, activePageKey = '') {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Get user role from local storage or wait for auth (simplified here using existing global currentUser or generic check)
        // Ideally this runs after auth is ready.
        // We will assume 'window.currentUser' is available or we default to a safe state until it loads.
        // Actually, preventing flash of wrong content is important. 
        // We'll rely on the calling page to call this AFTER auth.

        const user = window.currentUser || {};
        const isRestaurant = user.role === 'restaurant';

        // Menu Items Definition
        const menuItems = [
            {
                key: 'overview',
                label: 'نظرة عامة',
                icon: 'fa-chart-pie',
                url: 'seller-dashboard.html',
                roles: ['all']
            },
            {
                key: 'orders',
                label: 'الطلبات',
                icon: 'fa-clipboard-list',
                url: 'restaurant-orders.html',
                roles: ['all']
            },
            {
                key: 'kitchen',
                label: 'شاشة المطبخ',
                icon: 'fa-desktop',
                url: 'store-orders-screen.html',
                roles: ['restaurant'], // Only restaurants need this
                target: '_blank',
                specialClass: 'text-amber-500 hover:bg-gray-800 hover:text-amber-400 border border-amber-500/10 bg-amber-500/5',
                iconClass: 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-amber-900'
            },
            {
                key: 'sound',
                label: 'إعدادات الصوت',
                icon: 'fa-music',
                action: 'openSoundSettings()', // Special action
                roles: ['all']
            },
            { separator: true },
            {
                key: 'products',
                label: isRestaurant ? 'قائمة الطعام' : 'المنتجات',
                icon: isRestaurant ? 'fa-utensils' : 'fa-box-open',
                url: 'restaurant-menu.html',
                roles: ['all']
            },
            {
                key: 'sections',
                label: isRestaurant ? 'إضافات المطعم' : 'أقسام المتجر',
                icon: isRestaurant ? 'fa-layer-group' : 'fa-folder',
                url: 'restaurant-sections.html',
                roles: ['all']
            },
            { separator: true },
            {
                key: 'customers',
                label: 'زبائني',
                icon: 'fa-users',
                url: 'restaurant-customers.html',
                roles: ['all']
            },
            {
                key: 'visitors',
                label: 'سجل الزوار',
                icon: 'fa-address-book',
                url: 'restaurant-customer-log.html',
                roles: ['all']
            },
            {
                key: 'loyalty',
                label: 'الولاء والنقاط',
                icon: 'fa-star',
                url: 'restaurant-loyalty.html',
                roles: ['all']
            },
            { separator: true },
            {
                key: 'coupons',
                label: 'الكوبونات',
                icon: 'fa-ticket-alt',
                url: 'restaurant-coupons.html',
                roles: ['all']
            },
            {
                key: 'offers',
                label: 'العروض',
                icon: 'fa-percent',
                url: 'restaurant-offers.html',
                roles: ['all']
            },
            {
                key: 'drivers',
                label: 'السائقين',
                icon: 'fa-motorcycle',
                url: 'restaurant-drivers.html',
                roles: ['restaurant', 'admin'] // Maybe vendors too? Sticking to 'restaurant'/admin logic or all? Let's say all for now as some vendors deliver.
            },
            { separator: true },
            {
                key: 'reviews',
                label: 'التقييمات',
                icon: 'fa-comment-alt',
                url: 'restaurant-reviews.html',

                roles: ['all']
            },
            {
                key: 'terms',
                label: 'الشروط والأحكام',
                icon: 'fa-file-contract',
                url: 'terms.html',
                roles: ['all']
            },
            {

                key: 'settings',
                label: 'الإعدادات',
                icon: 'fa-cog',
                url: 'restaurant-settings.html',
                roles: ['all']
            }
        ];

        let html = '';

        menuItems.forEach(item => {
            // Role Filter
            if (item.roles && !item.roles.includes('all')) {
                // If user role is NOT in the allowed roles list, skip
                // BUT, currently we only have 'restaurant' logic. 
                // If item.roles = ['restaurant'] and user.role = 'vendor', skip.
                if (item.roles.includes('restaurant') && user.role !== 'restaurant') return;
            }

            if (item.separator) {
                html += '<div class="my-2 border-t border-gray-800"></div>';
                return;
            }

            const isActive = item.key === activePageKey || (item.url && window.location.pathname.endsWith(item.url));

            // Classes
            let baseClass = "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 nav-btn group";
            let activeClass = "bg-gray-800 text-white shadow-inner";
            let inactiveClass = "text-gray-400 hover:bg-gray-800 hover:text-white";

            // Specific overrides
            if (item.specialClass) {
                inactiveClass = item.specialClass; // Use special class entirely
                activeClass = item.specialClass + " ring-2 ring-amber-500"; // Hacky active state for special btn
            }

            const finalClass = `${baseClass} ${isActive ? activeClass : inactiveClass}`;

            // Icon Container
            let iconBaseClass = "w-8 h-8 rounded-lg flex items-center justify-center transition-colors";
            let iconActiveClass = "bg-indigo-600 text-white";
            let iconInactiveClass = "bg-gray-800 text-gray-400 group-hover:bg-indigo-600 group-hover:text-white";

            if (item.iconClass) {
                iconInactiveClass = item.iconClass;
                iconActiveClass = item.iconClass; // Keep same for active if special
            }

            const finalIconClass = `${iconBaseClass} ${isActive ? iconActiveClass : iconInactiveClass}`;

            // Href or Onclick
            const attribute = item.action ? `onclick="${item.action}"` : `href="${item.url}"`;
            const target = item.target ? `target="${item.target}"` : '';

            html += `
            <a ${attribute} ${target} class="${finalClass}">
                <div class="${finalIconClass}">
                    <i class="fas ${item.icon}"></i>
                </div>
                <span class="font-medium ${item.key === 'kitchen' ? 'font-bold' : ''}">${item.label}</span>
            </a>
            `;
        });

        container.innerHTML = html;
    }
}
