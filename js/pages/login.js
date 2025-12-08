import { login, signup, resetPassword } from '../auth.js';

export function renderLogin() {
    return `
        <div class="min-h-[80vh] flex items-center justify-center -mt-10 animate-fade-in">
            <div class="bg-white dark:bg-dark-card w-full max-w-md p-8 rounded-3xl shadow-card border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                 <!-- Decor -->
                <div class="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
                
                <div class="text-center mb-8 relative z-10">
                     <div class="w-16 h-16 mx-auto bg-brand-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg mb-4 transform rotate-3">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">تطبيق المشرفين</h2>
                    <p class="text-gray-500 dark:text-gray-400 mt-2">قم بتسجيل الدخول لمتابعة عملك</p>
                </div>

                <!-- Tabs -->
                <div class="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 relative z-10">
                    <button id="tab-login" class="flex-1 py-2 text-sm font-bold rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm transition-all duration-300">
                        تسجيل دخول
                    </button>
                    <button id="tab-signup" class="flex-1 py-2 text-sm font-bold rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all duration-300">
                        حساب جديد
                    </button>
                </div>

                <!-- Login Form -->
                <form id="login-form" class="space-y-4 relative z-10">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
                        <div class="relative">
                             <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                <i class="far fa-envelope"></i>
                            </div>
                            <input type="email" id="email" class="block w-full pr-10 pl-3 py-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-colors" placeholder="user@example.com" required>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                <i class="fas fa-lock"></i>
                            </div>
                            <input type="password" id="password" class="block w-full pr-10 pl-10 py-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-colors" placeholder="••••••••" required>
                            <button type="button" id="toggle-password" class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <i class="far fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <label class="flex items-center">
                            <input type="checkbox" id="remember-me" class="rounded border-gray-300 text-brand-600 focus:ring-brand-500">
                            <span class="mr-2 text-sm text-gray-600 dark:text-gray-400">تذكرني</span>
                        </label>
                        <button type="button" id="forgot-password-btn" class="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium">نسيت كلمة المرور؟</button>
                    </div>
                    
                    <button type="submit" id="login-btn" class="w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all">
                        تسجيل الدخول
                    </button>
                </form>

                <!-- Signup Form (Hidden) -->
                <form id="signup-form" class="space-y-4 relative z-10 hidden">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم المستخدم</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                <i class="far fa-user"></i>
                            </div>
                            <input type="text" id="new-username" class="block w-full pr-10 pl-3 py-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-colors" placeholder="اسمك في الفريق" required>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
                        <div class="relative">
                             <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                <i class="far fa-envelope"></i>
                            </div>
                            <input type="email" id="new-email" class="block w-full pr-10 pl-3 py-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-colors" placeholder="user@example.com" required>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">كلمة المرور</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                <i class="fas fa-lock"></i>
                            </div>
                            <input type="password" id="new-password" class="block w-full pr-10 pl-10 py-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-colors" placeholder="••••••••" required minlength="6">
                            <button type="button" id="toggle-new-password" class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <i class="far fa-eye"></i>
                            </button>
                        </div>
                        <p class="mt-1 text-xs text-gray-500">يجب أن تكون 6 أحرف على الأقل</p>
                    </div>
                    
                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                        <p class="text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                            <i class="fas fa-info-circle mt-0.5"></i>
                            <span>عند إنشاء الحساب، ستبدأ برتبة <strong>متدرب</strong> و <strong>0 نقطة</strong>. اجمع النقاط لترتقي!</span>
                        </p>
                    </div>
                    
                    <button type="submit" id="signup-btn" class="w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all">
                        إنشاء حساب
                    </button>
                </form>

            </div>
        </div>

        <!-- Toast Notification -->
        <div id="toast-notification" class="hidden fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-md">
                <div class="flex items-start gap-3">
                    <div id="toast-icon" class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center">
                        <i class="fas fa-check text-xl"></i>
                    </div>
                    <div class="flex-1">
                        <h4 id="toast-title" class="font-bold text-gray-900 dark:text-white mb-1"></h4>
                        <p id="toast-message" class="text-sm text-gray-600 dark:text-gray-400"></p>
                    </div>
                    <button id="toast-close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

export function initLogin() {
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // Toast notification function
    function showToast(title, message, type = 'success') {
        const toast = document.getElementById('toast-notification');
        const icon = document.getElementById('toast-icon');
        const titleEl = document.getElementById('toast-title');
        const messageEl = document.getElementById('toast-message');

        // Set content
        titleEl.innerText = title;
        messageEl.innerText = message;

        // Set icon and color
        if (type === 'success') {
            icon.className = 'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/30 text-green-600';
            icon.innerHTML = '<i class="fas fa-check text-xl"></i>';
        } else if (type === 'error') {
            icon.className = 'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-600';
            icon.innerHTML = '<i class="fas fa-exclamation-circle text-xl"></i>';
        } else if (type === 'info') {
            icon.className = 'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600';
            icon.innerHTML = '<i class="fas fa-envelope text-xl"></i>';
        }

        // Show toast
        toast.classList.remove('hidden');

        // Auto hide after 5 seconds
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 5000);
    }

    // Close toast
    document.getElementById('toast-close')?.addEventListener('click', () => {
        document.getElementById('toast-notification').classList.add('hidden');
    });

    // Password Toggle for Login
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');

    togglePassword.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        togglePassword.querySelector('i').classList.toggle('fa-eye');
        togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
    });

    // Password Toggle for Signup
    const toggleNewPassword = document.getElementById('toggle-new-password');
    const newPasswordInput = document.getElementById('new-password');

    toggleNewPassword.addEventListener('click', () => {
        const type = newPasswordInput.type === 'password' ? 'text' : 'password';
        newPasswordInput.type = type;
        toggleNewPassword.querySelector('i').classList.toggle('fa-eye');
        toggleNewPassword.querySelector('i').classList.toggle('fa-eye-slash');
    });

    // Remember Me - Load saved email
    const rememberCheckbox = document.getElementById('remember-me');
    const emailInput = document.getElementById('email');

    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
        emailInput.value = savedEmail;
        rememberCheckbox.checked = true;
    }

    // Forgot Password
    document.getElementById('forgot-password-btn').addEventListener('click', async () => {
        const email = emailInput.value;
        if (!email) {
            showToast('خطأ', 'الرجاء إدخال البريد الإلكتروني أولاً', 'error');
            return;
        }

        try {
            await resetPassword(email);
            showToast(
                'تم إرسال رابط إعادة التعيين',
                'تحقق من بريدك الإلكتروني (بما في ذلك مجلد الرسائل المهملة/Spam)',
                'info'
            );
        } catch (error) {
            let errorMessage = 'فشل إرسال رابط إعادة التعيين';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'البريد الإلكتروني غير مسجل';
            }
            showToast('خطأ', errorMessage, 'error');
        }
    });

    // Tab Switching
    tabLogin.addEventListener('click', () => {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        tabLogin.classList.add('bg-white', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-white', 'shadow-sm');
        tabLogin.classList.remove('text-gray-500', 'dark:text-gray-400');
        tabSignup.classList.remove('bg-white', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-white', 'shadow-sm');
        tabSignup.classList.add('text-gray-500', 'dark:text-gray-400');
    });

    tabSignup.addEventListener('click', () => {
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        tabSignup.classList.add('bg-white', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-white', 'shadow-sm');
        tabSignup.classList.remove('text-gray-500', 'dark:text-gray-400');
        tabLogin.classList.remove('bg-white', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-white', 'shadow-sm');
        tabLogin.classList.add('text-gray-500', 'dark:text-gray-400');
    });

    // Handle Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;
        const btn = document.getElementById('login-btn');

        // Save email if remember me is checked
        if (rememberCheckbox.checked) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الدخول...';
        btn.disabled = true;

        try {
            await login(email, password);
            // Auth observer in app.js will handle redirect
        } catch (error) {
            console.error(error);
            let errorMessage = "فشل تسجيل الدخول";

            if (error.code === 'auth/wrong-password') {
                errorMessage = "كلمة المرور غير صحيحة";
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = "المستخدم غير موجود";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "البريد الإلكتروني غير صالح";
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = "محاولات كثيرة. حاول لاحقاً";
            }

            showToast('خطأ في تسجيل الدخول', errorMessage, 'error');
            btn.innerHTML = 'تسجيل الدخول';
            btn.disabled = false;
        }
    });

    // Handle Signup
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('new-email').value;
        const password = newPasswordInput.value;
        const username = document.getElementById('new-username').value;
        const btn = document.getElementById('signup-btn');

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإنشاء...';
        btn.disabled = true;

        try {
            await signup(email, password, username);
            showToast('تم إنشاء الحساب بنجاح!', 'مرحباً بك في فريق المشرفين. ابدأ بجمع النقاط!', 'success');
            // Auth observer will handle redirect
        } catch (error) {
            console.error(error);
            let errorMessage = "فشل إنشاء الحساب";

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "البريد الإلكتروني مستخدم بالفعل";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "البريد الإلكتروني غير صالح";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "كلمة المرور ضعيفة جداً";
            } else if (error.code === 'auth/operation-not-allowed') {
                errorMessage = "⚠️ يجب تفعيل Email/Password في Firebase Console!\n\nالخطوات:\n1. افتح Firebase Console\n2. اذهب إلى Authentication\n3. اختر Sign-in method\n4. فعّل Email/Password";
            }

            showToast('خطأ', errorMessage, 'error');
            btn.innerHTML = 'إنشاء حساب';
            btn.disabled = false;
        }
    });
}
