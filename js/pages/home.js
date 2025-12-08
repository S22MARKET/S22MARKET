export function renderHome() {
    return `
        <!-- Welcome Section -->
        <div class="mb-8 animate-fade-in">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">مرحباً، المشرف 👋</h1>
            <p class="text-gray-500 dark:text-gray-400">إليك نظرة عامة على نشاطك وفريق العمل هذا الأسبوع.</p>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <!-- Weekly Progress Card (Featured) -->
            <div class="sm:col-span-2 bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-6 text-white shadow-card relative overflow-hidden group">
                <div class="relative z-10">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h2 class="text-lg font-bold mb-1">التحدي الأسبوعي</h2>
                            <p class="text-brand-100 text-sm opacity-90">ينتهي خلال 3 أيام</p>
                        </div>
                        <div class="bg-white/20 p-2 rounded-lg backdrop-blur-md group-hover:scale-110 transition-transform duration-300">
                            <i class="fas fa-trophy text-yellow-300 text-xl"></i>
                        </div>
                    </div>
                    <div class="mb-2 flex justify-between text-sm font-medium">
                        <span id="challenge-count">0 / 20 منشور</span>
                        <span id="challenge-percent">0%</span>
                    </div>
                    <div class="w-full bg-black/20 rounded-full h-3 backdrop-blur-sm overflow-hidden">
                        <div id="challenge-bar" class="bg-white h-3 rounded-full transition-all duration-1000 ease-out" style="width: 0%"></div>
                    </div>
                    <p class="mt-3 text-xs text-brand-100/80">
                        <i class="fas fa-info-circle ml-1"></i>
                        احصل على "بطل الأسبوع" عند إكمال التحدي!
                    </p>
                </div>
                <!-- Decor -->
                <div class="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
                <div class="absolute bottom-0 right-0 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 group-hover:bg-brand-500/30 transition-colors duration-500"></div>
            </div>

            <!-- Points Card -->
            <div class="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all duration-300 border border-gray-100 dark:border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <div class="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-xl">
                        <i class="fas fa-star text-lg"></i>
                    </div>
                    <span class="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">+50 اليوم</span>
                </div>
                <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">نقاطي</h3>
                <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">1,250</p>
            </div>

            <!-- Rank Card -->
            <div class="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all duration-300 border border-gray-100 dark:border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <div class="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-3 rounded-xl">
                        <i class="fas fa-crown text-lg"></i>
                    </div>
                    <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">المستوى 5</span>
                </div>
                <h3 class="text-gray-500 dark:text-gray-400 text-sm font-medium">الرتبة الحالية</h3>
                <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">مشرف نشيط</p>
            </div>
        </div>

        <!-- Quick Actions -->
        <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">إجراءات سريعة</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <button onclick="window.location.hash='submit'" class="p-4 bg-white dark:bg-dark-card rounded-2xl shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-3 group">
                <div class="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-3 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <i class="fas fa-cloud-upload-alt text-xl"></i>
                </div>
                <span class="font-medium text-gray-700 dark:text-gray-300 text-sm">إرسال إثبات</span>
            </button>
            
            <button onclick="window.location.hash='chat'" class="p-4 bg-white dark:bg-dark-card rounded-2xl shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-3 group">
                <div class="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 p-3 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                    <i class="fas fa-comments text-xl"></i>
                </div>
                <span class="font-medium text-gray-700 dark:text-gray-300 text-sm">المحادثة</span>
            </button>

            <button class="p-4 bg-white dark:bg-dark-card rounded-2xl shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-3 group">
                <div class="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-3 rounded-full group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300">
                    <i class="fas fa-heart text-xl"></i>
                </div>
                <span class="font-medium text-gray-700 dark:text-gray-300 text-sm">شكر وتقدير</span>
            </button>

            <button class="p-4 bg-white dark:bg-dark-card rounded-2xl shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-3 group">
                <div class="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 p-3 rounded-full group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                    <i class="fas fa-users text-xl"></i>
                </div>
                <span class="font-medium text-gray-700 dark:text-gray-300 text-sm">الأعضاء</span>
            </button>
        </div>
    `;
}

export function initHome() {
    // Logic to fetch stats and update the UI
    // Placeholder animation for the bar
    setTimeout(() => {
        const bar = document.getElementById('challenge-bar');
        const count = document.getElementById('challenge-count');
        const percent = document.getElementById('challenge-percent');

        if (bar && count && percent) {
            // Mock data: 13/20
            const current = 13;
            const target = 20;
            const percentage = (current / target) * 100;

            bar.style.width = `${percentage}%`;
            count.innerText = `${current} / ${target} منشور`;
            percent.innerText = `${Math.round(percentage)}%`;
        }
    }, 500);
}
