const CACHE_NAME = 'wfs-cache-v2';
// キャッシュしたい自分のファイル（必要に応じて追加）
const urlsToCache = [
    './index.html',
    './manifest.json',
    './icon.png',
    './favicon.png' // 512x512のアイコンを使っている場合
];

// 1. インストール時にファイルをキャッシュする
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

// 2. 古いキャッシュの削除（アップデート時）
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    clients.claim(); // ← 正しい書き方
});

// 3. 通信（Fetch）の制御
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 【重要】FirebaseやGoogle Fonts、CDNなどの外部通信はキャッシュせず、常にネットから取得する
    if (url.origin !== location.origin || url.pathname.includes('firebase') || url.pathname.includes('googleapis') || url.pathname.includes('cdnjs') || url.pathname.includes('jsdelivr')) {
        return;
    }

    // 自分のファイル（index.html等）は、まずキャッシュを返しつつ、裏で最新版に更新する（Stale-While-Revalidate方式）
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                    });
                    return networkResponse;
                }).catch(() => {
                    // オフライン時のフォールバック（必要に応じて）
                });

                return cachedResponse || fetchPromise;
            })
    );
});