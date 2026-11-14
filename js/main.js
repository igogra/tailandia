// Arranque: service worker → meta → desbloqueo → router.
import { unlockStored, unlock, setKey } from './crypto.js';
import { $, $$, esc, icon, hydrate, setGalerias, openLightbox, copy, toast, eur, nf } from './ui.js';
import { startOffline } from './offline.js';
import { derive } from './model.js';
import { getRate } from './rate.js';
import * as hoy from './views/hoy.js';
import * as viaje from './views/viaje.js';
import * as info from './views/info.js';
import * as dinero from './views/dinero.js';
import * as mas from './views/mas.js';

const TABS = [
  ['hoy', 'Hoy', 'sun'],
  ['viaje', 'Viaje', 'map'],
  ['dinero', 'Dinero', 'wallet'],
  ['info', 'Info', 'shield'],
  ['mas', 'Más', 'grid'],
];

const ROUTES = [
  [/^hoy$/, hoy.render],
  [/^viaje$/, viaje.list],
  [/^viaje\/([\w-]+)$/, viaje.base],
  [/^viaje\/([\w-]+)\/(\d+)$/, viaje.day],
  [/^mapa\/([\w-]+)(?:\/(\d+))?$/, viaje.mapa],
  [/^vuelo\/([\w-]+)$/, info.vuelo],
  [/^traslado\/([\w-]+)$/, info.traslado],
  [/^estancia\/([\w-]+)$/, info.estancia],
  [/^info$/, info.menu],
  [/^info\/vuelos$/, info.vuelos],
  [/^info\/alojamientos$/, info.alojamientos],
  [/^info\/seguro$/, info.seguro],
  [/^info\/emergencias$/, info.emergencias],
  [/^info\/equipaje$/, info.equipaje],
  [/^pdf\/([\w-]+)$/, info.pdf],
  [/^dinero$/, dinero.render],
  [/^mas$/, mas.menu],
  [/^mas\/comida$/, mas.comida],
  [/^mas\/frases$/, mas.frases],
  [/^mas\/checklist$/, mas.checklist],
  [/^mas\/consejos$/, mas.consejos],
  [/^mas\/ajustes$/, mas.ajustes],
];

const view = $('#view');
const topbar = $('#topbar');
const tabbar = $('#tabbar');
// El navegador no debe restaurar el scroll al ir atrás/adelante: lo controla el router
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
let ctx = null;
let cleanup = null;
let lastPath = null;

// ───── Service worker ─────
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW', e));
  // Se ha activado una versión nueva de la app: recargar para no mezclar versiones
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return; // primera instalación: nada que actualizar
    if (!ctx) reloadOnce(); // aún arrancando: recargar directamente
    else checkVersion();
  });
}

/** Si el meta.json del servidor es de otra versión que la cargada, recarga (como mucho una vez por versión). */
let checking = false;
async function checkVersion() {
  if (checking || !ctx) return;
  checking = true;
  try {
    const m = await fetch('meta.json', { cache: 'no-cache' }).then((r) => r.json());
    if (m.v !== ctx.meta.v) reloadOnce();
  } catch {} finally { checking = false; }
}
window.addEventListener('asset-error', checkVersion);
function reloadOnce() {
  const last = +sessionStorage.getItem('lastReload') || 0;
  if (Date.now() - last < 10000) return; // evita bucles de recarga
  sessionStorage.setItem('lastReload', String(Date.now()));
  location.reload();
}

// ───── Tema forzado (Ajustes) ─────
try {
  const th = localStorage.getItem('theme');
  if (th) document.documentElement.dataset.theme = th;
} catch {}

boot();

async function boot() {
  let meta;
  try {
    meta = await fetch('meta.json', { cache: 'no-cache' }).then((r) => r.json());
  } catch {
    view.innerHTML = `<div class="empty"><div class="big">📡</div><p>No se pudo cargar la app. Ábrela con conexión la primera vez.</p></div>`;
    return;
  }
  const opened = (await unlockStored(meta)) ?? (await lockScreen(meta));
  start(opened, meta);
}

function lockScreen(meta) {
  return new Promise((resolve) => {
    view.innerHTML = `
      <form class="lock" autocomplete="off">
        <img class="logo" src="icons/icon-192.png" alt="">
        <h1>Tailandia 2026</h1>
        <p>Introduce la contraseña del viaje. Solo se pide una vez en este dispositivo.</p>
        <input class="input" type="password" name="pw" placeholder="Contraseña" autocomplete="current-password" required>
        <div class="err" role="alert"></div>
        <button class="btn block" type="submit">${icon('lock')} Desbloquear</button>
      </form>`;
    const form = $('form', view);
    form.pw.focus();
    form.onsubmit = async (e) => {
      e.preventDefault();
      const btn = $('button', form);
      btn.disabled = true;
      btn.textContent = 'Descifrando…';
      $('.err', form).textContent = '';
      try {
        resolve(await unlock(form.pw.value, meta));
      } catch (err) {
        $('.err', form).textContent = err.message === 'Contraseña incorrecta' ? 'Contraseña incorrecta' : `Error: ${err.message}`;
        btn.disabled = false;
        btn.innerHTML = `${icon('lock')} Desbloquear`;
        form.pw.select();
      }
    };
  });
}

function start({ key, data }, meta) {
  setKey(key);
  setGalerias(data.galerias);
  derive(data);
  ctx = { data, meta, go: (h) => { location.hash = h; }, rerender: () => route(true) };
  window.__ctx = ctx; // depuración
  tabbar.innerHTML = TABS.map(([id, label, ic]) => `<a href="#/${id}" data-tab="${id}"><span class="pill">${icon(ic)}</span>${label}</a>`).join('');
  tabbar.hidden = false;
  startOffline(meta);
  getRate(data); // inicializa la tasa (guardada/BCE)
  window.addEventListener('hashchange', () => route());
  route();
  // Refresca la vista Hoy cada minuto
  setInterval(() => { if (currentPath().startsWith('hoy') && !document.hidden) route(true); }, 60000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    checkVersion();
    if (currentPath().startsWith('hoy')) route(true);
  });
  // Por si la versión nueva del SW se activó antes de escuchar 'controllerchange'
  checkVersion();
  setTimeout(checkVersion, 5000);
}

const currentPath = () => (location.hash.replace(/^#\/?/, '') || 'hoy');

function route(soft = false) {
  const full = currentPath();
  const [path, qs] = full.split('?');
  const params = new URLSearchParams(qs ?? '');
  let match = null;
  let fn = null;
  for (const [re, f] of ROUTES) {
    match = path.match(re);
    if (match) { fn = f; break; }
  }
  if (!fn) { location.replace('#/hoy'); return; }
  cleanup?.();
  cleanup = null;
  let v;
  try {
    v = fn(ctx, ...match.slice(1).map((x) => (x === undefined ? undefined : decodeURIComponent(x))), params);
  } catch (e) {
    console.error(e);
    v = { html: `<div class="empty"><div class="big">⚠️</div><p>Error al mostrar esta pantalla.</p><p class="small muted">${esc(e.message)}</p></div>`, title: 'Error', back: '#/hoy' };
  }
  const tab = path.split('/')[0];
  const tabId = v.tab ?? (['vuelo', 'traslado', 'estancia', 'pdf'].includes(tab) ? 'info' : tab === 'mapa' ? 'viaje' : tab);
  $$('a', tabbar).forEach((a) => (a.dataset.tab === tabId ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));

  if (v.title && !v.noTopbar) {
    topbar.hidden = false;
    topbar.innerHTML = `<button class="icon-btn" data-back aria-label="Atrás">${icon('left', 'lg')}</button><div class="title">${esc(v.title)}</div>${v.actions ?? ''}`;
    $('[data-back]', topbar).onclick = () => goBack(v.back);
  } else {
    topbar.hidden = true;
    topbar.innerHTML = '';
  }
  view.innerHTML = v.html;
  hydrate(view, ctx);
  cleanup = v.mount?.(view, ctx, params) ?? null;
  if (!soft) {
    // Pantalla nueva: siempre arriba del todo (salvo enlace a una actividad concreta con ?s=)
    const s = params.get('s');
    const el = s && document.getElementById(s);
    if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
    else window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }
  lastPath = full;
}

function goBack(fallback) {
  if (history.state?.inApp || history.length > 1) {
    const before = location.hash;
    history.back();
    // Si no había historial dentro de la app, ir al padre
    setTimeout(() => { if (location.hash === before && fallback) location.hash = fallback; }, 150);
  } else if (fallback) location.hash = fallback;
}

// Borde de la topbar al hacer scroll
window.addEventListener('scroll', () => topbar.classList.toggle('scrolled', window.scrollY > 4), { passive: true });

// ───── Delegación global ─────
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-copy],[data-lb],.thb');
  if (!t) return;
  if (t.dataset.copy != null) { e.preventDefault(); copy(t.dataset.copy); return; }
  if (t.dataset.lb) { openLightbox(t.dataset.lb, +t.dataset.i); return; }
  if (t.classList.contains('thb')) {
    const rate = getRate(ctx.data).eurThb;
    const [a, b] = t.dataset.thb.split('-').map(Number);
    toast(b ? `${nf(a)}–${nf(b)} THB ≈ ${eur(a / rate)} – ${eur(b / rate)}` : `${nf(a)} THB ≈ ${eur(a / rate)}`);
  }
});
