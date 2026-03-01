// ============================================================
// 🔧 EBD Conecta - Service Worker
// Versão: 1.0.0
// ============================================================

const CACHE_NAME = 'ebd-conecta-v1';

// Arquivos para cache offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap'
];

// ── Instalação: pré-carrega arquivos no cache ────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pré-cacheando arquivos...');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('[SW] Falha ao cachear alguns arquivos:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Ativação: remove caches antigos ─────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Removendo cache antigo:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// ── Fetch: Cache-first para assets, Network-first para API ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requests que não são GET
  if (request.method !== 'GET') return;

  // Estratégia: Network first com fallback para cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Salva cópia no cache se for resposta válida
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Se offline, tenta servir do cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // Fallback para a index.html em caso de navegação
          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// ── Mensagens do cliente ─────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] EBD Conecta Service Worker registrado!');
