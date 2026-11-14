// Service worker. Todo se sirve desde caché (offline inmediato, también con el repo ya borrado → 404).
// - Cada versión precachea su shell completo (HTML/JS/CSS/meta.json) en install: shell y meta.json
//   siempre son coherentes entre sí. Las versiones nuevas llegan porque el navegador compara sw.js;
//   al activarse, la página recibe 'controllerchange' y se recarga.
// - Ficheros cifrados (d/*.bin, nombre = hash de contenido): los descarga la página a la caché DATA
//   con barra de progreso, reutilizando los de versiones anteriores; la página borra las cachés viejas.
const VERSION = 'a85805f703b1';
const SHELL = ["./","css/app.css","icons/apple-touch-icon.png","icons/favicon-32.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","index.html","js/crypto.js","js/gastos.js","js/main.js","js/model.js","js/offline.js","js/rate.js","js/time.js","js/ui.js","js/views/dinero.js","js/views/hoy.js","js/views/info.js","js/views/mas.js","js/views/parts.js","js/views/viaje.js","manifest.webmanifest","meta.json","robots.txt","vendor/leaflet/images/layers-2x.png","vendor/leaflet/images/layers.png","vendor/leaflet/images/marker-icon-2x.png","vendor/leaflet/images/marker-icon.png","vendor/leaflet/images/marker-shadow.png","vendor/leaflet/leaflet.css","vendor/leaflet/leaflet.js","vendor/pdfjs/pdf.min.mjs","vendor/pdfjs/pdf.worker.min.mjs","vendor/pdfjs/standard_fonts/FoxitDingbats.pfb","vendor/pdfjs/standard_fonts/FoxitFixed.pfb","vendor/pdfjs/standard_fonts/FoxitFixedBold.pfb","vendor/pdfjs/standard_fonts/FoxitFixedBoldItalic.pfb","vendor/pdfjs/standard_fonts/FoxitFixedItalic.pfb","vendor/pdfjs/standard_fonts/FoxitSerif.pfb","vendor/pdfjs/standard_fonts/FoxitSerifBold.pfb","vendor/pdfjs/standard_fonts/FoxitSerifBoldItalic.pfb","vendor/pdfjs/standard_fonts/FoxitSerifItalic.pfb","vendor/pdfjs/standard_fonts/FoxitSymbol.pfb","vendor/pdfjs/standard_fonts/LICENSE_FOXIT","vendor/pdfjs/standard_fonts/LICENSE_LIBERATION","vendor/pdfjs/standard_fonts/LiberationSans-Bold.ttf","vendor/pdfjs/standard_fonts/LiberationSans-BoldItalic.ttf","vendor/pdfjs/standard_fonts/LiberationSans-Italic.ttf","vendor/pdfjs/standard_fonts/LiberationSans-Regular.ttf"];
const SHELL_CACHE = `shell-${VERSION}`;
const DATA_CACHE = `data-${VERSION}`;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL_CACHE)
      .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('shell-') && k !== SHELL_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(req) {
  const hit = await caches.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok && new URL(req.url).pathname.includes('/d/')) {
    const copy = res.clone();
    caches.open(DATA_CACHE).then((c) => c.put(req, copy));
  }
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // teselas de mapa, tasa de cambio: red directa
  if (req.mode === 'navigate') {
    e.respondWith(caches.match(new URL('./', self.registration.scope).href).then((r) => r || fetch(req)));
    return;
  }
  e.respondWith(cacheFirst(req));
});
