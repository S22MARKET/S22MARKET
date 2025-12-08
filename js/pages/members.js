import { db, auth } from '../firebase-config.js';
import { collection, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function renderMembers() {
    return `
        <div class="animate-fade-in space-y-6">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">الأعضاء</h1>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">قائمة جميع المشرفين في الفريق</p>
                </div>
                <div class="flex gap-2">
                    <button id="filter-all" class="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold transition-colors">
                        الكل
                    </button>
                    <button id="filter-new" class="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-colors">
                        المنضمون حديثاً
                    </button>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                    <div class="flex items-center gap-3">
                        <div class="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                            <i class="fas fa-users text-blue-600 dark:text-blue-400"></i>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 dark:text-gray-400">إجمالي الأعضاء</p>
                            <p class="text-xl font-bold text-gray-900 dark:text-white" id="total-members">...</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                    <div class="flex items-center gap-3">
                        <div class="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
                            <i class="fas fa-user-plus text-green-600 dark:text-green-400"></i>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 dark:text-gray-400">منضمون حديثاً</p>
                            <p class="text-xl font-bold text-gray-900 dark:text-white" id="new-members">...</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                    <div class="flex items-center gap-3">
                        <div class="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-xl">
                            <i class="fas fa-fire text-yellow-600 dark:text-yellow-400"></i>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 dark:text-gray-400">نشطون</p>
                            <p class="text-xl font-bold text-gray-900 dark:text-white" id="active-members">...</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                    <div class="flex items-center gap-3">
                        <div class="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
                            <i class="fas fa-crown text-purple-600 dark:text-purple-400"></i>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 dark:text-gray-400">قادة</p>
                            <p class="text-xl font-bold text-gray-900 dark:text-white" id="leaders">...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Members List -->
            <div id="members-list" class="space-y-3">
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                    <p>جاري تحميل الأعضاء...</p>
                </div>
            </div>
        </div>
    `;
}

export async function initMembers() {
    const membersList = document.getElementById('members-list');
    let allMembers = [];
    let currentFilter = 'all';

    // Filter buttons
    const filterAll = document.getElementById('filter-all');
    const filterNew = document.getElementById('filter-new');

    filterAll.addEventListener('click', () => {
        currentFilter = 'all';
        filterAll.classList.add('bg-brand-600', 'text-white');
        filterAll.classList.remove('bg-gray-100', 'text-gray-700', 'dark:bg-gray-700', 'dark:text-gray-300');
        filterNew.classList.remove('bg-brand-600', 'text-white');
        filterNew.classList.add('bg-gray-100', 'text-gray-700', 'dark:bg-gray-700', 'dark:text-gray-300');
        renderMembersList(allMembers, currentFilter);
    });

    filterNew.addEventListener('click', () => {
        currentFilter = 'new';
        filterNew.classList.add('bg-brand-600', 'text-white');
        filterNew.classList.remove('bg-gray-100', 'text-gray-700', 'dark:bg-gray-700', 'dark:text-gray-300');
        filterAll.classList.remove('bg-brand-600', 'text-white');
        filterAll.classList.add('bg-gray-100', 'text-gray-700', 'dark:bg-gray-700', 'dark:text-gray-300');
        renderMembersList(allMembers, currentFilter);
    });

    try {
        // Fetch all users
        const usersQuery = query(collection(db, "users"), orderBy("points", "desc"));
        const querySnapshot = await getDocs(usersQuery);

        allMembers = [];
        querySnapshot.forEach((doc) => {
            allMembers.push({ id: doc.id, ...doc.data() });
        });

        // Update stats
        document.getElementById('total-members').innerText = allMembers.length;
        const newMembers = allMembers.filter(m => m.points === 0);
        document.getElementById('new-members').innerText = newMembers.length;
        const activeMembers = allMembers.filter(m => m.points > 0);
        document.getElementById('active-members').innerText = activeMembers.length;
        const leaders = allMembers.filter(m => m.role === 'leader' || m.role === 'co-leader');
        document.getElementById('leaders').innerText = leaders.length;

        renderMembersList(allMembers, currentFilter);

    } catch (error) {
        console.error("Error loading members:", error);
        membersList.innerHTML = `
            <div class="text-red-500 text-center bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl">
                <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                <p>فشل تحميل الأعضاء: ${error.message}</p>
            </div>
        `;
    }

    function renderMembersList(members, filter) {
        let filteredMembers = members;

        if (filter === 'new') {
            filteredMembers = members.filter(m => m.points === 0);
        }

        if (filteredMembers.length === 0) {
            membersList.innerHTML = `
                <div class="text-center text-gray-400 py-12 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-700">
                    <i class="fas fa-user-friends text-5xl mb-3 text-gray-200 dark:text-gray-700"></i>
                    <p class="text-lg font-medium">لا يوجد أعضاء ${filter === 'new' ? 'جدد' : ''}</p>
                </div>
            `;
            return;
        }

        membersList.innerHTML = filteredMembers.map((member, index) => {
            const isNew = member.points === 0;
            const rankIcon = getRankIcon(member.role || 'trainee');
            const rankColor = getRankColor(member.role || 'trainee');
            const rankName = getRankName(member.role || 'trainee');
            const level = Math.floor(member.points / 100) || 1;
            const weeklyProgress = member.weeklyProgress?.count || 0;

            return `
                <div class="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all ${isNew ? 'border-r-4 border-r-green-500' : ''}">
                    <div class="flex items-center gap-4">
                        <!-- Rank Badge -->
                        <div class="flex-shrink-0">
                            <div class="relative">
                                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(member.username || 'User')}&background=${rankColor.replace('#', '')}&color=fff&size=64" 
                                     class="w-16 h-16 rounded-full ring-4 ring-${rankColor}/20" alt="${member.username}">
                                ${isNew ? '<span class="absolute -top-1 -right-1 flex h-5 w-5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span class="relative inline-flex rounded-full h-5 w-5 bg-green-500 items-center justify-center text-white text-xs font-bold">N</span></span>' : ''}
                            </div>
                        </div>

                        <!-- Member Info -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                <h3 class="font-bold text-gray-900 dark:text-white truncate">${member.username || 'مستخدم'}</h3>
                                ${isNew ? '<span class="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold rounded-full">جديد</span>' : ''}
                            </div>
                            <div class="flex items-center gap-3 text-sm">
                                <span class="flex items-center gap-1 text-${rankColor}">
                                    <i class="${rankIcon}"></i>
                                    <span class="font-medium">${rankName}</span>
                                </span>
                                <span class="text-gray-400">•</span>
                                <span class="text-gray-500 dark:text-gray-400">المستوى ${level}</span>
                            </div>
                        </div>

                        <!-- Stats -->
                        <div class="hidden md:flex items-center gap-6">
                            <div class="text-center">
                                <p class="text-xs text-gray-500 dark:text-gray-400">النقاط</p>
                                <p class="text-lg font-bold ${isNew ? 'text-gray-400' : 'text-yellow-600'}">${member.points || 0}</p>
                            </div>
                            <div class="text-center">
                                <p class="text-xs text-gray-500 dark:text-gray-400">هذا الأسبوع</p>
                                <p class="text-lg font-bold text-brand-600">${weeklyProgress}/20</p>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex-shrink-0">
                            <button class="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Mobile Stats -->
                    <div class="md:hidden flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div class="flex-1 text-center">
                            <p class="text-xs text-gray-500 dark:text-gray-400">النقاط</p>
                            <p class="text-base font-bold ${isNew ? 'text-gray-400' : 'text-yellow-600'}">${member.points || 0}</p>
                        </div>
                        <div class="flex-1 text-center">
                            <p class="text-xs text-gray-500 dark:text-gray-400">هذا الأسبوع</p>
                            <p class="text-base font-bold text-brand-600">${weeklyProgress}/20</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function getRankIcon(role) {
        const icons = {
            'leader': 'fas fa-crown',
            'co-leader': 'fas fa-star',
            'senior': 'fas fa-shield-alt',
            'moderator': 'fas fa-user-shield',
            'trainee': 'fas fa-user'
        };
        return icons[role] || icons['trainee'];
    }

    function getRankColor(role) {
        const colors = {
            'leader': '#9333ea',
            'co-leader': '#eab308',
            'senior': '#3b82f6',
            'moderator': '#10b981',
            'trainee': '#6b7280'
        };
        return colors[role] || colors['trainee'];
    }

    function getRankName(role) {
        const names = {
            'leader': 'قائد',
            'co-leader': 'نائب القائد',
            'senior': 'مشرف أول',
            'moderator': 'مشرف',
            'trainee': 'متدرب'
        };
        return names[role] || names['trainee'];
    }
}
