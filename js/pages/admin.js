import { db, auth } from '../firebase-config.js';
import { collection, query, where, getDocs, updateDoc, doc, increment, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Global Admin Settings
let adminSettings = {
    weeklyTarget: 20,
    rewardPoints: 10
};

// قائمة الإيميلات المصرح لها بالوصول للوحة التحكم
const ADMIN_EMAILS = [
    'adatealm@gmail.com',
    'nourmt01@gmail.com',
    'yacinee474474@gmail.com',
    's22market@gmail.com',
    'adatshifa@gmail.com'
];

function isAdmin() {
    const user = auth.currentUser;
    if (!user || !user.email) return false;
    return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

export function renderAdmin() {
    // Check if user is admin
    if (!isAdmin()) {
        return renderAccessDenied();
    }

    return `
        <div class="animate-fade-in space-y-8">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">لوحة التحكم</h1>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <i class="fas fa-user-shield ml-1"></i> ${auth.currentUser?.email}
                    </p>
                </div>
                <a href="#home" class="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-xl transition-colors text-sm font-bold">
                    <i class="fas fa-arrow-right ml-1"></i> العودة للرئيسية
                </a>
            </div>
            
            <!-- Quick Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-gray-500 text-sm">إثباتات معلقة</h3>
                        <div class="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
                            <i class="fas fa-clock text-orange-500"></i>
                        </div>
                    </div>
                    <p class="text-3xl font-bold text-orange-500" id="pending-count">...</p>
                </div>
                <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-gray-500 text-sm">تم قبولها (هذا الأسبوع)</h3>
                        <div class="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                            <i class="fas fa-check-circle text-green-500"></i>
                        </div>
                    </div>
                    <p class="text-3xl font-bold text-green-500" id="approved-count">...</p>
                </div>
                <div class="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-gray-500 text-sm">أعضاء نشطين</h3>
                        <div class="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                            <i class="fas fa-users text-blue-500"></i>
                        </div>
                    </div>
                    <p class="text-3xl font-bold text-blue-500">5</p>
                </div>
            </div>

            <!-- Settings Section -->
            <div class="bg-gradient-to-br from-brand-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl shadow-soft border border-brand-100 dark:border-gray-600">
                <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    <i class="fas fa-sliders-h ml-2 text-brand-600"></i> إعدادات التحدي والنقاط
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <i class="fas fa-bullseye ml-1"></i> هدف التحدي الأسبوعي (عدد المنشورات)
                        </label>
                        <input type="number" id="setting-target" class="block w-full p-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 shadow-sm" value="20" min="1">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <i class="fas fa-star ml-1"></i> نقاط المكافأة لكل منشور
                        </label>
                        <input type="number" id="setting-points" class="block w-full p-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 shadow-sm" value="10" min="1">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <i class="fab fa-telegram ml-1"></i> نقاط الانضمام لمجموعة VIP
                        </label>
                        <input type="number" id="setting-telegram-points" class="block w-full p-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 shadow-sm" value="500" min="0">
                        <p class="mt-1 text-xs text-gray-500">عند الوصول لهذه النقاط، يظهر زر تيليجرام</p>
                    </div>
                </div>
                <button id="save-settings-btn" class="mt-4 px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-md hover:shadow-lg">
                    <i class="fas fa-save ml-1"></i> حفظ الإعدادات
                </button>
            </div>

            <!-- Reset Points Section -->
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-2xl shadow-soft">
                <h2 class="text-lg font-bold text-red-800 dark:text-red-300 mb-4">
                    <i class="fas fa-exclamation-triangle ml-2"></i> منطقة خطرة - تصفير النقاط
                </h2>
                <p class="text-sm text-red-700 dark:text-red-400 mb-4">
                    ⚠️ تحذير: هذا الإجراء سيقوم بتصفير نقاط جميع المشرفين ولا يمكن التراجع عنه!
                </p>
                <button id="reset-all-points-btn" class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-md">
                    <i class="fas fa-redo ml-1"></i> تصفير نقاط جميع المشرفين
                </button>
            </div>

            <!-- Pending Review Section -->
            <div>
                <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    <i class="fas fa-tasks ml-2"></i> طلبات الإثبات المعلقة
                </h2>
                <div id="submissions-list" class="space-y-4">
                    <div class="text-center text-gray-400 py-8">
                        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                        <p>جاري تحميل البيانات...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderAccessDenied() {
    return `
        <div class="min-h-[70vh] flex items-center justify-center animate-fade-in">
            <div class="bg-white dark:bg-dark-card w-full max-w-md p-8 rounded-3xl shadow-card border border-red-100 dark:border-red-900/30 relative overflow-hidden">
                <!-- Decor -->
                <div class="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
                
                <div class="text-center relative z-10">
                    <div class="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 text-3xl mb-4">
                        <i class="fas fa-ban"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">الوصول مرفوض</h2>
                    <p class="text-gray-500 dark:text-gray-400 mb-6">
                        عذراً، ليس لديك صلاحية للوصول إلى لوحة التحكم.
                    </p>
                    
                    <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl mb-6">
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            <i class="fas fa-info-circle ml-1"></i>
                            لوحة التحكم متاحة فقط للمشرفين المصرح لهم
                        </p>
                    </div>

                    <a href="#home" class="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-md">
                        <i class="fas fa-home"></i>
                        <span>العودة للرئيسية</span>
                    </a>
                </div>
            </div>
        </div>
    `;
}

export async function initAdmin() {
    // Check if user has admin access
    if (!isAdmin()) {
        console.warn("Access denied: User is not an admin");
        return;
    }

    const listContainer = document.getElementById('submissions-list');

    // Load Settings
    await loadSettings();

    // Handle Settings Save
    document.getElementById('save-settings-btn').addEventListener('click', async (e) => {
        const btn = e.target;
        const target = parseInt(document.getElementById('setting-target').value);
        const points = parseInt(document.getElementById('setting-points').value);
        const telegramPoints = parseInt(document.getElementById('setting-telegram-points').value);

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
        btn.disabled = true;

        try {
            await setDoc(doc(db, "settings", "global"), {
                weeklyTarget: target,
                rewardPoints: points,
                telegramGroupPoints: telegramPoints,
                updatedBy: auth.currentUser.email,
                updatedAt: new Date()
            });
            adminSettings = { weeklyTarget: target, rewardPoints: points, telegramGroupPoints: telegramPoints };
            btn.innerHTML = '<i class="fas fa-check ml-1"></i> تم الحفظ بنجاح';
            btn.classList.remove('bg-brand-600', 'hover:bg-brand-700');
            btn.classList.add('bg-green-600');
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-save ml-1"></i> حفظ الإعدادات';
                btn.classList.remove('bg-green-600');
                btn.classList.add('bg-brand-600', 'hover:bg-brand-700');
            }, 2000);
        } catch (error) {
            console.error(error);
            alert("فشل الحفظ: " + error.message);
            btn.innerHTML = '<i class="fas fa-save ml-1"></i> حفظ الإعدادات';
        }
        btn.disabled = false;
    });

    // Reset All Points
    document.getElementById('reset-all-points-btn').addEventListener('click', async () => {
        if (!confirm('⚠️ تحذير!\n\nهل أنت متأكد من تصفير نقاط جميع المشرفين؟\n\nهذا الإجراء لا يمكن التراجع عنه!')) {
            return;
        }

        if (!confirm('تأكيد نهائي: سيتم تصفير النقاط لجميع المشرفين الآن!')) {
            return;
        }

        const btn = document.getElementById('reset-all-points-btn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin ml-1"></i> جاري التصفير...';
        btn.disabled = true;

        try {
            const usersQuery = query(collection(db, "users"));
            const querySnapshot = await getDocs(usersQuery);

            let count = 0;
            for (const docSnap of querySnapshot.docs) {
                await updateDoc(doc(db, "users", docSnap.id), {
                    points: 0,
                    level: 1,
                    'weeklyProgress.count': 0
                });
                count++;
            }

            alert(`✅ تم تصفير نقاط ${count} مشرف بنجاح!`);
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert('❌ فشل تصفير النقاط: ' + error.message);
        }

        btn.innerHTML = '<i class="fas fa-redo ml-1"></i> تصفير نقاط جميع المشرفين';
        btn.disabled = false;
    });

    try {
        const q = query(collection(db, "proof_submissions"), where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);

        document.getElementById('pending-count').innerText = querySnapshot.size;

        if (querySnapshot.empty) {
            listContainer.innerHTML = `
                <div class="text-center text-gray-400 py-12 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-700">
                    <i class="fas fa-check-circle text-5xl mb-3 text-green-100 dark:text-green-900"></i>
                    <p class="text-lg font-medium">لا توجد طلبات معلقة حالياً</p>
                    <p class="text-sm mt-1">جميع الإثباتات تمت مراجعتها ✨</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const el = document.createElement('div');
            el.className = "bg-white dark:bg-dark-card p-4 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:shadow-md transition-shadow";
            el.innerHTML = `
                <div class="flex items-start gap-4 flex-1">
                    <a href="${data.imageUrl}" target="_blank" class="block w-24 h-24 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden relative group">
                        <img src="${data.imageUrl}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Proof">
                        <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <i class="fas fa-search-plus text-white text-xl"></i>
                        </div>
                    </a>
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <h3 class="font-bold text-gray-900 dark:text-white">${data.username || "User"}</h3>
                            <span class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md text-gray-500">
                                <i class="far fa-calendar ml-1"></i>${new Date(data.submittedAt?.toDate()).toLocaleDateString('ar-EG')}
                            </span>
                        </div>
                        <a href="${data.postLink}" target="_blank" class="text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline text-sm flex items-center gap-1 mb-2">
                            <i class="fas fa-external-link-alt text-xs"></i> رابط المنشور
                        </a>
                        <p class="text-xs text-gray-400"><i class="fas fa-fingerprint ml-1"></i>ID: ${docSnap.id.substring(0, 8)}...</p>
                    </div>
                </div>
                
                <div class="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <button class="action-btn flex-1 md:flex-none px-4 py-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all font-bold text-sm shadow-sm hover:shadow" data-action="approve" data-id="${docSnap.id}" data-uid="${data.userId}">
                        <i class="fas fa-check ml-1"></i> قبول (+${adminSettings.rewardPoints})
                    </button>
                    <button class="action-btn flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all font-bold text-sm shadow-sm hover:shadow" data-action="reject" data-id="${docSnap.id}">
                        <i class="fas fa-times ml-1"></i> رفض
                    </button>
                </div>
            `;
            listContainer.appendChild(el);
        });

        // Add Event Listeners
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                const uid = btn.dataset.uid;
                const parent = btn.closest('.bg-white');

                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                btn.disabled = true;

                try {
                    const submissionRef = doc(db, "proof_submissions", id);
                    await updateDoc(submissionRef, {
                        status: action === 'approve' ? 'approved' : 'rejected',
                        reviewedAt: new Date(),
                        reviewedBy: auth.currentUser.email
                    });

                    if (action === 'approve') {
                        const pointsToGive = adminSettings.rewardPoints || 10;
                        const userRef = doc(db, "users", uid);
                        await updateDoc(userRef, {
                            points: increment(pointsToGive),
                            "weeklyProgress.count": increment(1)
                        });
                    }

                    parent.style.opacity = '0.5';
                    parent.innerHTML = `
                        <div class="p-4 text-center w-full">
                            <i class="fas fa-${action === 'approve' ? 'check-circle text-green-500' : 'times-circle text-red-500'} text-2xl mb-2"></i>
                            <p class="text-gray-500">تم ${action === 'approve' ? 'قبول' : 'رفض'} الطلب بنجاح</p>
                        </div>
                    `;

                    setTimeout(() => parent.remove(), 2000);

                } catch (error) {
                    console.error("Action error:", error);
                    alert("حدث خطأ: " + error.message);
                    btn.innerHTML = action === 'approve' ? '<i class="fas fa-check ml-1"></i> قبول' : '<i class="fas fa-times ml-1"></i> رفض';
                    btn.disabled = false;
                }
            });
        });

    } catch (error) {
        console.error("Admin Load Error:", error);
        listContainer.innerHTML = `
            <div class="text-red-500 text-center bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl">
                <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                <p>فشل تحميل البيانات: ${error.message}</p>
            </div>
        `;
    }
}

async function loadSettings() {
    try {
        const docSnap = await getDoc(doc(db, "settings", "global"));
        if (docSnap.exists()) {
            adminSettings = docSnap.data();
            document.getElementById('setting-target').value = adminSettings.weeklyTarget || 20;
            document.getElementById('setting-points').value = adminSettings.rewardPoints || 10;
            document.getElementById('setting-telegram-points').value = adminSettings.telegramGroupPoints || 500;
        }
    } catch (e) {
        console.warn("Using default settings", e);
    }
}
