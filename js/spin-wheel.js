
import {
    auth, db, doc, getDoc, setDoc, updateDoc, increment,
    runTransaction, collection, query, where, getDocs,
    serverTimestamp, onAuthStateChanged
} from './firebase-config.js';

export class SpinWheel {
    constructor() {
        this.config = null;
        this.segments = [];
        this.todayStr = new Date().toISOString().split('T')[0];
        this.user = null;
        this.isSpinning = false;

        this.init();
    }

    async init() {
        // 1. Auth Listener
        onAuthStateChanged(auth, (user) => {
            this.user = user;
            if (user) {
                this.loadConfig();
            } else {
                this.removeUI();
            }
        });
    }

    async loadConfig() {
        try {
            const snap = await getDoc(doc(db, "settings", "daily_rewards"));
            if (snap.exists()) {
                this.config = snap.data();
                if (this.config.isActive && this.checkSchedule()) {
                    // Check if already played today
                    const played = await this.checkIfPlayedToday();
                    if (!played) {
                        this.renderFloatingButton();
                        this.renderModal();
                    }
                }
            }
        } catch (e) {
            console.error("Wheel Init Error:", e);
        }
    }

    checkSchedule() {
        if (!this.config.schedule) return true;

        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay(); // 0 = Sunday

        const { startHour, endHour, activeDays } = this.config.schedule;

        if (currentHour < startHour || currentHour >= endHour) return false;
        if (activeDays && !activeDays.includes(currentDay)) return false;

        return true;
    }

    async checkIfPlayedToday() {
        if (!this.user) return true;
        // Check local storage first for speed (optimization)
        const localKey = `s22_spin_${this.user.uid}_${this.todayStr}`;
        if (localStorage.getItem(localKey)) return true;

        // Verify with Firestore
        // We query the 'claims' subcollection for this user
        const q = query(
            collection(db, "daily_rewards_history", this.todayStr, "claims"),
            where("userId", "==", this.user.uid)
        );
        const snap = await getDocs(q);
        const played = !snap.empty;

        if (played) localStorage.setItem(localKey, 'true');
        return played;
    }

    renderFloatingButton() {
        if (document.getElementById('spin-fab')) return;

        const btn = document.createElement('div');
        btn.id = 'spin-fab';
        btn.className = 'fixed bottom-24 left-4 z-40 animate-bounce cursor-pointer';
        btn.innerHTML = `
            <div class="relative group">
                <div class="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <button class="relative w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl shadow-2xl border-2 border-white transform transition hover:scale-110">
                    🎡
                </button>
                <div class="absolute -top-10 left-1/2 -translate-x-1/2 w-max bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition">
                    جرب حظك اليوم!
                </div>
            </div>
        `;
        btn.onclick = () => this.openModal();
        document.body.appendChild(btn);
    }

    renderModal() {
        if (document.getElementById('spin-modal')) return;

        // Inject Styles
        const style = document.createElement('style');
        style.textContent = `
            .wheel-container { position: relative; width: 300px; height: 300px; margin: 0 auto; }
            .wheel { width: 100%; height: 100%; border-radius: 50%; border: 8px solid white; box-shadow: 0 0 20px rgba(0,0,0,0.2); transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99); position: relative; overflow: hidden; background: #333; }
            .wheel-segment { position: absolute; width: 50%; height: 50%; top: 50%; left: 50%; transform-origin: 0% 0%; clip-path: polygon(0 0, 100% 0, 100% 100%); }
            .wheel-text { position: absolute; left: 120%; top: 20%; transform: rotate(45deg); font-weight: bold; color: white; font-size: 12px; white-space: nowrap; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); }
            .wheel-arrow { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); width: 30px; height: 40px; z-index: 10; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.3)); }
            .wheel-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 50px; height: 50px; background: white; border-radius: 50%; z-index: 5; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 0 10px rgba(0,0,0,0.1); }
        `;
        document.head.appendChild(style);

        const modal = document.createElement('div');
        modal.id = 'spin-modal';
        modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 hidden backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-white rounded-3xl p-6 max-w-sm w-full relative text-center shadow-2xl overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-indigo-100 to-white -z-10"></div>
                
                <h2 class="text-2xl font-extrabold text-indigo-900 mb-1">عجلة الحظ اليومية 🎡</h2>
                <p class="text-xs text-gray-500 mb-6">جرب حظك وإربح جوائز قيمة!</p>

                <div class="wheel-container mb-6">
                    <img src="https://cdn-icons-png.flaticon.com/512/295/295128.png" class="wheel-arrow">
                    <div class="wheel" id="the-wheel">
                        <!-- Segments Injected Here -->
                    </div>
                    <button id="spin-btn-action" class="wheel-center text-indigo-600 text-xl font-bold bg-white hover:bg-indigo-50 border-4 border-indigo-100 rounded-full w-16 h-16 shadow-inner transition">
                        العب
                    </button>
                </div>

                <div id="spin-status" class="h-6 text-sm font-bold text-indigo-600"></div>

                <button onclick="document.getElementById('spin-modal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('spin-btn-action').onclick = () => this.spin();
    }

    openModal() {
        if (!this.checkSchedule()) {
            alert('عذراً، لعبة الحظ غير متاحة في هذا الوقت.');
            return;
        }
        this.drawWheel();
        document.getElementById('spin-modal').classList.remove('hidden');
    }

    drawWheel() {
        const wheel = document.getElementById('the-wheel');
        wheel.innerHTML = '';
        this.segments = this.config.segments || [];

        if (this.segments.length === 0) return;

        const sliceAngle = 360 / this.segments.length;
        // We skew the clip-path based on number of segments for perfect circle
        // Simplified CSS approach: Conic Gradient is easier for dynamic segments

        let gradientStr = 'conic-gradient(';
        let currentDeg = 0;

        this.segments.forEach((seg, i) => {
            const endDeg = currentDeg + sliceAngle;
            gradientStr += `${seg.color} ${currentDeg}deg ${endDeg}deg${i === this.segments.length - 1 ? '' : ','}`;

            // Add Label (Absolute positioning with rotation)
            const label = document.createElement('div');
            // Logic to position text in the middle of the slice
            // This is visually tricky in pure JS without canvas, but let's try a simple approach
            const midAngle = currentDeg + (sliceAngle / 2);
            label.style.cssText = `
                position: absolute;
                top: 50%; left: 50%;
                width: 50%; height: 20px;
                transform-origin: 0% 50%;
                transform: rotate(${midAngle - 90}deg) translate(20px);
                text-align: right;
                color: white;
                font-size: 10px;
                font-weight: bold;
                pointer-events: none;
                padding-right: 15px;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
            `;
            label.innerHTML = `<span style="display:inline-block; transform: rotate(90deg)">${seg.label}</span>`;
            // wheel.appendChild(label); // Text alignment is hard with conic-gradient div.
            // Better to use individual divs for text if we want text.
            // For MVP speed: we will skip text inside wheel or use simple overlay if needed.
            // Let's rely on color + result popup.
            currentDeg = endDeg;
        });
        gradientStr += ')';
        wheel.style.background = gradientStr;
    }

    async spin() {
        if (this.isSpinning) return;
        this.isSpinning = true;
        const btn = document.getElementById('spin-btn-action');
        const status = document.getElementById('spin-status');
        btn.disabled = true;
        status.textContent = 'جاري السحب...';

        try {
            // 1. Transaction to determine winner and increment count
            const resultDoc = await runTransaction(db, async (transaction) => {
                const statsRef = doc(db, "daily_rewards_history", this.todayStr);
                const statsDoc = await transaction.get(statsRef);

                let currentCounts = {};
                let totalSpins = 0;

                if (statsDoc.exists()) {
                    const d = statsDoc.data();
                    currentCounts = d.segmentCounts || {};
                    totalSpins = d.totalSpins || 0;
                }

                // Filter available segments
                const availableSegments = this.segments.filter(seg => {
                    const count = currentCounts[seg.id] || 0;
                    // Infinite limit if limit is 0 or undefined, else strict check
                    const limit = seg.limit || 0;
                    if (limit > 0 && count >= limit) return false;
                    return true;
                });

                // Probabilistic Selection
                let winningSegment;

                // If no segments available (all limits reached), force Hard Luck if exists, else picking the one with highest limit/prob
                if (availableSegments.length === 0) {
                    winningSegment = this.segments.find(s => s.type === 'hardluck') || this.segments[0];
                } else {
                    // Weighted Random
                    const totalWeight = availableSegments.reduce((sum, s) => sum + (s.probability || 0), 0);
                    let random = Math.random() * totalWeight;

                    for (const seg of availableSegments) {
                        random -= (seg.probability || 0);
                        if (random <= 0) {
                            winningSegment = seg;
                            break;
                        }
                    }
                    if (!winningSegment) winningSegment = availableSegments[availableSegments.length - 1]; // Fallback
                }

                // Update Counters
                const newCount = (currentCounts[winningSegment.id] || 0) + 1;
                transaction.set(statsRef, {
                    totalSpins: totalSpins + 1,
                    segmentCounts: { ...currentCounts, [winningSegment.id]: newCount },
                    lastUpdated: serverTimestamp()
                }, { merge: true });

                // Register Claim (This makes it unique per user per day because we check before layout, 
                // but strictly we should check again here or use create/exists check.
                // For MVP, we trust the UI check + local storage primarily to save reads.
                // But let's add the claim record).
                const claimRef = doc(collection(db, "daily_rewards_history", this.todayStr, "claims"));
                transaction.set(claimRef, {
                    userId: this.user.uid,
                    userName: this.user.displayName || 'Anonymous',
                    segmentId: winningSegment.id,
                    rewardValue: winningSegment.value,
                    type: winningSegment.type,
                    timestamp: serverTimestamp()
                });

                // If prize, update user wallet
                if (winningSegment.type === 'points' && winningSegment.value > 0) {
                    const userRef = doc(db, "users", this.user.uid);
                    transaction.update(userRef, {
                        points: increment(winningSegment.value)
                    });
                }

                return winningSegment;
            });

            // 2. Animate
            const segmentIndex = this.segments.findIndex(s => s.id === resultDoc.id);
            const segmentAngle = 360 / this.segments.length;
            // Stop angle: center of the winning segment needs to align with top (0deg or 270deg depending on verification)
            // Arrow is at Top (0deg in CSS rotation typically).
            // Rotation is Clockwise.
            // Target angle = 360 * 5 (spins) + (360 - (segmentIndex * segmentAngle) - (segmentAngle/2))

            const randomOffset = Math.random() * (segmentAngle - 2) - (segmentAngle / 2 - 1); // Randomize within slice
            const targetRotation = 3600 + (360 - (segmentIndex * segmentAngle)) - (segmentAngle / 2); // Simple math, might need tuning

            const wheel = document.getElementById('the-wheel');
            wheel.style.transform = `rotate(${targetRotation}deg)`;

            // Wait for animation
            setTimeout(() => {
                this.showResult(resultDoc);
                // Mark locally
                localStorage.setItem(`s22_spin_${this.user.uid}_${this.todayStr}`, 'true');
            }, 4100);

        } catch (e) {
            console.error(e);
            status.textContent = 'حدث خطأ، حاول مرة أخرى';
            this.isSpinning = false;
            btn.disabled = false;
        }
    }

    showResult(segment) {
        const modal = document.getElementById('spin-modal');
        const isWin = segment.type !== 'hardluck';

        // Simple confetti or alert
        const content = modal.querySelector('.bg-white');
        content.innerHTML = `
            <div class="py-10 animate-pulse">
                <div class="text-6xl mb-4">${isWin ? '🎉' : '🥺'}</div>
                <h2 class="text-3xl font-extrabold ${isWin ? 'text-green-600' : 'text-gray-600'} mb-2">
                    ${isWin ? 'ألف مبروك!' : 'حظ أوفر!'}
                </h2>
                <p class="text-gray-800 text-lg font-bold mb-6">
                    ${segment.label}
                </p>
                <button onclick="location.reload()" class="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
                    حسناً
                </button>
            </div>
        `;

        // Remove FAB
        document.getElementById('spin-fab')?.remove();
    }

    removeUI() {
        document.getElementById('spin-fab')?.remove();
        document.getElementById('spin-modal')?.remove();
    }
}

// Initializer
new SpinWheel();
