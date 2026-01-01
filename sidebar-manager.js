
export class SidebarManager {
    static async render(containerId, activePageKey = '') {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Get user role from local storage or wait for auth
        // We prioritize window.currentUser set by the main script
        // Fallback to checking localStorage if currentUser isn't ready yet (though unlikely if called correctly)
        const user = window.currentUser || JSON.parse(localStorage.getItem('user_data') || '{}');
        const role = user.role || 'vendor'; // Default to vendor
        const isRestaurant = role === 'restaurant';

        // debug
        console.log("SidebarManager rendering for role:", role);

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
                url: isRestaurant ? 'restaurant-orders.html' : 'seller-dashboard.html#orders-section',
                roles: ['all']
            },
            {
                key: 'kitchen',
                label: isRestaurant ? 'شاشة المطبخ (KDS)' : 'شاشة التجهيز والشحن',
                icon: isRestaurant ? 'fa-fire-burner' : 'fa-box-open',
                url: isRestaurant ? 'restaurant-orders-screen.html' : 'store-orders-screen.html',
                roles: ['all'],
                target: '_blank', // Open in new tab/window for "Screen" mode
                specialClass: isRestaurant
                    ? 'text-orange-500 hover:bg-gray-800 hover:text-orange-400 border border-orange-500/10 bg-orange-500/5'
                    : 'text-indigo-500 hover:bg-gray-800 hover:text-indigo-400 border border-indigo-500/10 bg-indigo-500/5',
                iconClass: isRestaurant
                    ? 'bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-amber-900'
                    : 'bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white'
            },
            {
                key: 'sound',
                label: 'إعدادات الصوت',
                icon: 'fa-music',
                action: 'openSoundSettings()', // Special action
                roles: ['restaurant'] // Mostly relevant for KDS/Restaurant
            },
            { separator: true },
            {
                key: 'products',
                label: isRestaurant ? 'قائمة الطعام' : 'إدارة المنتجات',
                icon: isRestaurant ? 'fa-utensils' : 'fa-tags',
                url: isRestaurant ? 'restaurant-menu.html' : 'vendor-products.html',
                roles: ['all']
            },
            {
                key: 'sections',
                label: isRestaurant ? 'إضافات الطعام' : 'الأقسام والتصنيفات',
                icon: isRestaurant ? 'fa-layer-group' : 'fa-folder-tree',
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
                label: 'العروض الترويجية',
                icon: 'fa-percent',
                url: 'restaurant-offers.html',
                roles: ['all']
            },
            {
                key: 'reviews',
                label: 'التقييمات',
                icon: 'fa-comment-alt',
                url: isRestaurant ? 'restaurant-reviews.html' : 'vendor-reviews.html',
                roles: ['all']
            },
            { separator: true },
            {
                key: 'settings',
                label: 'الإعدادات',
                icon: 'fa-cog',
                url: 'restaurant-settings.html',
                roles: ['all']
            },
            {
                key: 'terms',
                label: 'الشروط والأحكام',
                icon: 'fa-file-contract',
                url: 'terms.html',
                roles: ['all']
            }
        ];

        let html = '';

        menuItems.forEach(item => {
            // Role Filter
            if (item.roles && !item.roles.includes('all')) {
                // Precise checking
                if (!item.roles.includes(role)) return;
            }

            if (item.separator) {
                html += '<div class="my-2 border-t border-gray-800/50"></div>';
                return;
            }

            // Active State Logic
            // If activePageKey is provided, match it.
            // Otherwise check URL end.
            const isActive = activePageKey === item.key || (item.url && window.location.pathname.endsWith(item.url));

            // Classes
            let baseClass = "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 nav-btn group mb-1";
            let activeClass = "bg-gray-800 text-white shadow-lg";
            let inactiveClass = "text-gray-400 hover:bg-gray-800/50 hover:text-white";

            // Specific overrides for Special Buttons (Kitchen/Store Screens)
            if (item.specialClass) {
                // Reset inactive class to special styling
                inactiveClass = item.specialClass;
                // Active needs to maintain the special color but indicate selection
                activeClass = item.specialClass.replace('bg-', 'bg-opacity-20 bg-') + " ring-2 ring-opacity-50";
            }

            const finalClass = `${baseClass} ${isActive ? activeClass : inactiveClass}`;

            // Icon Container
            let iconBaseClass = "w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm";
            let iconActiveClass = "bg-indigo-600 text-white"; // Default active brand color

            // Customize active icon color based on role for better branding
            if (isRestaurant) {
                iconActiveClass = "bg-orange-600 text-white";
            }

            let iconInactiveClass = "bg-gray-800 text-gray-400 group-hover:bg-gray-700 group-hover:text-white";

            if (item.iconClass) {
                iconInactiveClass = item.iconClass;
                iconActiveClass = item.iconClass; // Keep special styling even when active
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
                ${item.target === '_blank' ? '<i class="fas fa-external-link-alt text-xs opacity-50 mr-auto"></i>' : ''}
            </a>
            `;
        });

        container.innerHTML = html;
    }
}
