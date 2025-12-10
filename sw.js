const CACHE_NAME = 's22-market-no-cache-products-v2';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/classproductindex.html',
  '/cart.html',
  '/profile.html',
  '/dashboard.html',
  '/s22marketfood.html',
  '/manifest.json',
  '/LOGO.jpg',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'
];

// 1. التثبيت: فرض التفعيل الفوري
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. التفعيل: حذف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. الجلب (Fetch)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // استراتيجية "الشبكة فقط" (Network Only) لملفات المنتجات والصور والبيانات
  // أي شيء يتعلق بفايربيس، الصور، أو المجلدات الديناميكية لا يتم تخزينه
  if (
    url.hostname.includes('googleapis') ||
    url.hostname.includes('firebase') ||
    url.href.includes('firestore') ||
    url.pathname.includes('/products/') || // افتراض لمسار محتمل
    url.href.includes('.jpg') ||          // عدم تخزين الصور الجديدة لتوفير المساحة وتجنب النسخ القديمة
    url.href.includes('.png') ||
    url.href.includes('.jpeg')
  ) {
    // استثناء: LOGO.jpg موجود في الـ ASSETS_TO_CACHE لذا نسمح به إذا كان مطابقاً تماماً
    if (!url.pathname.endsWith('/LOGO.jpg')) {
      return; // العودة للمتصفح (Network Direct)
    }
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // إذا نجح الاتصال، نحدث الكاش فقط للملفات الأساسية (HTML/CSS/JS)
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // تخزين نسخة فقط إذا كان الطلب من ضمن القائمة البيضاء (اختياري، أو نستخدم النهج السابق)
        // النهج السابق كان Network First عام. سنبقيه ولكن مع الاستثناءات الصارمة أعلاه.

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // نخزن فقط إذا كان الطلب http/https وليس chrome-extension
          if (event.request.url.startsWith('http')) {
            cache.put(event.request, responseClone);
          }
        });

        return response;
      })
      .catch(() => {
        // إذا فشل الإنترنت، فقط حينها استخدم الكاش
        return caches.match(event.request);
      })
  );
});
