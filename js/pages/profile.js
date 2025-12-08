import { auth, db } from '../firebase-config.js';
import { updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, updateDoc, query, collection, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { logout } from '../auth.js';

export function renderProfile() {
    return `
        <div class="animate-fade-in space-y-6">
            <!-- Header -->
            <div class="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
                <div class="relative z-10">
                    <h1 class="text-2xl font-bold mb-1">الملف الشخصي</h1>
                    <p class="text-brand-100 text-sm">إدارة معلوماتك الشخصية</p>
                </div>
            </div>

            <!-- Profile Card -->
            <div class="bg-white dark:bg-dark-card rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
                <!-- Cover & Avatar -->
                <div class="relative h-32 bg-gradient-to-r from-brand-500 to-blue-500">
                    <div class="absolute -bottom-16 right-6">
                        <div class="relative">
                            <img id="profile-avatar" src="" alt="Avatar" class="w-32 h-32 rounded-2xl ring-4 ring-white dark:ring-gray-800 shadow-lg object-cover">
                            <button id="change-avatar-btn" class="absolute bottom-0 left-0 bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-lg shadow-lg transition-colors">
                                <i class="fas fa-camera text-sm"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Profile Info -->
                <div class="pt-20 px-6 pb-6">
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <h2 id="profile-display-name" class="text-2xl font-bold text-gray-900 dark:text-white mb-1">...</h2>
                            <p id="profile-username" class="text-brand-600 dark:text-brand-400 font-mono text-lg mb-1">@...</p>
                            <p id="profile-email" class="text-gray-500 dark:text-gray-400 text-sm">...</p>
                        </div>
                        <button id="edit-profile-btn" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-colors shadow-sm">
                            <i class="fas fa-edit ml-1"></i> تعديل
                        </button>
                    </div>

                    <!-- Stats Grid -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div class="text-2xl font-bold text-brand-600" id="profile-points">0</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">النقاط</div>
                        </div>
                        <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div class="text-2xl font-bold text-purple-600" id="profile-level">1</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">المستوى</div>
                        </div>
                        <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div class="text-2xl font-bold text-green-600" id="profile-rank">متدرب</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">الرتبة</div>
                        </div>
                        <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div class="text-2xl font-bold text-orange-600" id="profile-weekly">0/20</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">هذا الأسبوع</div>
                        </div>
                    </div>

                    <!-- Telegram VIP Group Button -->
                    <div id="telegram-vip-section" class="hidden mb-6">
                        <a href="https://t.me/+SkOYOSnH20ZkNzRk" target="_blank" class="block p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-2xl shadow-lg transition-all transform hover:scale-[1.02]">
                            <div class="flex items-center justify-between text-white">
                                <div class="flex items-center gap-3">
                                    <div class="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                        <i class="fab fa-telegram text-2xl"></i>
                                    </div>
                                    <div>
                                        <h3 class="font-bold text-lg">مجموعة الدماء البيضاء VIP</h3>
                                        <p class="text-sm text-blue-100">انضم الآن للمجموعة الحصرية</p>
                                    </div>
                                </div>
                                <i class="fas fa-arrow-left text-xl"></i>
                            </div>
                        </a>
                    </div>

                    <!-- Contact Info -->
                    <div class="space-y-3 mb-6">
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-phone text-gray-400"></i>
                                <span class="text-sm text-gray-600 dark:text-gray-400">رقم الهاتف</span>
                            </div>
                            <span id="profile-phone" class="text-sm font-medium text-gray-900 dark:text-white">غير محدد</span>
                        </div>
                    </div>

                    <!-- Account Info -->
                    <div class="space-y-3">
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-calendar text-gray-400"></i>
                                <span class="text-sm text-gray-600 dark:text-gray-400">تاريخ الانضمام</span>
                            </div>
                            <span id="profile-joined" class="text-sm font-medium text-gray-900 dark:text-white">...</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-clock text-gray-400"></i>
                                <span class="text-sm text-gray-600 dark:text-gray-400">آخر تسجيل دخول</span>
                            </div>
                            <span id="profile-last-login" class="text-sm font-medium text-gray-900 dark:text-white">...</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="bg-white dark:bg-dark-card rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 p-6">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">إجراءات الحساب</h3>
                <div class="space-y-3">
                    <button id="logout-btn" class="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl transition-colors font-medium">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>تسجيل الخروج</span>
                        </div>
                        <i class="fas fa-chevron-left text-sm"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Edit Profile Modal -->
        <div id="edit-modal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">تعديل الملف الشخصي</h3>
                    <button id="close-modal-btn" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>

                <form id="edit-profile-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">الاسم الكامل</label>
                        <input type="text" id="edit-display-name" class="block w-full p-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500" placeholder="أحمد محمد" required>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            الاسم الرمزي (Username)
                            <span class="text-xs text-gray-500">- سيظهر مع #</span>
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 font-mono">
                                #
                            </div>
                            <input type="text" id="edit-username" class="block w-full pr-8 pl-3 p-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 font-mono" placeholder="ahmad_123" required pattern="[a-zA-Z0-9_]+" title="حروف وأرقام و _ فقط">
                        </div>
                        <p class="mt-1 text-xs text-gray-500">حروف إنجليزية وأرقام و _ فقط (بدون مسافات)</p>
                        <p id="username-availability" class="mt-1 text-xs"></p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">رقم الهاتف (اختياري)</label>
                        <input type="tel" id="edit-phone" class="block w-full p-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500" placeholder="+966 50 123 4567" dir="ltr">
                        <p class="mt-1 text-xs text-gray-500">يمكنك تركه فارغاً</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">رابط الصورة الشخصية</label>
                        <input type="url" id="edit-photo-url" class="block w-full p-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500" placeholder="https://example.com/photo.jpg">
                        <p class="mt-1 text-xs text-gray-500">اتركه فارغاً لاستخدام الصورة الافتراضية</p>
                    </div>

                    <div class="flex gap-3 pt-4">
                        <button type="submit" id="save-profile-btn" class="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-colors">
                            <i class="fas fa-save ml-1"></i> حفظ التغييرات
                        </button>
                        <button type="button" id="cancel-edit-btn" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-colors">
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Change Avatar Modal -->
        <div id="avatar-modal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">تغيير الصورة الشخصية</h3>
                    <button id="close-avatar-modal-btn" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">رابط الصورة</label>
                        <input type="url" id="new-avatar-url" class="block w-full p-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500" placeholder="https://example.com/avatar.jpg">
                    </div>

                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                        <p class="text-xs text-blue-800 dark:text-blue-300">
                            <i class="fas fa-info-circle ml-1"></i>
                            يمكنك استخدام روابط من مواقع مثل Imgur أو أي رابط صورة مباشر
                        </p>
                    </div>

                    <div class="flex gap-3">
                        <button id="save-avatar-btn" class="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-colors">
                            <i class="fas fa-check ml-1"></i> حفظ
                        </button>
                        <button id="cancel-avatar-btn" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-colors">
                            إلغاء
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export async function initProfile() {
    const user = auth.currentUser;
    if (!user) {
        window.location.hash = 'login';
        return;
    }

    try {
        // Load user data from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        // Update UI
        const avatar = userData.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'User')}&background=0ea5e9&color=fff`;
        document.getElementById('profile-avatar').src = avatar;
        document.getElementById('profile-display-name').innerText = userData.displayName || user.displayName || 'مستخدم';
        document.getElementById('profile-username').innerText = '@' + (userData.username || 'user');
        document.getElementById('profile-email').innerText = user.email;
        document.getElementById('profile-phone').innerText = userData.phoneNumber || 'غير محدد';
        document.getElementById('profile-points').innerText = userData.points || 0;
        document.getElementById('profile-level').innerText = userData.level || 1;
        document.getElementById('profile-rank').innerText = userData.rank || 'متدرب';
        document.getElementById('profile-weekly').innerText = `${userData.weeklyProgress?.count || 0}/20`;

        if (userData.createdAt) {
            document.getElementById('profile-joined').innerText = new Date(userData.createdAt.toDate()).toLocaleDateString('ar-EG');
        }
        if (userData.lastLogin) {
            document.getElementById('profile-last-login').innerText = new Date(userData.lastLogin.toDate()).toLocaleDateString('ar-EG');
        }

        // Check if user qualifies for Telegram VIP group
        try {
            const settingsDoc = await getDoc(doc(db, "settings", "global"));
            if (settingsDoc.exists()) {
                const settings = settingsDoc.data();
                const requiredPoints = settings.telegramGroupPoints || 500;
                const userPoints = userData.points || 0;

                // Show Telegram button if user has enough points
                if (userPoints >= requiredPoints) {
                    document.getElementById('telegram-vip-section').classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error("Error checking Telegram group eligibility:", error);
        }

        // Edit Profile Modal
        const editModal = document.getElementById('edit-modal');
        const editBtn = document.getElementById('edit-profile-btn');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        const editForm = document.getElementById('edit-profile-form');
        const usernameInput = document.getElementById('edit-username');
        const availabilityMsg = document.getElementById('username-availability');

        editBtn.addEventListener('click', () => {
            document.getElementById('edit-display-name').value = userData.displayName || user.displayName || '';
            document.getElementById('edit-username').value = userData.username || '';
            document.getElementById('edit-phone').value = userData.phoneNumber || '';
            document.getElementById('edit-photo-url').value = userData.photoURL || '';
            editModal.classList.remove('hidden');
        });

        closeModalBtn.addEventListener('click', () => editModal.classList.add('hidden'));
        cancelEditBtn.addEventListener('click', () => editModal.classList.add('hidden'));

        // Check username availability
        usernameInput.addEventListener('input', async (e) => {
            const username = e.target.value.toLowerCase().trim();
            if (username.length < 3) {
                availabilityMsg.innerText = '';
                return;
            }

            // Skip check if it's the current username
            if (username === (userData.username || '').toLowerCase()) {
                availabilityMsg.className = 'mt-1 text-xs text-green-600';
                availabilityMsg.innerHTML = '<i class="fas fa-check ml-1"></i> هذا اسمك الحالي';
                return;
            }

            try {
                const q = query(collection(db, "users"), where("username", "==", username));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    availabilityMsg.className = 'mt-1 text-xs text-green-600';
                    availabilityMsg.innerHTML = '<i class="fas fa-check ml-1"></i> الاسم متاح';
                } else {
                    availabilityMsg.className = 'mt-1 text-xs text-red-600';
                    availabilityMsg.innerHTML = '<i class="fas fa-times ml-1"></i> الاسم محجوز بالفعل';
                }
            } catch (error) {
                console.error(error);
            }
        });

        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newDisplayName = document.getElementById('edit-display-name').value;
            const newUsername = document.getElementById('edit-username').value.toLowerCase().trim();
            const newPhone = document.getElementById('edit-phone').value.trim();
            const newPhotoURL = document.getElementById('edit-photo-url').value || `https://ui-avatars.com/api/?name=${encodeURIComponent(newDisplayName)}&background=0ea5e9&color=fff`;
            const saveBtn = document.getElementById('save-profile-btn');

            // Check if username is taken (if changed)
            if (newUsername !== (userData.username || '').toLowerCase()) {
                const q = query(collection(db, "users"), where("username", "==", newUsername));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    alert('الاسم الرمزي محجوز بالفعل. اختر اسماً آخر.');
                    return;
                }
            }

            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-1"></i> جاري الحفظ...';
            saveBtn.disabled = true;

            try {
                // Update Firebase Auth profile
                await updateProfile(user, {
                    displayName: newDisplayName,
                    photoURL: newPhotoURL
                });

                // Update Firestore
                await updateDoc(doc(db, "users", user.uid), {
                    displayName: newDisplayName,
                    username: newUsername,
                    phoneNumber: newPhone || null,
                    photoURL: newPhotoURL
                });

                // Update UI
                document.getElementById('profile-display-name').innerText = newDisplayName;
                document.getElementById('profile-username').innerText = '@' + newUsername;
                document.getElementById('profile-phone').innerText = newPhone || 'غير محدد';
                document.getElementById('profile-avatar').src = newPhotoURL;

                editModal.classList.add('hidden');
                alert('تم تحديث الملف الشخصي بنجاح!');
            } catch (error) {
                console.error(error);
                alert('فشل التحديث: ' + error.message);
            }

            saveBtn.innerHTML = '<i class="fas fa-save ml-1"></i> حفظ التغييرات';
            saveBtn.disabled = false;
        });

        // Change Avatar Modal
        const avatarModal = document.getElementById('avatar-modal');
        const changeAvatarBtn = document.getElementById('change-avatar-btn');
        const closeAvatarModalBtn = document.getElementById('close-avatar-modal-btn');
        const cancelAvatarBtn = document.getElementById('cancel-avatar-btn');
        const saveAvatarBtn = document.getElementById('save-avatar-btn');

        changeAvatarBtn.addEventListener('click', () => {
            document.getElementById('new-avatar-url').value = '';
            avatarModal.classList.remove('hidden');
        });

        closeAvatarModalBtn.addEventListener('click', () => avatarModal.classList.add('hidden'));
        cancelAvatarBtn.addEventListener('click', () => avatarModal.classList.add('hidden'));

        saveAvatarBtn.addEventListener('click', async () => {
            const newAvatarURL = document.getElementById('new-avatar-url').value;
            if (!newAvatarURL) {
                alert('الرجاء إدخال رابط الصورة');
                return;
            }

            saveAvatarBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-1"></i> جاري الحفظ...';
            saveAvatarBtn.disabled = true;

            try {
                await updateProfile(user, { photoURL: newAvatarURL });
                await updateDoc(doc(db, "users", user.uid), { photoURL: newAvatarURL });

                document.getElementById('profile-avatar').src = newAvatarURL;
                avatarModal.classList.add('hidden');
                alert('تم تحديث الصورة بنجاح!');
            } catch (error) {
                console.error(error);
                alert('فشل التحديث: ' + error.message);
            }

            saveAvatarBtn.innerHTML = '<i class="fas fa-check ml-1"></i> حفظ';
            saveAvatarBtn.disabled = false;
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', async () => {
            if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                await logout();
                window.location.hash = 'login';
            }
        });

    } catch (error) {
        console.error("Error loading profile:", error);
    }
}
