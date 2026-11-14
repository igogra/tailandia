// Utilidades de fecha/hora. Referencia: hora de Tailandia (Asia/Bangkok, UTC+7).
export const TZ = 'Asia/Bangkok';
export const TZ_ES = 'Europe/Madrid';

/** Hora actual (o simulada desde Ajustes). */
export function now() {
  try {
    const sim = localStorage.getItem('simNow');
    if (sim) return Date.parse(sim);
  } catch {}
  return Date.now();
}

const cache = new Map();
function fmt(opts, tz = TZ) {
  const k = JSON.stringify([opts, tz]);
  if (!cache.has(k)) cache.set(k, new Intl.DateTimeFormat('es-ES', { timeZone: tz, ...opts }));
  return cache.get(k);
}

export const hm = (t, tz = TZ) => fmt({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }, tz).format(t);

/** 'YYYY-MM-DD' de un instante en la zona dada. */
export function dayKey(t, tz = TZ) {
  const p = Object.fromEntries(fmt({ year: 'numeric', month: '2-digit', day: '2-digit' }, tz).formatToParts(t).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

const D = (s) => new Date(`${s}T12:00:00Z`);
/** 'YYYY-MM-DD' → texto. */
export const fmtDate = (s, opts = { weekday: 'short', day: 'numeric', month: 'short' }) => fmt(opts, 'UTC').format(D(s));
export const fmtLong = (s) => fmtDate(s, { weekday: 'long', day: 'numeric', month: 'long' });
export const addDays = (s, n) => { const d = D(s); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const daysBetween = (a, b) => Math.round((D(b) - D(a)) / 864e5);

/** Hora local tal como viene en el ISO (para vuelos: hora del aeropuerto). */
export const isoHM = (iso) => iso?.slice(11, 16) ?? '';
export const isoDay = (iso) => iso?.slice(0, 10) ?? '';

/** "en 2 h 15 min", "hace 5 min", "en 3 días" */
export function rel(diffMs) {
  const past = diffMs < 0;
  const m = Math.round(Math.abs(diffMs) / 60000);
  let s;
  if (m < 1) s = 'ahora';
  else if (m < 60) s = `${m} min`;
  else if (m < 60 * 36) { const h = Math.floor(m / 60); const mm = m % 60; s = mm ? `${h} h ${mm} min` : `${h} h`; }
  else s = `${Math.round(m / 1440)} días`;
  if (s === 'ahora') return s;
  return past ? `hace ${s}` : `en ${s}`;
}

export function durHM(ms) {
  const m = Math.round(ms / 60000);
  const h = Math.floor(m / 60);
  return h ? `${h} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`;
}
