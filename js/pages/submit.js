import { uploadImageToImgBB } from '../api/imgbb.js';
import { db } from '../firebase-config.js';
// We would import collection/addDoc from firebaseSDK here but we need to ensure firebase-config exports them or we import from SDK directly.
// For now, let's assume valid imports or handle logic in firebase-config if we want to centralize.
// Since firebase-config exports 'db' (initialized instance), we need addDoc from SDK.
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function renderSubmit() {
    return `
        <div class="max-w-xl mx-auto animate-fade-in">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">تقديم إثبات عمل</h1>
            
            <form id="submit-form" class="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-card border border-gray-100 dark:border-gray-700 space-y-6">
                
                <!-- Image Upload -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">صورة الإثبات</label>
                    <div class="relative">
                        <input type="file" id="proof-image" accept="image/*" class="hidden" required>
                        <label for="proof-image" id="drop-zone" class="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div class="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
                                <i class="fas fa-cloud-upload-alt text-4xl mb-3"></i>
                                <p class="text-sm">اضغط للرفع أو اسحب الصورة هنا</p>
                            </div>
                            <img id="preview-image" src="" alt="Preview" class="hidden absolute inset-0 w-full h-full object-contain rounded-xl bg-gray-100 dark:bg-gray-800">
                        </label>
                    </div>
                </div>

                <!-- Post Link -->
                <div>
                    <label for="post-link" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">رابط المنشور</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                            <i class="fas fa-link"></i>
                        </div>
                        <input type="url" id="post-link" class="block w-full pr-10 pl-3 py-3 rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-brand-500 focus:border-brand-500 transition-colors" placeholder="https://..." required>
                    </div>
                </div>

                <!-- Submit Button -->
                <button type="submit" id="submit-btn" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    <span id="btn-text">إرسال الإثبات</span>
                    <i id="btn-icon" class="fas fa-paper-plane mr-2"></i>
                </button>
            </form>
        </div>
    `;
}

export function initSubmit() {
    const fileInput = document.getElementById('proof-image');
    const dropZone = document.getElementById('drop-zone');
    const previewImage = document.getElementById('preview-image');
    const form = document.getElementById('submit-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnIcon = document.getElementById('btn-icon');

    // Handle File Selection
    fileInput.addEventListener('change', handleFileSelect);

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                previewImage.src = e.target.result;
                previewImage.classList.remove('hidden');
                // Hide default content inside drop zone
                dropZone.querySelector('div').classList.add('hidden');
            }
            reader.readAsDataURL(file);
        }
    }

    // Handle Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = fileInput.files[0];
        const link = document.getElementById('post-link').value;

        if (!file) {
            alert("يرجى اختيار صورة الإثبات");
            return;
        }

        // Loading State
        setLoading(true);

        try {
            // 1. Upload to ImgBB
            const imageUrl = await uploadImageToImgBB(file);
            console.log("Image uploaded:", imageUrl);

            // 2. Save to Firestore
            // TODO: Get actual user ID when Auth is ready. Using 'test-user' for now.
            const submissionData = {
                userId: "test-user-id", // auth.currentUser ? auth.currentUser.uid : 'anon',
                username: "Test User", // auth.currentUser ? auth.currentUser.displayName : 'Anonymous',
                imageUrl: imageUrl,
                postLink: link,
                status: "pending", // pending, approved, rejected
                submittedAt: serverTimestamp(),
                pointsGiven: 0
            };

            await addDoc(collection(db, "proof_submissions"), submissionData);

            // Success
            alert("تم إرسال الإثبات بنجاح!");
            form.reset();
            previewImage.classList.add('hidden');
            dropZone.querySelector('div').classList.remove('hidden');

        } catch (error) {
            console.error("Submission error:", error);
            alert("حدث خطأ أثناء الإرسال: " + error.message);
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        if (isLoading) {
            btnText.innerText = "جاري الرفع...";
            btnIcon.className = "fas fa-spinner fa-spin mr-2";
        } else {
            btnText.innerText = "إرسال الإثبات";
            btnIcon.className = "fas fa-paper-plane mr-2";
        }
    }
}
