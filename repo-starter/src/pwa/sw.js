// Service worker do Choque de Eras. A versão do cache é carimbada pelo build
// (hash do index.html), então cada deploy invalida o cache antigo sozinho.
const VERSION = '/*@VERSION@*/';
const CACHE = 'choque-' + VERSION;

// app shell — o jogo é self-contained, então cachear o HTML = jogo inteiro offline
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon-180.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts (cross-origin): stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE).then(async (c) => {
        const hit = await c.match(req);
        const net = fetch(req).then((r) => { c.put(req, r.clone()); return r; }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  // mesma origem: stale-while-revalidate. Serve o cache NA HORA (load instantâneo +
  // offline), e revalida em background — a próxima carga já pega o shell novo do
  // deploy (TDMV-7). Sem cache, espera a rede; se a rede falhar numa navegação,
  // cai no index cacheado (offline preservado). Só cacheia resposta ok (não polui
  // o cache com 404/5xx).
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.open(CACHE).then((c) => {
        const net = fetch(req)
          .then((r) => { if (r && r.ok) c.put(req, r.clone()); return r; })
          .catch(() => (req.mode === 'navigate' ? c.match('./index.html') : undefined));
        return c.match(req).then((hit) => hit || net);
      })
    );
  }
});
