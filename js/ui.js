// Helpers de UI: escape, iconos, imágenes cifradas, galerías, lightbox, hojas, toasts, copiar.
import { assetUrl } from './crypto.js';

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ───── Iconos (trazos estilo Lucide, ISC) ─────
const P = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
  wallet: '<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  nav: '<path d="m3 11 19-9-9 19-2-8-8-2z"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  bed: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
  bus: '<path d="M8 6v6M15 6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>',
  boat: '<path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.4 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.9 5.3 2.8 7.8"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6M12 10v4M12 2v3"/>',
  van: '<path d="M14 17h-4M3 17H2v-6l2-5h10v11M14 9h4l4 4v4h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z"/><path d="M12 9v4M12 17h.01"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  food: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  list: '<path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8"/>',
  bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  taxi: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-3.6A2 2 0 0 0 13.7 6H6.3a2 2 0 0 0-1.6.8L2 10.5V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  swap: '<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  bag: '<path d="M6 20h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2zM9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9 11v5M15 11v5"/>',
  hospital: '<path d="M12 6v4M14 14h-4M14 18h-4M14 8h-4"/><path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"/><path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7l10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
  whatsapp: '<path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.5L3 21z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.5-1.5-1-2-2l1-1-1-2L9 9.5z"/>',
  wifiOff: '<path d="M12 20h.01M8.5 16.4a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8a15 15 0 0 0-11.3-3.6M5 12.9a10 10 0 0 1 5.2-2.7M19 12.9a10 10 0 0 0-2.1-1.5M2 2l20 20"/>',
  ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
};
export const icon = (name, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] ?? ''}</svg>`;

// ───── Toast / copiar ─────
let toastT;
export function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('show'), 2200);
}
export async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  navigator.vibrate?.(15);
  toast(`Copiado: ${text}`);
}

// ───── Enlaces externos ─────
export const mapsUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
export const telUrl = (p) => `tel:${String(p).replace(/[^\d+]/g, '')}`;
export const waUrl = (p) => `https://wa.me/${String(p).replace(/\D/g, '')}`;

// ───── Imágenes cifradas ─────
export function img(ref, { thumb = false, cls = '', alt = '' } = {}) {
  if (!ref) return `<div class="img ${cls}"></div>`;
  return `<div class="img ${cls}"><img data-a="${thumb ? ref.t : ref.f}" data-m="${ref.m ?? 'image/webp'}" alt="${esc(alt)}" decoding="async"></div>`;
}

const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      // Una tira de galería entera: carga todas sus miniaturas de una vez (evita huecos al deslizar)
      if (e.target.classList.contains('gal-strip')) e.target.querySelectorAll('img[data-a]:not([src])').forEach(loadImg);
      else loadImg(e.target);
    }
  }, { rootMargin: '400px 400px' })
  : null;

function loadImg(el) {
  assetUrl(el.dataset.a, el.dataset.m).then((u) => {
    el.src = u;
    el.onload = () => el.classList.add('ok');
  }).catch(() => { el.closest('.img')?.classList.add('err'); window.dispatchEvent(new Event('asset-error')); });
}

// ───── Galerías ─────
let GALERIAS = {};
export const setGalerias = (g) => { GALERIAS = g; };

function galleryHtml(id) {
  const groups = GALERIAS[id];
  if (!groups) return '';
  let idx = 0;
  return groups.map((g) => {
    const single = g.fotos.length === 1 && groups.length === 1;
    const items = g.fotos.map((f) => {
      const ar = f.w && f.h ? f.w / f.h : 1;
      const style = single ? `aspect-ratio:${ar}` : `width:${Math.round(168 * ar)}px`;
      return `<button type="button" class="${single ? 'single' : ''}" style="${style}" data-lb="${id}" data-i="${idx++}" aria-label="Ver foto">${img(f, { thumb: !single })}</button>`;
    }).join('');
    return `<div class="gal-group">${g.caption ? `<div class="gal-cap">${esc(g.caption)}</div>` : ''}<div class="gal-strip">${items}</div></div>`;
  }).join('');
}

// ───── Documentos PDF (marcador <!-- pdf: … --> en los .md y PDFs del seguro) ─────
export const docItem = (id, d) => `<a href="#/pdf/${esc(id)}"><div class="ico-tile red">${icon('file')}</div><div class="grow"><div class="t">${esc(d.titulo)}</div><div class="s">PDF · ${(d.bytes / 1e6).toFixed(1)} MB · disponible sin conexión</div></div><span class="chev">${icon('right')}</span></a>`;

/** Hidrata un contenedor: galerías, documentos, imágenes perezosas, importes THB. */
export function hydrate(root, ctx) {
  $$('.gal[data-gal]', root).forEach((g) => { if (!g.childElementCount) g.innerHTML = galleryHtml(g.dataset.gal); });
  $$('.doc[data-doc]', root).forEach((el) => {
    const d = ctx?.data.docs?.[el.dataset.doc];
    if (d && !el.childElementCount) { el.classList.add('list'); el.innerHTML = docItem(el.dataset.doc, d); }
  });
  $$('.gal-strip', root).forEach((st) => (io ? io.observe(st) : st.querySelectorAll('img[data-a]').forEach(loadImg)));
  $$('img[data-a]:not([src])', root).filter((el) => !el.closest('.gal-strip')).forEach((el) => (io ? io.observe(el) : loadImg(el)));
  if (ctx) markThb(root);
}

function markThb(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (/\d\s*THB/.test(n.nodeValue) && !n.parentElement.closest('.thb,button,a,input,textarea,.nothb') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes) {
    const span = document.createElement('span');
    span.innerHTML = esc(n.nodeValue).replace(/(\d[\d.,]*)(\s*[–-]\s*(\d[\d.,]*))?\s*THB/g, (m, a, _r, b) => {
      const v = (s) => parseFloat(s.replace(/\./g, '').replace(',', '.'));
      return `<span class="thb" data-thb="${v(a)}${b ? `-${v(b)}` : ''}">${m}</span>`;
    });
    n.replaceWith(...span.childNodes);
  }
}

// ───── Lightbox con zoom ─────
export function openLightbox(galId, start) {
  const fotos = (GALERIAS[galId] ?? []).flatMap((g) => g.fotos.map((f) => ({ ...f, caption: g.caption })));
  if (!fotos.length) return;
  const el = document.createElement('div');
  el.className = 'lightbox';
  el.innerHTML = `
    <div class="lb-top"><button class="icon-btn" data-close aria-label="Cerrar">${icon('x', 'lg')}</button><span class="lb-count"></span><span style="width:44px"></span></div>
    <div class="lb-track">${fotos.map((f) => `<div class="lb-slide"><img data-a="${f.f}" data-m="${f.m ?? 'image/webp'}" alt=""></div>`).join('')}</div>
    <div class="lb-cap"></div>`;
  document.body.append(el);
  const track = $('.lb-track', el);
  const count = $('.lb-count', el);
  const cap = $('.lb-cap', el);
  const slides = $$('.lb-slide', el);
  let cur = start;
  const show = (i) => {
    cur = i;
    count.textContent = `${i + 1} / ${fotos.length}`;
    cap.textContent = fotos[i].caption ?? '';
    cap.hidden = !fotos[i].caption;
    for (const j of [i - 1, i, i + 1]) {
      const im = slides[j]?.querySelector('img:not([src])');
      if (im) loadImg(im);
    }
  };
  requestAnimationFrame(() => { track.scrollLeft = start * track.clientWidth; show(start); });
  track.addEventListener('scroll', () => {
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== cur) { resetZoom(slides[cur]); show(i); }
  }, { passive: true });
  const close = () => { el.remove(); window.removeEventListener('popstate', onPop); };
  const onPop = () => close();
  history.pushState({ lb: 1 }, '');
  window.addEventListener('popstate', onPop);
  $('[data-close]', el).onclick = () => history.back();
  slides.forEach(attachZoom);
}

function resetZoom(slide) {
  if (!slide) return;
  slide._z = { s: 1, x: 0, y: 0 };
  slide.classList.remove('zoomed');
  const im = slide.querySelector('img');
  if (im) im.style.transform = '';
}
function attachZoom(slide) {
  const im = slide.querySelector('img');
  im.style.transformOrigin = '0 0';
  slide._z = { s: 1, x: 0, y: 0 };
  const pts = new Map();
  let g = null; // gesto en curso
  let lastTap = 0;
  const apply = () => {
    const z = slide._z;
    im.style.transform = `translate(${z.x}px, ${z.y}px) scale(${z.s})`;
    slide.classList.toggle('zoomed', z.s > 1.01);
  };
  const mid = () => {
    const a = [...pts.values()];
    return a.length > 1 ? { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2, d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) } : { x: a[0].x, y: a[0].y, d: 0 };
  };
  // Con origen 0,0: pantalla = base + z.x + p * z.s  →  p = (pantalla - base - z.x) / z.s
  const begin = () => {
    const z = slide._z;
    const r = im.getBoundingClientRect();
    const c = mid();
    const bx = r.left - z.x;
    const by = r.top - z.y;
    g = { bx, by, s0: z.s, d0: c.d, px: (c.x - bx - z.x) / z.s, py: (c.y - by - z.y) / z.s, cx: c.x, cy: c.y, x0: z.x, y0: z.y };
  };
  slide.addEventListener('pointerdown', (e) => {
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) {
      const t = Date.now();
      if (t - lastTap < 280) {
        lastTap = 0;
        const z = slide._z;
        if (z.s > 1.01) { resetZoom(slide); return; }
        begin();
        z.s = 2.5;
        z.x = e.clientX - g.bx - g.px * z.s;
        z.y = e.clientY - g.by - g.py * z.s;
        apply();
        return;
      }
      lastTap = t;
    }
    begin();
    if (slide._z.s > 1.01 || pts.size > 1) slide.setPointerCapture(e.pointerId);
  });
  slide.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId) || !g) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const z = slide._z;
    const c = mid();
    if (pts.size > 1 && g.d0) {
      z.s = Math.min(5, Math.max(1, g.s0 * (c.d / g.d0)));
      z.x = c.x - g.bx - g.px * z.s;
      z.y = c.y - g.by - g.py * z.s;
      apply();
    } else if (z.s > 1.01) {
      z.x = g.x0 + (c.x - g.cx);
      z.y = g.y0 + (c.y - g.cy);
      apply();
    }
  });
  const end = (e) => {
    pts.delete(e.pointerId);
    if (slide._z.s <= 1.01) resetZoom(slide);
    if (pts.size) begin(); else g = null;
  };
  slide.addEventListener('pointerup', end);
  slide.addEventListener('pointercancel', end);
}

// ───── Hoja inferior (bottom sheet) ─────
export function sheet(html, mount) {
  const bd = document.createElement('div');
  bd.className = 'sheet-backdrop';
  const sh = document.createElement('div');
  sh.className = 'sheet';
  sh.innerHTML = `<div class="grab"></div>${html}`;
  document.body.append(bd, sh);
  let closed = false;
  const close = (fromPop = false) => {
    if (closed) return;
    closed = true;
    bd.remove();
    sh.remove();
    window.removeEventListener('popstate', onPop);
    if (!fromPop) history.back();
  };
  const onPop = () => close(true);
  history.pushState({ sheet: 1 }, '');
  window.addEventListener('popstate', onPop);
  bd.onclick = () => close();
  mount?.(sh, close);
  return close;
}

/** Pantalla completa "mostrar al taxista". */
export function showTaxi(thai, latin) {
  const el = document.createElement('div');
  el.className = 'taxi';
  el.innerHTML = `<div class="row between"><span class="hint">Muestra esta pantalla al conductor</span><button class="icon-btn" style="color:#000" aria-label="Cerrar">${icon('x', 'lg')}</button></div>
    <div class="thai" lang="th">${esc(thai)}</div><div class="latin">${esc(latin)}</div>
    <div class="hint">⚠️ Dirección en tailandés generada para el viaje: verifícala con el alojamiento.</div>`;
  document.body.append(el);
  const close = () => { el.remove(); window.removeEventListener('popstate', onPop); };
  const onPop = () => close();
  history.pushState({ taxi: 1 }, '');
  window.addEventListener('popstate', onPop);
  el.querySelector('button').onclick = () => history.back();
}

// ───── Formato ─────
export const nf = (n, d = 0) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);
export const thb = (n) => `${nf(Math.round(n))} THB`;
export const eur = (n, d = 2) => `${nf(n, d)} €`;
