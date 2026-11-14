// Registro de gastos en efectivo (localStorage del dispositivo).
// Solo interesa el efectivo: los pagos con tarjeta no se registran (los antiguos con metodo 'tarjeta' se ignoran).
import { dayKey } from './time.js';

const K = 'gastos';
export const CATEGORIAS = [
  ['comida', '🍜', 'Comida y bebida'],
  ['transporte', '🚆', 'Transporte'],
  ['entradas', '🎟️', 'Entradas'],
  ['alojamiento', '🏨', 'Alojamiento'],
  ['compras', '🛍️', 'Compras'],
  ['ocio', '🍹', 'Ocio / fiesta'],
  ['otros', '📦', 'Otros'],
];
export const catInfo = (id) => CATEGORIAS.find((c) => c[0] === id) ?? CATEGORIAS.at(-1);

function raw() {
  try {
    return JSON.parse(localStorage.getItem(K)) ?? [];
  } catch {
    return [];
  }
}
export const list = () => raw().filter((g) => g.metodo !== 'tarjeta');
const save = (arr) => localStorage.setItem(K, JSON.stringify(arr));

export function add(g) {
  const arr = raw();
  arr.push({ id: crypto.randomUUID?.() ?? String(Date.now()), ...g, metodo: 'efectivo' });
  save(arr);
}
export function update(id, g) {
  save(raw().map((x) => (x.id === id ? { ...x, ...g } : x)));
}
export function remove(id) {
  save(raw().filter((x) => x.id !== id));
}

/** Importe en THB (si se registró en EUR, se convierte con la tasa guardada en el gasto). */
export const enThb = (g) => (g.moneda === 'EUR' ? g.importe * (g.tasa || 37.5) : g.importe);

export function porDia() {
  const m = new Map();
  for (const g of list().sort((a, b) => b.t - a.t)) {
    const k = dayKey(g.t);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(g);
  }
  return m;
}

export const total = (gs = list()) => gs.reduce((a, g) => a + enThb(g), 0);

/** Los pagos de alojamiento tienen su propia partida en el presupuesto: no cuentan contra el efectivo del día. */
export const cuentaDia = (g) => g.cat !== 'alojamiento';

/** Efectivo gastado ese día que cuenta contra su presupuesto diario. */
export function totalDia(fecha) {
  return total(list().filter((g) => dayKey(g.t) === fecha && cuentaDia(g)));
}

export function toCsv() {
  const rows = [['fecha', 'hora', 'importe', 'moneda', 'importe_thb', 'categoria', 'nota']];
  for (const g of list().sort((a, b) => a.t - b.t)) {
    const d = new Date(g.t);
    rows.push([dayKey(g.t), d.toLocaleTimeString('es-ES', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' }), g.importe, g.moneda, Math.round(enThb(g)), g.cat, (g.nota ?? '').replace(/"/g, '""')]);
  }
  return rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
}
