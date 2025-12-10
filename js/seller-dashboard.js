
import { initializedApp, auth, db, doc, getDoc, updateDoc, onSnapshot, query, collection, where, orderBy, serverTimestamp, addDoc, deleteDoc, getDocs } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

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

                    // Navigation Logic
                    setupNavigation();

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
        imageUrls: [document.getElementById('prod-image').value],
        availability: document.getElementById('prod-available').checked ? 'available' : 'sold_out',
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
    document.getElementById('prod-image').value = p.imageUrls?.[0] || '';
    document.getElementById('prod-available').checked = p.availability !== 'sold_out';
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
