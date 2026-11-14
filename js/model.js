// Datos derivados en cliente: índices, eventos con hora, agenda por día, presupuesto.
import { addDays, daysBetween } from './time.js';

const T = (iso) => (iso ? Date.parse(iso) : null);

export function derive(d) {
  d.baseById = Object.fromEntries(d.bases.map((b) => [b.id, b]));
  d.diaPorFecha = {};
  for (const b of d.bases) for (const dia of b.itinerario?.dias ?? []) d.diaPorFecha[dia.fecha] = { base: b, dia };
  d.totalDias = daysBetween(d.viaje.inicio, d.viaje.fin) + 1;

  const ev = [];
  for (const b of d.bases) {
    for (const dia of b.itinerario?.dias ?? []) {
      for (const s of dia.secciones) {
        if (!s.ini) continue;
        ev.push({ tipo: 'act', ini: T(s.ini), fin: T(s.fin), fecha: dia.fecha, titulo: s.titulo, emoji: s.emoji, href: `#/viaje/${b.id}/${dia.n}?s=${s.id}`, sec: s, base: b, dia });
      }
    }
  }
  for (const v of d.vuelos) {
    for (const t of v.tramos) {
      if (!t.de.dt) continue;
      ev.push({ tipo: 'vuelo', ini: T(t.de.dt), fin: T(t.a.dt), fecha: t.de.dt.slice(0, 10), titulo: `Vuelo ${t.vuelo} · ${t.de.iata} → ${t.a.iata}`, emoji: '✈️', href: `#/vuelo/${v.id}`, vuelo: v, tramo: t });
    }
  }
  for (const e of d.estancias) {
    if (e.checkout) ev.push({ tipo: 'checkout', ini: T(e.checkout), fin: T(e.checkout), fecha: e.hasta, titulo: `Check-out · ${e.nombre}`, emoji: '🧳', href: `#/estancia/${e.id}`, est: e, hasta: true });
    if (e.checkin) ev.push({ tipo: 'checkin', ini: T(e.checkin), fin: T(e.checkin), fecha: e.desde, titulo: `Check-in · ${e.nombre}`, emoji: '🏨', href: `#/estancia/${e.id}`, est: e, desde: true });
  }
  for (const t of d.traslados) {
    let ini = T(t.ini);
    let aprox = false;
    if (!ini && t.fecha) {
      // Sin hora: justo después del check-out de ese día (o 08:00)
      const co = d.estancias.find((e) => e.hasta === t.fecha && e.checkout);
      ini = co ? T(co.checkout) + 60000 : T(`${t.fecha}T08:00:00+07:00`);
      aprox = true;
    }
    ev.push({ tipo: 'traslado', ini, fin: T(t.fin) ?? ini, aprox, fecha: t.fecha, titulo: t.titulo, emoji: t.emoji, href: `#/traslado/${t.id}`, tras: t });
  }
  d.eventos = ev.sort((a, b) => a.ini - b.ini || (a.tipo === 'checkout' ? -1 : 1));
  return d;
}

/** Estancia de la noche que empieza en `fecha`. */
export const estanciaNoche = (d, fecha) => d.estancias.find((e) => e.desde <= fecha && fecha < e.hasta) ?? null;
/** Estancia con check-out en `fecha`. */
export const estanciaSalida = (d, fecha) => d.estancias.find((e) => e.hasta === fecha) ?? null;

/** Base en la que se está un día (la de la noche, o la del check-out si es el último día). */
export function baseEn(d, fecha) {
  const e = estanciaNoche(d, fecha) ?? estanciaSalida(d, fecha);
  return e ? d.baseById[e.base] : null;
}

/** Elementos de la línea temporal del viaje: vuelos, bases y traslados en orden. */
export function timeline(d) {
  const items = [];
  for (const v of d.vuelos) items.push({ k: 'vuelo', t: T(v.tramos[0]?.de.dt), v });
  for (const b of d.bases) {
    const est = d.estancias.filter((e) => e.base === b.id);
    if (!est.length) continue;
    items.push({ k: 'base', t: T(est[0].checkin) ?? T(`${b.desde}T14:00:00+07:00`), b, est });
  }
  for (const t of d.traslados) {
    const ev = d.eventos.find((e) => e.tras === t);
    items.push({ k: 'traslado', t: ev?.ini ?? T(`${t.fecha}T08:00:00+07:00`), tr: t });
  }
  return items.sort((a, b) => a.t - b.t);
}

/** Presupuesto de efectivo por base (desde los días detallados) + pagos de alojamiento. */
export function presupuesto(d) {
  const porBase = d.bases.map((b) => {
    const dias = b.itinerario?.dias ?? [];
    const min = dias.reduce((a, x) => a + (x.efectivo?.min ?? 0), 0);
    const max = dias.reduce((a, x) => a + (x.efectivo?.max ?? 0), 0);
    return { base: b, dias: dias.length, min, max };
  });
  // Solo los que se pagan en efectivo al llegar (los de "solo tarjeta" no cuentan)
  const alojamientos = d.estancias.filter((e) => /llegada/i.test(e.pago ?? '') && !/solo (pago )?(con )?tarjeta/i.test(e.importe ?? '')).map((e) => {
    const efectivo = parseThb(e.importe?.match(/([\d.,]+)\s*THB(?:\s*en efectivo)?/)?.[1]);
    const dep = parseThb(e.deposito?.match(/([\d.,]+)\s*THB/)?.[1]);
    return { est: e, efectivo, deposito: dep };
  });
  return { porBase, alojamientos };
}

/** Efectivo total previsto (THB): gastos diarios + alojamientos pagados en efectivo + depósitos; `pend` = bases sin detallar. */
export function efectivoTotal(d) {
  const p = presupuesto(d);
  const aloj = p.alojamientos.reduce((a, x) => a + x.efectivo + x.deposito, 0);
  return {
    min: p.porBase.reduce((a, x) => a + x.min, 0) + aloj,
    max: p.porBase.reduce((a, x) => a + x.max, 0) + aloj,
    pend: p.porBase.filter((x) => !x.dias).map((x) => x.base.nombre),
  };
}

export const parseThb = (s) => (s ? parseFloat(s.replace(/\./g, '').replace(',', '.')) : 0);

export { addDays };
