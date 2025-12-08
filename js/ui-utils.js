
// UI Utilities Module

/**
 * Show a toast notification
 * @param {string} message 
 * @param {boolean} isSuccess 
 */
export function showToast(message, isSuccess = true) {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = "position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); z-index: 1001; width: calc(100% - 2rem); max-width: 400px;";
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    // Using inline styles for now to ensure it works without global CSS dependency, 
    // but classes should be used if main CSS is loaded.
    toast.className = `toast ${isSuccess ? '' : 'error'}`;
    // Fallback styles if CSS classes aren't ready
    if (!document.querySelector('style')) {
        toast.style.cssText = `padding: 1rem 1.5rem; border-radius: 0.75rem; color: white; background-color: ${isSuccess ? '#10b981' : '#ef4444'}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 0.75rem; margin-top: 10px;`;
    }

    toast.innerHTML = `<i class="fas ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);

    // Animation logic
    toast.animate([
        { opacity: 0, transform: 'translateY(20px)' },
        { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 500, fill: 'forwards' });

    setTimeout(() => {
        toast.animate([
            { opacity: 1, transform: 'translateY(0)' },
            { opacity: 0, transform: 'translateY(20px)' }
        ], { duration: 500, fill: 'forwards' }).onfinish = () => toast.remove();
    }, 4500);
}

/**
 * Show a generic modal
 * @param {string} contentHTML 
 * @param {string} title 
 */
export function showModal(title, contentHTML) {
    let modalContainer = document.getElementById('modal-container');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'modal-container';
        document.body.appendChild(modalContainer);
    }

    modalContainer.innerHTML = `
        <div class="modal-backdrop active" id="active-modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px);">
            <div class="modal-content bg-white w-full max-w-lg p-6 rounded-2xl shadow-2xl relative animate-fade-in-up" style="max-height: 90vh; overflow-y: auto;">
                <div class="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                    <button id="active-modal-close-btn" class="text-gray-400 hover:text-red-500 text-2xl transition-colors">&times;</button>
                </div>
                ${contentHTML}
            </div>
        </div>`;

    document.getElementById('active-modal-close-btn').onclick = closeModal;
    document.getElementById('active-modal-backdrop').onclick = (e) => {
        if (e.target.id === 'active-modal-backdrop') closeModal();
    };
}

export function closeModal() {
    const container = document.getElementById('modal-container');
    if (container) container.innerHTML = '';
}

/**
 * Create a simple loading spinner HTML
 */
export function getLoaderHTML() {
    return `<div class="loader mx-auto" style="border: 4px solid #f3f3f3; border-top: 4px solid #4f46e5; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>`;
}
