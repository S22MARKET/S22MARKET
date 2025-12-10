
import { app, auth, db, doc, getDoc, updateDoc, onSnapshot, query, collection, where, orderBy, serverTimestamp, addDoc, deleteDoc, getDocs, onAuthStateChanged, signOut } from './firebase-config.js';

let currentUser = null;
let quill;
let salesChart;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.role === 'vendor' || data.role === 'restaurant') {
                    currentUser = user;
                    document.getElementById('shop-name').textContent = data.storeName || data.displayName;

                    // Initialize Components
                    loadOrdersListener();
                    loadProducts();
                    loadCategories();
                    loadSettings(data);
                    initQuill();
                    initChart(); // New Feature
                    renderStoreLink(); // New Feature

                    // Navigation Logic
                    setupNavigation();

                    // Restaurant Specific UI
                    if (data.role === 'restaurant') {
                        document.querySelectorAll('.restaurant-only').forEach(el => el.classList.remove('hidden'));
                        loadOffers();
                    }

                    // Logout
                    document.getElementById('logout-btn').onclick = () => signOut(auth);

                } else {
                    alert("عذراً، هذا الحساب ليس حساب تاجر.");
                    window.location.href = 'index.html';
                }
            }
        } else {
            window.location.href = 'login.html';
        }
    });
}

function initQuill() {
    try {
        quill = new Quill('#quill-editor', {
            theme: 'snow',
            modules: { toolbar: [['bold', 'italic'], [{ 'list': 'ordered' }, { 'list': 'bullet' }]] }
        });
    } catch (e) { console.error("Quill init error", e); }
}

function setupNavigation() {
    window.showSection = (sectionId) => {
        document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
        document.getElementById(`${sectionId}-section`).classList.remove('hidden');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active', 'bg-gray-800', 'text-white'));
        document.getElementById(`btn-${sectionId}`).classList.add('active', 'bg-gray-800', 'text-white');

        if (window.innerWidth < 1024) {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (sidebar) sidebar.classList.add('closed');
            if (overlay) overlay.classList.remove('active');
        }
    };

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const menuBtn = document.getElementById('menu-btn');

    if (menuBtn) {
        menuBtn.onclick = () => {
            sidebar.classList.toggle('closed');
            overlay.classList.toggle('active');
        };
    }

    if (overlay) {
        overlay.onclick = () => {
            sidebar.classList.add('closed');
            overlay.classList.remove('active');
        };
    }

    if (window.innerWidth < 1024) sidebar.classList.add('closed');
}


// --- Orders Logic ---
let ordersCache = [];

function loadOrdersListener() {
    const q = query(collection(db, "orders"), where("sellerId", "==", currentUser.uid), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        const tbody = document.getElementById('orders-tbody');
        tbody.innerHTML = '';

        let newOrders = 0;
        let dailyTotal = 0;
        let salesData = Array(7).fill(0); // For Chart (Last 7 days)
        ordersCache = [];

        if (snapshot.empty) {
            document.getElementById('no-orders-msg').classList.remove('hidden');
        } else {
            document.getElementById('no-orders-msg').classList.add('hidden');

            snapshot.forEach(docSnap => {
                const order = docSnap.data();
                const id = docSnap.id;
                ordersCache.push({ id, ...order });

                const dateObj = order.createdAt?.toDate();
                const timeStr = dateObj?.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) || '--:--';

                // Stats
                if (order.status === 'new') newOrders++;
                if (order.status === 'completed' && isToday(dateObj)) dailyTotal += (order.totalPrice || 0);

                // Chart Data (Last 7 Days)
                if (order.status === 'completed' && dateObj) {
                    const dayDiff = getDaysDifference(dateObj);
                    if (dayDiff >= 0 && dayDiff < 7) {
                        salesData[6 - dayDiff] += (order.totalPrice || 0);
                    }
                }

                // Sound & Notification
                if (snapshot.docChanges().some(change => change.type === 'added' && change.doc.id === id && order.status === 'new')) {
                    playNotification();
                }

                // Render Row
                const statusClass = `status-${order.status}`;
                const statusText = { 'new': 'جديد', 'preparing': 'تحضير', 'completed': 'مكتمل', 'canceled': 'ملغي' }[order.status] || order.status;

                const row = `
                    <tr class="${order.status === 'new' ? 'new-order-row' : ''}">
                        <td>#${id.substring(0, 6)}</td>
                        <td>${order.customerName}<br><span class="text-xs text-gray-500">${order.customerContact}</span></td>
                        <td class="font-bold text-indigo-600">${order.totalPrice} د.ج</td>
                        <td class="text-xs truncate max-w-[150px]">${order.customerLocation}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td class="text-xs text-gray-500">${timeStr}</td>
                        <td>
                            <div class="flex gap-2">
                                <button onclick="window.printReceipt('${id}')" class="text-gray-500 hover:text-gray-800" title="طباعة"><i class="fas fa-print"></i></button>
                                <select onchange="window.updateOrderStatus('${id}', this.value)" class="text-xs border rounded p-1">
                                    <option value="new" ${order.status === 'new' ? 'selected' : ''}>جديد</option>
                                    <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>تحضير</option>
                                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>مكتمل</option>
                                    <option value="canceled" ${order.status === 'canceled' ? 'selected' : ''}>إلغاء</option>
                                </select>
                            </div>
                        </td>
                    </tr>`;
                tbody.insertAdjacentHTML('beforeend', row);
            });
        }

        // Update Stats
        document.getElementById('stats-new-orders').textContent = newOrders;
        document.getElementById('stats-daily-sales').textContent = dailyTotal.toLocaleString() + ' د.ج';

        const badge = document.getElementById('new-orders-badge');
        if (newOrders > 0) {
            badge.textContent = newOrders;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        // Update Chart
        updateChart(salesData);
        updateTopProducts(ordersCache);
    });
}

function updateTopProducts(orders) {
    const productsMap = {};

    orders.forEach(order => {
        if (order.status !== 'canceled' && order.items) {
            order.items.forEach(item => {
                if (!productsMap[item.name]) {
                    productsMap[item.name] = { count: 0, revenue: 0 };
                }
                productsMap[item.name].count += (item.quantity || 1);
                productsMap[item.name].revenue += (item.price * (item.quantity || 1));
            });
        }
    });

    const sortedProducts = Object.entries(productsMap)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 5);

    const tbody = document.getElementById('top-products-tbody');
    if (!tbody) return;

    tbody.innerHTML = sortedProducts.length ? '' : '<tr><td colspan="3" class="p-4 text-center text-gray-400">لا توجد بيانات</td></tr>';

    sortedProducts.forEach(([name, data]) => {
        const row = `
            <tr class="border-b border-gray-50 hover:bg-gray-50">
                <td class="p-3 font-medium text-gray-800">${name}</td>
                <td class="p-3 text-gray-600 font-bold">${data.count}</td>
                <td class="p-3 text-indigo-600 font-bold">${data.revenue.toLocaleString()} د.ج</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// Global Order Functions (exposed to window)
window.updateOrderStatus = async (id, status) => {
    try { await updateDoc(doc(db, "orders", id), { status }); showToast('تم تحديث حالة الطلب'); }
    catch (e) { console.error(e); }
};

window.printReceipt = async (orderId) => {
    const docSnap = await getDoc(doc(db, "orders", orderId));
    if (!docSnap.exists()) return;
    const order = docSnap.data();
    const itemsHTML = order.items.map(i => `<div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:12px;"><span>${i.quantity}x ${i.name}</span><span>${i.price * i.quantity}</span></div>`).join('');

    // Create print window
    const printWindow = window.open('', '', 'width=350,height=600');
    printWindow.document.write(`
        <html dir="rtl">
        <body style="font-family: 'Tajawal', sans-serif; width: 80mm; padding: 10px; margin: 0;">
            <div style="text-align:center; border-bottom: 1px dashed #000; padding-bottom: 10px;">
                <h2 style="margin:0;">${document.getElementById('shop-name').textContent}</h2>
                <p style="margin:5px 0; font-size:12px;">طلب #${orderId.substring(0, 6)}</p>
                <p style="margin:0; font-size:12px;">${new Date().toLocaleString('ar-EG')}</p>
            </div>
            <div style="margin: 15px 0;">
                <p style="margin:2px 0; font-size:14px;"><b>العميل:</b> ${order.customerName}</p>
                <p style="margin:2px 0; font-size:14px;"><b>الهاتف:</b> ${order.customerContact}</p>
                <p style="margin:2px 0; font-size:12px;"><b>العنوان:</b> ${order.customerLocation}</p>
            </div>
            <div style="border-top: 1px solid #000; padding-top: 10px;">${itemsHTML}</div>
            <div style="border-top: 2px solid #000; margin-top: 10px; padding-top: 5px; display:flex; justify-content:space-between; font-weight:bold;">
                <span>الإجمالي:</span><span>${order.totalPrice} د.ج</span>
            </div>
            <div style="text-align:center; margin-top: 20px; font-size: 10px;">شكراً لطلبكم!</div>
            <script>window.print(); window.close();</script>
        </body>
        </html>`
    );
};

window.exportOrdersCSV = () => {
    if (ordersCache.length === 0) return showToast("لا توجد طلبات لتصديرها", "error");

    let csvContent = "\uFEFFرقم الطلب,العميل,الهاتف,العنوان,المبلغ,الحالة,التاريخ\n";
    ordersCache.forEach(o => {
        const date = o.createdAt?.toDate().toLocaleString('ar-EG') || '';
        const row = [
            `#${o.id.substring(0, 6)}`,
            o.customerName || '',
            o.customerContact || '',
            `"${o.customerLocation || ''}"`,
            o.totalPrice || 0,
            o.status || '',
            `"${date}"`
        ];
        csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "orders_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


// --- Products Logic ---
async function loadProducts() {
    const q = query(collection(db, "products"), where("sellerId", "==", currentUser.uid), orderBy("createdAt", "desc"));
    onSnapshot(q, (snap) => {
        const grid = document.getElementById('products-grid');
        grid.innerHTML = '';
        document.getElementById('stats-products').textContent = snap.size;

        snap.forEach(docSnap => {
            const p = docSnap.data();
            const card = document.createElement('div');
            card.className = "bg-white p-4 rounded-xl shadow-sm border border-gray-200 relative group";
            card.innerHTML = `
                <div class="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onclick="window.editProduct('${docSnap.id}')" class="bg-blue-100 text-blue-600 p-2 rounded-full hover:bg-blue-200"><i class="fas fa-edit"></i></button>
                    <button onclick="window.deleteProduct('${docSnap.id}')" class="bg-red-100 text-red-600 p-2 rounded-full hover:bg-red-200"><i class="fas fa-trash"></i></button>
                </div>
                <img src="${p.imageUrls?.[0] || 'https://placehold.co/150'}" class="w-full h-32 object-cover rounded-lg mb-3">
                <h3 class="font-bold text-gray-800 text-sm truncate">${p.name}</h3>
                <div class="flex justify-between items-center mt-2">
                    <span class="text-indigo-600 font-bold">${p.price} د.ج</span>
                    <span class="text-xs ${p.availability === 'sold_out' ? 'text-red-500' : 'text-green-500'} font-bold">${p.availability === 'sold_out' ? 'نفذ' : 'متوفر'}</span>
                </div>`;
            grid.appendChild(card);
        });
    });
}

window.openProductModal = () => {
    document.getElementById('product-form').reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('modal-title').textContent = 'إضافة منتج';
    if (quill) quill.root.innerHTML = '';

    // Reset Image
    document.getElementById('prod-image-url').value = '';
    const fileInput = document.getElementById('prod-image-file');
    if (fileInput) fileInput.value = '';
    document.getElementById('img-preview').classList.add('hidden');
    document.getElementById('img-placeholder').classList.remove('hidden');

    document.getElementById('addons-list').innerHTML = '';
    if (currentUser.role === 'restaurant') document.getElementById('addons-container').classList.remove('hidden');

    document.getElementById('product-modal').classList.add('active');
};

window.closeModal = () => document.getElementById('product-modal').classList.remove('active');

document.getElementById('product-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-prod-btn');
    btn.disabled = true; btn.textContent = 'جاري الحفظ...';

    const id = document.getElementById('prod-id').value;
    const data = {
        name: document.getElementById('prod-name').value,
        price: parseFloat(document.getElementById('prod-price').value),
        categoryId: document.getElementById('prod-category').value,
        description: quill ? quill.root.innerHTML : document.getElementById('prod-name').value,
        imageUrls: [document.getElementById('prod-image-url').value],
        availability: document.getElementById('prod-available').checked ? 'available' : 'sold_out',
        addOns: Array.from(document.querySelectorAll('.addon-item')).map(item => ({
            name: item.querySelector('.addon-name').value,
            price: Number(item.querySelector('.addon-price').value)
        })).filter(a => a.name && a.price),
        sellerId: currentUser.uid,
        updatedAt: serverTimestamp()
    };

    try {
        if (id) {
            await updateDoc(doc(db, "products", id), data);
        } else {
            data.createdAt = serverTimestamp();
            data.productType = 'regular';
            await addDoc(collection(db, "products"), data);
        }
        closeModal();
        showToast('تم حفظ المنتج بنجاح');
    } catch (err) {
        console.error(err);
        alert('حدث خطأ');
    } finally {
        btn.disabled = false;
        btn.textContent = 'حفظ المنتج';
    }
};

window.deleteProduct = async (id) => {
    if (confirm('حذف المنتج نهائياً؟')) {
        await deleteDoc(doc(db, "products", id));
    }
};

window.editProduct = async (id) => {
    const snap = await getDoc(doc(db, "products", id));
    const p = snap.data();

    document.getElementById('prod-id').value = id;
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-price').value = p.price;
    document.getElementById('prod-category').value = p.categoryId;
    // Image handling for edit
    const imgUrl = p.imageUrls?.[0] || '';
    document.getElementById('prod-image-url').value = imgUrl;
    if (imgUrl) {
        document.getElementById('img-preview').src = imgUrl;
        document.getElementById('img-preview').classList.remove('hidden');
        document.getElementById('img-placeholder').classList.add('hidden');
    } else {
        document.getElementById('img-preview').classList.add('hidden');
        document.getElementById('img-placeholder').classList.remove('hidden');
    }
    document.getElementById('prod-available').checked = p.availability !== 'sold_out';

    // Add-ons
    const addonsList = document.getElementById('addons-list');
    addonsList.innerHTML = '';
    if (p.addOns) {
        document.getElementById('addons-container').classList.remove('hidden'); // Ensure visible if used
        p.addOns.forEach(ad => addAddonItem(ad.name, ad.price));
    }

    if (quill) quill.root.innerHTML = p.description;

    document.getElementById('modal-title').textContent = 'تعديل منتج';
    document.getElementById('product-modal').classList.add('active');
};


// --- Settings Logic ---
async function loadSettings(userData) {
    document.getElementById('store-status-toggle').checked = userData.isOpen !== false;
    document.getElementById('set-name').value = userData.storeName || '';
    document.getElementById('set-desc').value = userData.description || '';
    document.getElementById('set-phone').value = userData.phone || '';
    document.getElementById('set-delivery').value = userData.deliveryFee || '';

    const links = userData.socialLinks || {};
    document.getElementById('set-fb').value = links.facebook || '';
    document.getElementById('set-insta').value = links.instagram || '';
    document.getElementById('set-telegram').value = links.telegram || '';
    document.getElementById('set-tiktok').value = links.tiktok || '';
    document.getElementById('set-show-phone').checked = userData.showPhone !== false;

    // Listener for toggle
    document.getElementById('store-status-toggle').onchange = async (e) => {
        await updateDoc(doc(db, "users", currentUser.uid), { isOpen: e.target.checked });
        showToast(e.target.checked ? 'المتجر مفتوح الآن ✅' : 'المتجر مغلق ⛔');
    };
}

document.getElementById('settings-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = "جاري الحفظ...";

    const updates = {
        storeName: document.getElementById('set-name').value,
        description: document.getElementById('set-desc').value,
        phone: document.getElementById('set-phone').value,
        deliveryFee: parseFloat(document.getElementById('set-delivery').value),
        socialLinks: {
            facebook: document.getElementById('set-fb').value,
            instagram: document.getElementById('set-insta').value,
            telegram: document.getElementById('set-telegram').value,
            tiktok: document.getElementById('set-tiktok').value
        },
        showPhone: document.getElementById('set-show-phone').checked
    };

    try {
        await updateDoc(doc(db, "users", currentUser.uid), updates);
        showToast("تم حفظ الإعدادات بنجاح");
    } catch (e) { console.error(e); showToast("خطأ في الحفظ", "error"); }
    finally { btn.disabled = false; btn.textContent = "حفظ التغييرات"; }
};


// --- Chart Logic (New) ---
function initChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: getLast7DaysLabels(),
            datasets: [{
                label: 'المبيعات (د.ج)',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function updateChart(data) {
    if (salesChart) {
        salesChart.data.datasets[0].data = data;
        salesChart.update();
    }
}


// --- Utils ---
async function loadCategories() {
    const snap = await getDocs(query(collection(db, "categories"), orderBy("orderIndex")));
    const select = document.getElementById('prod-category');
    select.innerHTML = '';
    snap.forEach(d => { select.innerHTML += `<option value="${d.id}">${d.data().name}</option>`; });
}

function playNotification() {
    const audio = document.getElementById('order-sound');
    audio.play().catch(e => console.log('Audio blocked', e));
    document.getElementById('new-order-alert').classList.remove('hidden');
}

function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = 'bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm mb-2 animate-bounce flex items-center gap-2';
    el.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-circle text-red-400' : 'fa-check-circle text-green-400'}"></i> ${msg}`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

function isToday(date) {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

function getDaysDifference(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const diff = today - target;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getLast7DaysLabels() {
    const days = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
    const labels = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(days[d.getDay()]);
    }
    return labels;
}

// --- Image Upload Logic (ImgBB) ---
async function uploadImageToImgBB(file) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', "ac296feb5a275923598bdbfd4f9aed8c"); // User provided key

    // Show loader
    const loader = document.getElementById('upload-loader');
    if (loader) loader.classList.remove('hidden');

    try {
        const response = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
        if (!response.ok) throw new Error(`ImgBB upload failed with status ${response.status}`);
        const result = await response.json();

        if (result.success) {
            return result.data.url;
        } else {
            throw new Error(`ImgBB Error: ${result.error.message}`);
        }
    } finally {
        if (loader) loader.classList.add('hidden');
    }
}

// Setup File Input Listener
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('prod-image-file');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Preview
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('img-preview').src = e.target.result;
                document.getElementById('img-preview').classList.remove('hidden');
                document.getElementById('img-placeholder').classList.add('hidden');
            };
            reader.readAsDataURL(file);

            // Upload
            try {
                const url = await uploadImageToImgBB(file);
                document.getElementById('prod-image-url').value = url;
                showToast('تم رفع الصورة بنجاح');
            } catch (err) {
                console.error(err);
                showToast('فشل رفع الصورة: ' + err.message, 'error');
                // Reset
                fileInput.value = '';
                document.getElementById('img-preview').classList.add('hidden');
                document.getElementById('img-placeholder').classList.remove('hidden');
            }
        });
    }

    // Check if we need to render store link on load (moved here to ensure DOM is ready)
});


// --- Store Link Logic ---
window.copyStoreLink = () => {
    const link = `https://${window.location.hostname}/vendor.html?id=${currentUser.uid}`;
    navigator.clipboard.writeText(link).then(() => {
        showToast('تم نسخ رابط المتجر');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        prompt("نسخ الرابط يدوياً:", link);
    });
};

function renderStoreLink() {
    // Determine base URL (handle local dev vs production)
    const baseUrl = window.location.origin + window.location.pathname.replace('seller-dashboard.html', 'vendor.html');
    const link = `${baseUrl}?id=${currentUser.uid}`;

    const displayEl = document.getElementById('store-link-display');
    if (displayEl) displayEl.textContent = link.replace('https://', '').replace('http://', '');
}


// --- Delivery Pricing Logic ---
const WILAYAS = [
    { id: 1, name: "أدرار" }, { id: 2, name: "الشلف" }, { id: 3, name: "الأغواط" }, { id: 4, name: "أم البواقي" }, { id: 5, name: "باتنة" },
    { id: 6, name: "بجاية" }, { id: 7, name: "بسكرة" }, { id: 8, name: "بشار" }, { id: 9, name: "البليدة" }, { id: 10, name: "البويرة" },
    { id: 11, name: "تمنراست" }, { id: 12, name: "تبسة" }, { id: 13, name: "تلمسان" }, { id: 14, name: "تيارت" }, { id: 15, name: "تيزي وزو" },
    { id: 16, name: "الجزائر" }, { id: 17, name: "الجلفة" }, { id: 18, name: "جيجل" }, { id: 19, name: "سطيف" }, { id: 20, name: "سعيدة" },
    { id: 21, name: "سكيكدة" }, { id: 22, name: "سيدي بلعباس" }, { id: 23, name: "عنابة" }, { id: 24, name: "قالمة" }, { id: 25, name: "قسنطينة" },
    { id: 26, name: "المدية" }, { id: 27, name: "مستغانم" }, { id: 28, name: "المسيلة" }, { id: 29, name: "معسكر" }, { id: 30, name: "ورقلة" },
    { id: 31, name: "وهران" }, { id: 32, name: "البيض" }, { id: 33, name: "إليزي" }, { id: 34, name: "برج بوعريريج" }, { id: 35, name: "بومرداس" },
    { id: 36, name: "الطرف" }, { id: 37, name: "تندوف" }, { id: 38, name: "تيسمسيلت" }, { id: 39, name: "الوادي" }, { id: 40, name: "خنشلة" },
    { id: 41, name: "سوق أهراس" }, { id: 42, name: "تيبازة" }, { id: 43, name: "ميلة" }, { id: 44, name: "عين الدفلى" }, { id: 45, name: "النعامة" },
    { id: 46, name: "عين تموشنت" }, { id: 47, name: "غرداية" }, { id: 48, name: "غليزان" }, { id: 49, name: "تيميمون" }, { id: 50, name: "برج باجي مختار" },
    { id: 51, name: "أولاد جلال" }, { id: 52, name: "بني عباس" }, { id: 53, name: "عين صالح" }, { id: 54, name: "عين قزام" }, { id: 55, name: "تقرت" },
    { id: 56, name: "جانت" }, { id: 57, name: "المغير" }, { id: 58, name: "المنيعة" }
];

let deliveryRates = {}; // Store rates here

window.openDeliveryModal = async () => {
    document.getElementById('delivery-modal').classList.add('active');

    // Fetch current rates if not loaded (or rely on loaded user data)
    // For now assuming we pass data or fetch it fresh
    if (currentUser) {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
            deliveryRates = snap.data().deliveryRates || {};
        }
    }

    renderWilayaList();
};

window.closeDeliveryModal = () => document.getElementById('delivery-modal').classList.remove('active');

function renderWilayaList() {
    const list = document.getElementById('wilaya-list');
    list.innerHTML = '';

    const search = document.getElementById('wilaya-search').value.toLowerCase();

    WILAYAS.forEach(w => {
        if (!w.name.includes(search)) return;

        const rates = deliveryRates[w.id] || { home: 0, desk: 0 };

        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-200 transition';
        item.innerHTML = `
            <div class="font-bold text-gray-700 w-1/3">${w.id}. ${w.name}</div>
            <div class="flex gap-2 w-2/3">
                <div class="flex-1">
                    <label class="text-[10px] text-gray-500 block">توصيل للمنزل</label>
                    <input type="number" value="${rates.home || ''}" placeholder="0" 
                        onchange="updateRate(${w.id}, 'home', this.value)"
                        class="w-full p-1 text-sm border rounded">
                </div>
                <div class="flex-1">
                    <label class="text-[10px] text-gray-500 block">توصيل للمكتب</label>
                    <input type="number" value="${rates.desk || ''}" placeholder="0" 
                         onchange="updateRate(${w.id}, 'desk', this.value)"
                        class="w-full p-1 text-sm border rounded">
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

window.updateRate = (wid, type, value) => {
    if (!deliveryRates[wid]) deliveryRates[wid] = {};
    deliveryRates[wid][type] = parseFloat(value);
};

window.saveDeliveryRates = async () => {
    const btn = document.querySelector('#delivery-modal button.bg-indigo-600');
    btn.textContent = 'جاري الحفظ...'; btn.disabled = true;

    try {
        await updateDoc(doc(db, "users", currentUser.uid), {
            deliveryRates: deliveryRates
        });
        showToast('تم حفظ أسعار التوصيل');
        closeDeliveryModal();
    } catch (e) {
        console.error(e);
        showToast('حدث خطأ أثناء الحفظ', 'error');
    } finally {
        btn.textContent = 'حفظ الأسعار'; btn.disabled = false;
    }
};

document.getElementById('wilaya-search').addEventListener('input', renderWilayaList);

// --- Restaurant Features: Offers & Add-ons ---

let offersCache = [];

function loadOffers() {
    const q = query(collection(db, "offers"), where("sellerId", "==", currentUser.uid));
    onSnapshot(q, (snapshot) => {
        offersCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderOffers();
    });
}

function renderOffers() {
    const grid = document.getElementById('offers-grid');
    grid.innerHTML = '';

    offersCache.forEach(offer => {
        const el = document.createElement('div');
        el.className = "bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex gap-4 relative group";
        el.innerHTML = `
            <img src="${offer.imageUrl || 'https://placehold.co/100'}" class="w-20 h-20 object-cover rounded-lg">
            <div class="flex-1">
                <h3 class="font-bold text-gray-800">${offer.title}</h3>
                <p class="text-xs text-gray-500 line-clamp-2">${offer.description}</p>
                <div class="flex items-center gap-2 mt-2">
                    <span class="text-green-600 font-bold">${offer.price} د.ج</span>
                    ${offer.originalPrice ? `<span class="text-red-400 line-through text-xs">${offer.originalPrice}</span>` : ''}
                </div>
            </div>
            <button onclick="deleteOffer('${offer.id}')" class="absolute top-2 left-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"><i class="fas fa-trash"></i></button>
        `;
        grid.appendChild(el);
    });
}

window.openOfferModal = () => {
    document.getElementById('offer-form').reset();
    document.getElementById('offer-id').value = '';
    document.getElementById('offer-modal').classList.add('active');
};

window.closeOfferModal = () => {
    document.getElementById('offer-modal').classList.remove('active');
};

document.getElementById('offer-image-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = await uploadImageToImgBB(file);
        if (url) {
            document.getElementById('offer-image-url').value = url;
            showToast('تم رفع الصورة بنجاح');
        }
    }
});

document.getElementById('offer-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('offer-id').value;
    const data = {
        sellerId: currentUser.uid,
        title: document.getElementById('offer-title').value,
        description: document.getElementById('offer-desc').value,
        price: Number(document.getElementById('offer-price').value),
        originalPrice: document.getElementById('offer-original-price').value ? Number(document.getElementById('offer-original-price').value) : null,
        imageUrl: document.getElementById('offer-image-url').value,
        createdAt: serverTimestamp()
    };

    try {
        if (id) {
            await updateDoc(doc(db, "offers", id), data);
            showToast("تم تحديث العرض");
        } else {
            await addDoc(collection(db, "offers"), data);
            showToast("تم إضافة العرض");
        }
        closeOfferModal();
    } catch (err) {
        console.error(err);
        showToast("خطأ في الحفظ", "error");
    }
});

window.deleteOffer = async (id) => {
    if (confirm("هل أنت متأكد من حذف هذا العرض؟")) {
        await deleteDoc(doc(db, "offers", id));
        showToast("تم الحذف");
    }
};

// Add-ons Logic
window.addAddonItem = (name = '', price = '') => {
    const container = document.getElementById('addons-list');
    const div = document.createElement('div');
    div.className = "flex gap-2 items-center addon-item";
    div.innerHTML = `
        <input type="text" placeholder="اسم الإضافة" value="${name}" class="flex-1 p-2 border rounded text-sm addon-name">
        <input type="number" placeholder="سعر" value="${price}" class="w-24 p-2 border rounded text-sm addon-price">
        <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(div);

    // Clear inputs if adding new
    if (!name && !price) {
        document.getElementById('new-addon-name').value = '';
        document.getElementById('new-addon-price').value = '';
    }
}
};

// --- AI Description Logic ✨ ---
window.generateAIDescription = () => {
    const name = document.getElementById('prod-name').value;
    const price = document.getElementById('prod-price').value;
    const catSelect = document.getElementById('prod-category');
    const category = catSelect.options[catSelect.selectedIndex]?.text || 'المنتج';

    if (!name) return showToast('يرجى كتابة اسم المنتج أولاً ⚠️', 'error');

    const btn = document.querySelector('button[onclick="window.generateAIDescription()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الكتابة...';
    btn.disabled = true;

    // Simulate AI Delay
    setTimeout(() => {
        const descriptions = [
            `<p>استمتع بأفضل تجربة مع <strong>${name}</strong>. منتج رائع يجمع بين الجودة والأداء المتميز. مثالي لـ ${category}، ويأتي بسعر مميز <span style="color:green;font-weight:bold">${price} د.ج</span> فقط! اطلبه الآن قبل نفاذ الكمية.</p>`,
            `<p>هل تبحث عن ${category} مميز؟ <strong>${name}</strong> هو الخيار الأمثل لك! تصميم عصري وجودة عالية تضمن لك الرضا التام. احصل عليه اليوم بسعر ${price} د.ج.</p>`,
            `<p>لا تفوت فرصة اقتناء <strong>${name}</strong>. يعتبر من أفضل ما قدمنا في قسم ${category}. جودة تستحق الثقة وتوصيل سريع لباب منزلك. 🚚</p>`
        ];

        const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];

        if (quill) {
            quill.root.innerHTML = randomDesc;
        } else {
            // Fallback
        }
        showToast('✨ تم توليد الوصف بنجاح');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }, 1500);
};

