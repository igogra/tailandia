// Pantalla "Hoy": qué toca ahora, siguiente, agenda del día, alojamiento y efectivo.
import { esc, icon, img, showTaxi, nf } from '../ui.js';
import { now, dayKey, hm, fmtLong, fmtDate, daysBetween, rel, isoHM, TZ_ES } from '../time.js';
import { estanciaNoche, estanciaSalida, baseEn } from '../model.js';
import { estanciaCard, offlineBanner, thbRange, bindTaxi } from './parts.js';
import * as gastos from '../gastos.js';
import { list as checkItems } from './mas.js';

export function render(ctx) {
  const d = ctx.data;
  const t = now();
  const fecha = dayKey(t);
  const salida = d.eventos.find((e) => e.tipo === 'vuelo');
  const llegada = [...d.eventos].reverse().find((e) => e.tipo === 'vuelo');
  const [banner, mountBanner] = offlineBanner();
  let body;
  if (t < salida.ini) body = antes(d, t, salida);
  else if (t > llegada.fin + 6 * 3600e3) body = despues(d);
  else body = durante(d, t, fecha);
  return {
    tab: 'hoy',
    html: `${banner}${body}`,
    mount(root) {
      bindTaxi(root, d, showTaxi);
      return mountBanner();
    },
  };
}

function clocks(t) {
  return `<div class="clocks">
    <div class="clock"><div class="t">${hm(t)}</div><div class="l">🇹🇭 Tailandia</div></div>
    <div class="clock"><div class="t">${hm(t, TZ_ES)}</div><div class="l">🇪🇸 España</div></div>
  </div>`;
}

function shortcuts() {
  return `<div class="section"><h2>Accesos rápidos</h2></div>
  <div class="list">
    <a href="#/info/emergencias"><div class="ico-tile red">${icon('alert')}</div><div class="grow"><div class="t">Emergencias</div><div class="s">1155 Policía Turística · 1669 Ambulancia</div></div><span class="chev">${icon('right')}</span></a>
    <a href="#/info/seguro"><div class="ico-tile">${icon('shield')}</div><div class="grow"><div class="t">Seguro de viaje</div><div class="s">Asistencia 24 h, póliza y PDFs</div></div><span class="chev">${icon('right')}</span></a>
    <a href="#/dinero"><div class="ico-tile gold">${icon('swap')}</div><div class="grow"><div class="t">Conversor THB ↔ €</div><div class="s">Y gastos en efectivo</div></div><span class="chev">${icon('right')}</span></a>
  </div>`;
}

// ───────── Antes del viaje ─────────
function antes(d, t, salida) {
  const diff = salida.ini - t;
  const dd = Math.floor(diff / 864e5);
  const hh = Math.floor((diff % 864e5) / 36e5);
  const mm = Math.floor((diff % 36e5) / 6e4);
  const v = salida.vuelo;
  const tr = salida.tramo;
  const items = checkItems(d);
  const done = items.filter((x) => x.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  return `
  <section class="hero-today">
    <div class="date">${fmtLong(dayKey(t))}</div>
    <h1>Rumbo a Tailandia 🇹🇭</h1>
    <div class="countdown">
      <div><b>${dd}</b><span>días</span></div><div><b>${hh}</b><span>horas</span></div><div><b>${mm}</b><span>min</span></div>
    </div>
    <div class="meta">Salida ${fmtDate(tr.de.dt.slice(0, 10))} a las ${isoHM(tr.de.dt)} desde ${esc(tr.de.iata)}</div>
  </section>

  <div class="section"><h2>Primer vuelo</h2><a class="more" href="#/vuelo/${v.id}">Ver</a></div>
  <a class="card card-body" href="#/vuelo/${v.id}">
    <div class="row between"><div><div class="eyebrow">${esc(v.aerolinea)} · ${esc(tr.vuelo)}</div>
    <div style="font-size:22px;font-weight:780">${esc(tr.de.iata)} → ${esc(tr.a.iata)} → ${esc(v.tramos.at(-1).a.iata)}</div></div>${icon('plane', 'lg')}</div>
    <div class="small muted mt-s">${esc(tr.de.lugar ?? '')}</div>
    <div class="chips mt-s"><span class="chip gold">Localizador ${esc(v.pnr)}</span><span class="chip">${esc(v.escala?.texto ?? '')} escala</span></div>
  </a>

  <div class="section"><h2>Preparativos</h2><a class="more" href="#/mas/checklist">Checklist</a></div>
  <a class="card card-body" href="#/mas/checklist">
    <div class="row between"><b>${done} de ${items.length} completados</b><span class="muted small">${pct}%</span></div>
    <div class="meter mt-s"><i style="width:${pct}%"></i></div>
  </a>

  <div class="section"><h2>Primera noche</h2></div>
  ${estanciaCard(d, d.estancias[0])}
  ${shortcuts()}
  <p class="tiny muted center mt">¿Quieres ver cómo será un día del viaje? <a href="#/mas/ajustes">Simula una fecha</a>.</p>`;
}

// ───────── Después ─────────
function despues(d) {
  const total = gastos.total();
  return `
  <section class="hero-today">
    <div class="date">Viaje completado</div>
    <h1>¡Bienvenido a casa! 🏠</h1>
    <div class="meta">${d.totalDias} días · ${d.bases.length} bases · ${total ? `${nf(total)} THB en efectivo` : ''}</div>
  </section>
  <div class="section"><h2>Recuerdos</h2></div>
  <a class="card card-body" href="#/viaje">Repasar el itinerario completo ${icon('right', 'sm')}</a>`;
}

// ───────── Durante ─────────
function agendaDia(d, fecha) {
  const info = d.diaPorFecha[fecha];
  const evs = d.eventos.filter((e) => e.fecha === fecha && e.tipo !== 'act');
  const rows = [];
  // Secciones del día en orden de documento (las sin hora heredan la anterior). Las sin hora del
  // principio del día van después de la llegada del vuelo/traslado de ese día (p. ej. cambio de
  // efectivo o SIM en el aeropuerto tras aterrizar), siempre que llegue antes de la primera con hora.
  const secs = info?.dia.secciones ?? [];
  const primera = secs.find((s) => s.ini);
  const tope = primera ? Date.parse(primera.ini) : Date.parse(`${fecha}T23:59:00+07:00`);
  const llegadas = evs.filter((e) => ['vuelo', 'traslado'].includes(e.tipo) && !e.aprox && e.fin && dayKey(e.fin) === fecha && e.fin <= tope).map((e) => e.fin);
  let last = Math.max(Date.parse(`${fecha}T00:00:00+07:00`), ...llegadas);
  for (const s of secs) {
    const ini = s.ini ? Date.parse(s.ini) : last;
    last = ini;
    rows.push({ ini, fin: s.fin ? Date.parse(s.fin) : null, timed: !!s.ini, titulo: s.titulo, emoji: s.emoji, href: `#/viaje/${info.base.id}/${info.dia.n}?s=${s.id}`, sub: '' });
  }
  // Los eventos van primero en caso de empate (la llegada antes de lo que se hace al llegar)
  const evRows = evs.map((e) => ({ ini: e.ini, fin: e.fin, timed: !e.aprox, titulo: e.titulo, emoji: e.emoji, href: e.href,
    sub: e.aprox ? 'Hora por confirmar' : e.tipo === 'vuelo' && e.tramo ? `Llegada ${isoHM(e.tramo.a.dt)} (hora local)` : '' }));
  return [...evRows, ...rows].sort((a, b) => a.ini - b.ini);
}

function durante(d, t, fecha) {
  const n = daysBetween(d.viaje.inicio, fecha) + 1;
  const base = baseEn(d, fecha);
  const info = d.diaPorFecha[fecha];
  const enVuelo = d.eventos.find((e) => e.tipo === 'vuelo' && e.ini <= t && t < e.fin);
  const ahora = d.eventos.filter((e) => ['act', 'vuelo', 'traslado'].includes(e.tipo) && !e.aprox && e.ini <= t && t < e.fin);
  const sig = d.eventos.find((e) => e.ini > t && e.tipo !== 'checkin');
  const titulo = enVuelo ? 'En vuelo ✈️' : base?.nombre ?? 'En ruta';
  const pct = Math.min(100, Math.max(0, Math.round((n / d.totalDias) * 100)));

  // Ahora
  let ahoraHtml = '';
  if (ahora.length) {
    ahoraHtml = ahora.map((e) => eventCard(d, e, t, 'now')).join('');
  } else if (info?.dia.horarioGeneral && Date.parse(info.dia.horarioGeneral.ini) <= t && t < Date.parse(info.dia.horarioGeneral.fin)) {
    ahoraHtml = `<a class="card card-body now-card" href="#/viaje/${info.base.id}/${info.dia.n}"><span class="badge" style="position:static;margin-bottom:8px">AHORA</span><h3>${esc(info.dia.emoji)} ${esc(info.dia.titulo)}</h3><div class="small muted">${isoHM(info.dia.horarioGeneral.ini)} – ${isoHM(info.dia.horarioGeneral.fin)}</div></a>`;
  } else {
    ahoraHtml = `<div class="card card-body row"><div class="ico-tile gold">☕</div><div class="grow"><b>Tiempo libre</b><div class="small muted">Nada programado en este momento</div></div></div>`;
  }

  // Agenda
  const rows = agendaDia(d, fecha);
  const agenda = rows.length ? `<div class="card card-body agenda" style="padding:6px 16px">${rows.map((r) => {
    const cls = r.fin && r.fin <= t ? 'past' : r.timed && r.ini <= t && (!r.fin || t < r.fin) ? 'now' : '';
    return `<a href="${r.href}" class="${cls}"><span class="when">${r.timed ? hm(r.ini) : '·'}</span><span class="dot"></span><span class="what"><div class="t">${esc(r.emoji)} ${esc(r.titulo)}</div>${r.sub ? `<div class="s">${esc(r.sub)}</div>` : ''}</span></a>`;
  }).join('')}</div>` : `<div class="card card-body muted small">Sin itinerario detallado para hoy${base && !base.itinerario ? ` (pendiente de añadir el de ${esc(base.nombre)})` : ''}.</div>`;

  // Alojamiento
  const noche = estanciaNoche(d, fecha);
  const sale = estanciaSalida(d, fecha);
  const coHoy = sale && sale !== noche && sale.checkout && Date.parse(sale.checkout) > t
    ? `<div class="banner">${icon('bag')}<div class="grow"><b>Check-out hoy antes de las ${isoHM(sale.checkout)}</b><div class="tiny">${esc(sale.nombre)}</div></div></div>` : '';

  // Próximo desplazamiento
  const mov = d.eventos.find((e) => (e.tipo === 'vuelo' || e.tipo === 'traslado') && e.ini > t);

  // Efectivo
  const ef = info?.dia.efectivo;
  const gastadoCash = gastos.totalDia(fecha);
  const efHtml = ef ? (() => {
    const p = Math.round((gastadoCash / ef.max) * 100);
    const cls = p > 100 ? 'over' : p > 80 ? 'warn' : '';
    return `<div class="section"><h2>Efectivo de hoy</h2><a class="more" href="#/dinero?tab=gastos">Gastos</a></div>
      <div class="card card-body">
        <div class="row between"><div><div class="eyebrow">Previsto</div><div class="big-num">${thbRange(ef.min, ef.max)}</div></div><span style="font-size:30px">💵</span></div>
        <div class="meter mt-s"><i class="${cls}" style="width:${Math.min(100, p)}%"></i></div>
        <div class="small muted mt-s">Gastado hoy: <b>${nf(gastadoCash)} THB</b> · ${gastadoCash <= ef.max ? `quedan <b>${nf(ef.max - gastadoCash)} THB</b>` : `<b style="color:var(--danger)">${nf(gastadoCash - ef.max)} THB por encima</b>`}</div>
      </div>`;
  })() : '';

  return `
  <section class="hero-today">
    <div class="date">${fmtLong(fecha)}</div>
    <h1>${esc(titulo)}</h1>
    ${clocks(t)}
    <div class="progress"><i style="width:${pct}%"></i></div>
    <div class="meta">Día ${n} de ${d.totalDias}${info ? ` · ${esc(info.dia.titulo)}` : ''}</div>
  </section>
  ${coHoy}
  <div class="section"><h2>Ahora</h2><span class="muted small">${hm(t)}</span></div>
  ${ahoraHtml}
  ${sig ? `<div class="section"><h2>Siguiente</h2><span class="muted small">${rel(sig.ini - t)}</span></div>${eventCard(d, sig, t, 'next')}` : ''}
  <div class="section"><h2>Agenda de hoy</h2>${info ? `<a class="more" href="#/viaje/${info.base.id}/${info.dia.n}">Día completo</a>` : ''}</div>
  ${agenda}
  ${noche ? `<div class="section"><h2>Dormir esta noche</h2></div>${estanciaCard(d, noche)}` : ''}
  ${mov && mov !== sig ? `<div class="section"><h2>Próximo desplazamiento</h2><span class="muted small">${rel(mov.ini - t)}</span></div>${eventCard(d, mov, t, 'next')}` : ''}
  ${efHtml}
  ${shortcuts()}`;
}

function eventCard(d, e, t, kind) {
  const cover = e.tipo === 'act' ? e.sec.portada ?? null : null; // foto de actividades.json (no las galerías)
  let when;
  if (e.tipo === 'vuelo') when = `${isoHM(e.tramo.de.dt)} ${e.tramo.de.iata} → ${isoHM(e.tramo.a.dt)} ${e.tramo.a.iata} (hora local)`;
  else if (e.aprox) when = `${fmtDate(e.fecha)} · hora por confirmar`;
  else when = `${hm(e.ini)}${e.fin > e.ini ? ` – ${hm(e.fin)}` : ''}${e.fecha !== dayKey(t) ? ` · ${fmtDate(e.fecha)}` : ''}`;
  const extra = kind === 'now' && e.fin > t ? ` · termina ${rel(e.fin - t)}` : '';
  return `
  <a class="card now-card" href="${e.href}">
    <span class="badge ${kind === 'next' ? 'next' : ''}" ${cover ? '' : 'style="position:static;margin:14px 16px 0"'}>${kind === 'now' ? 'AHORA' : 'SIGUIENTE'}</span>
    ${cover ? img(cover, { cls: 'cover' }) : ''}
    <div class="card-body">
      <div class="timechip">${esc(when)}${esc(extra)}</div>
      <h3>${esc(e.emoji)} ${esc(e.titulo)}</h3>
      ${e.tipo === 'act' ? `<div class="small muted">${esc(e.base.nombre)} · Día ${e.dia.n}</div>` : ''}
      ${e.tipo === 'traslado' && e.tras.origen ? `<div class="small muted">${esc(e.tras.origen)} → ${esc(e.tras.destino ?? '')}</div>` : ''}
    </div>
  </a>`;
}
