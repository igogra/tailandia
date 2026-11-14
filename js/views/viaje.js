// Viaje: línea temporal → base → día. Más mapa por base/día.
import { esc, icon, img, mapsUrl, showTaxi } from '../ui.js';
import { now, dayKey, fmtDate, daysBetween, isoHM, hm } from '../time.js';
import { timeline } from '../model.js';
import { estanciaCard, medioIcon, placesHtml, thbRange, bindTaxi, baseCorta, platosDeBase } from './parts.js';

const listaBtn = (nombre, url) => `<a class="btn secondary" href="${esc(url)}" target="_blank" rel="noopener">${icon('pin', 'sm')} Lista ${esc(nombre)}</a>`;
const listasDia = (b, n) => (b.listasExtra ?? []).filter((l) => l.dias?.includes(n));

// ───────── Lista ─────────
export function list(ctx) {
  const d = ctx.data;
  const t = now();
  const hoy = dayKey(t);
  const items = timeline(d).map((it) => {
    if (it.k === 'vuelo') {
      const v = it.v;
      const a = v.tramos[0];
      const z = v.tramos.at(-1);
      const done = Date.parse(z.a.dt) < t;
      return `<div class="tl-item transit ${done ? 'done' : ''}"><a class="tl-transit" href="#/vuelo/${v.id}">
        <div class="ico-tile blue">${icon('plane')}</div>
        <div class="grow"><div class="t">${esc(a.de.iata)} → ${esc(z.a.iata)} · ${esc(v.aerolinea)}</div>
        <div class="s">${fmtDate(a.de.dt.slice(0, 10))} · ${isoHM(a.de.dt)} · ${v.tramos.map((x) => esc(x.vuelo)).join(' + ')}</div></div>
        <span class="chev">${icon('right')}</span></a></div>`;
    }
    if (it.k === 'traslado') {
      const tr = it.tr;
      const done = tr.fecha < hoy;
      return `<div class="tl-item transit ${done ? 'done' : ''}"><a class="tl-transit" href="#/traslado/${tr.id}">
        <div class="ico-tile gold">${icon(medioIcon(tr.medio))}</div>
        <div class="grow"><div class="t">${esc(tr.titulo.replace(/^Traslado\s*/, ''))}</div>
        <div class="s">${fmtDate(tr.fecha)} · ${esc(tr.medio ?? '')}${tr.duracion ? ` · ${esc(tr.duracion)}` : ''}</div></div>
        <span class="chev">${icon('right')}</span></a></div>`;
    }
    const b = it.b;
    const noches = daysBetween(b.desde, b.hasta);
    const state = b.hasta < hoy ? 'done' : b.desde <= hoy && hoy <= b.hasta ? 'current' : '';
    return `<div class="tl-item ${state}"><a class="card base-card" href="#/viaje/${b.id}">
      <div class="cover ${b.portada ? '' : 'noimg'}">${b.portada ? img(b.portada) : ''}
        <div class="label"><h3>${esc(b.nombre)}</h3><div class="d">${fmtDate(b.desde)} – ${fmtDate(b.hasta)} · ${noches} ${noches === 1 ? 'noche' : 'noches'}</div></div></div>
      <div class="foot">${icon('bed', 'sm')} <span class="grow">${it.est.map((e) => esc(e.nombre)).join(' · ')}</span>
        ${b.itinerario ? `<span class="chip primary">${b.itinerario.dias.length} días</span>` : '<span class="chip">Pendiente</span>'}</div>
    </a></div>`;
  }).join('');
  return {
    tab: 'viaje',
    html: `<div class="page-head"><h1>Viaje</h1><div class="sub">${fmtDate(d.viaje.inicio)} – ${fmtDate(d.viaje.fin)} · ${d.totalDias} días · ${d.bases.length} bases</div></div>
      <div class="chips" style="margin-bottom:16px">${d.viaje.ruta.map((r) => `<span class="chip">${esc(r)}</span>`).join('<span class="muted">›</span>')}</div>
      <div class="timeline">${items}</div>`,
  };
}

// ───────── Base ─────────
export function base(ctx, id) {
  const d = ctx.data;
  const b = d.baseById[id];
  if (!b) return { title: 'No encontrado', html: '', back: '#/viaje' };
  const hoy = dayKey(now());
  const est = d.estancias.filter((e) => e.base === b.id);
  const salida = d.traslados.find((x) => x.baseOrigen === b.id);
  const vueloSalida = d.vuelos.find((v) => v.tramos[0].de.dt?.slice(0, 10) === b.hasta && (v.tipo !== 'ida'));
  const it = b.itinerario;
  const dias = it?.dias.map((x) => `
    <a class="card day-card ${x.fecha === hoy ? 'today' : ''}" href="#/viaje/${b.id}/${x.n}">
      <div class="day-num"><span>${esc(x.semana.slice(0, 3))}</span><b>${x.fecha.slice(8)}</b></div>
      <div class="grow"><div class="eyebrow">Día ${x.n}${x.fecha === hoy ? ' · HOY' : ''}</div><div style="font-weight:650;line-height:1.3">${esc(x.titulo)}</div>
      ${x.efectivo ? `<div class="small muted">💵 ${thbRange(x.efectivo.min, x.efectivo.max)}</div>` : ''}</div>
      <span class="chev">${icon('right')}</span>
    </a>`).join('') ?? '';
  const platos = platosDeBase(d, b.id);
  const infoSecs = it?.info.map((s) => `<details class="fold"><summary>${esc(s.emoji)} ${esc(s.titulo)}</summary><div class="fold-body md">${s.html}</div></details>`).join('') ?? '';
  return {
    tab: 'viaje',
    noTopbar: true,
    title: b.nombre,
    html: `
      <div class="hero ${b.portada ? '' : 'noimg'}">${b.portada ? img(b.portada) : ''}
        <button class="icon-btn hero-back" onclick="history.length>1?history.back():location.hash='#/viaje'" aria-label="Atrás">${icon('left', 'lg')}</button>
        <div class="label"><h1>${esc(b.nombre)}</h1><div class="d">${fmtDate(b.desde)} – ${fmtDate(b.hasta)} · ${daysBetween(b.desde, b.hasta)} noches</div></div>
      </div>
      <div class="btn-row mt">
        <a class="btn secondary" href="#/mapa/${b.id}">${icon('map', 'sm')} Mapa</a>
        ${b.lista ? `<a class="btn secondary" href="${esc(b.lista)}" target="_blank" rel="noopener">${icon('pin', 'sm')} Mi lista en Maps</a>` : ''}
        ${(b.listasExtra ?? []).map((l) => listaBtn(l.nombre, l.url)).join('')}
      </div>
      <div class="section"><h2>Alojamiento</h2></div>
      ${est.map((e) => estanciaCard(d, e, { titulo: `${fmtDate(e.desde)} → ${fmtDate(e.hasta)}` })).join('')}
      ${it ? `<div class="section"><h2>Itinerario</h2></div><div class="stack">${dias}</div>` : `<div class="section"><h2>Itinerario</h2></div><div class="card card-body empty"><div class="big">🗺️</div><p>El itinerario detallado de ${esc(b.nombre)} está pendiente.</p></div>`}
      ${infoSecs ? `<div class="section"><h2>Notas de la base</h2></div>${infoSecs}` : ''}
      ${platos.length ? `<div class="section"><h2>Qué comer</h2></div><div class="list"><a href="#/mas/comida?b=${b.id}"><div class="ico-tile gold">${icon('food')}</div><div class="grow"><div class="t">Especialidades de ${esc(baseCorta(b))}</div><div class="s">${platos.slice(0, 4).map((p) => esc(p.nombre)).join(' · ')}${platos.length > 4 ? '…' : ''}</div></div><span class="chev">${icon('right')}</span></a></div>` : ''}
      ${salida ? `<div class="section"><h2>Salida</h2></div><a class="tl-transit" href="#/traslado/${salida.id}"><div class="ico-tile gold">${icon(medioIcon(salida.medio))}</div><div class="grow"><div class="t">${esc(salida.titulo)}</div><div class="s">${fmtDate(salida.fecha)} · ${esc(salida.medio ?? '')}</div></div><span class="chev">${icon('right')}</span></a>` : ''}
      ${!salida && vueloSalida ? `<div class="section"><h2>Salida</h2></div><a class="tl-transit" href="#/vuelo/${vueloSalida.id}"><div class="ico-tile blue">${icon('plane')}</div><div class="grow"><div class="t">${esc(vueloSalida.titulo)}</div><div class="s">${fmtDate(vueloSalida.tramos[0].de.dt.slice(0, 10))} · ${isoHM(vueloSalida.tramos[0].de.dt)}</div></div><span class="chev">${icon('right')}</span></a>` : ''}`,
    mount(root) { bindTaxi(root, d, showTaxi); },
  };
}

// ───────── Día ─────────
export function day(ctx, id, n) {
  const d = ctx.data;
  const b = d.baseById[id];
  const dias = b?.itinerario?.dias ?? [];
  const i = dias.findIndex((x) => x.n === +n);
  const x = dias[i];
  if (!x) return { title: 'No encontrado', html: '', back: `#/viaje/${id}` };
  const t = now();
  const prev = dias[i - 1];
  const next = dias[i + 1];
  const secs = x.secciones.map((s) => {
    const isNow = s.ini && Date.parse(s.ini) <= t && t < Date.parse(s.fin);
    return `<article class="card card-body act ${isNow ? 'now' : ''}" id="${esc(s.id)}">
      <div class="act-head"><div class="act-emoji">${esc(s.emoji || '📍')}</div>
        <div class="grow">${s.ini ? `<div class="timechip">${hm(Date.parse(s.ini))} – ${hm(Date.parse(s.fin))}${isNow ? ' · AHORA' : ''}</div>` : ''}<h3>${esc(s.titulo)}</h3></div></div>
      <div class="md mt-s">${s.html}</div>
      ${placesHtml(b, s.lugares)}
    </article>`;
  }).join('');
  const ef = x.efectivo ? `<details class="fold mt"><summary>💵 Efectivo del día · ${thbRange(x.efectivo.min, x.efectivo.max)}</summary><div class="fold-body md">${x.efectivo.html}</div></details>` : '';
  return {
    tab: 'viaje',
    title: `Día ${x.n} · ${fmtDate(x.fecha)}`,
    back: `#/viaje/${id}`,
    actions: `<a class="icon-btn" href="#/mapa/${id}/${x.n}" aria-label="Mapa del día">${icon('map')}</a>`,
    html: `
      <div class="page-head" style="padding-top:8px"><div class="eyebrow">${esc(b.nombre)} · ${esc(x.semana)} ${x.fecha.slice(8)}</div><h1 style="font-size:24px">${esc(x.titulo)}</h1>
      ${x.horarioGeneral ? `<div class="sub">${icon('clock', 'sm')} ${isoHM(x.horarioGeneral.ini)} – ${isoHM(x.horarioGeneral.fin)}</div>` : ''}</div>
      ${listasDia(b, x.n).length ? `<div class="btn-row" style="margin-bottom:14px">${listasDia(b, x.n).map((l) => listaBtn(`${l.nombre} en Maps`, l.url)).join('')}</div>` : ''}
      ${x.intro ? `<div class="md">${x.intro}</div>` : ''}
      <div class="stack">${secs}</div>
      ${ef}
      <div class="day-nav">
        ${prev ? `<a class="btn ghost" href="#/viaje/${id}/${prev.n}">${icon('left', 'sm')} Día ${prev.n}</a>` : '<span style="flex:1"></span>'}
        ${next ? `<a class="btn ghost" href="#/viaje/${id}/${next.n}">Día ${next.n} ${icon('right', 'sm')}</a>` : '<span style="flex:1"></span>'}
      </div>`,
  };
}

// ───────── Mapa (online) ─────────
let leafletP = null;
function loadLeaflet() {
  if (!leafletP) {
    leafletP = new Promise((resolve, reject) => {
      const css = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: 'vendor/leaflet/leaflet.css' });
      const js = Object.assign(document.createElement('script'), { src: 'vendor/leaflet/leaflet.js' });
      js.onload = () => resolve(window.L);
      js.onerror = reject;
      document.head.append(css, js);
    });
  }
  return leafletP;
}

export function mapa(ctx, id, n) {
  const d = ctx.data;
  const b = d.baseById[id];
  if (!b) return { title: 'Mapa', html: '' };
  const dia = n ? +n : null;
  const lugares = b.lugares.filter((l) => l.coords && (!dia || l.dia === dia));
  const est = d.estancias.filter((e) => e.base === id && e.coords);
  const diasCon = [...new Set(b.lugares.map((l) => l.dia).filter(Boolean))].sort((a, c) => a - c);
  return {
    tab: 'viaje',
    title: `Mapa · ${b.nombre}${dia ? ` · Día ${dia}` : ''}`,
    back: dia ? `#/viaje/${id}/${dia}` : `#/viaje/${id}`,
    html: `
      <div class="chips" style="margin:8px 0 12px">
        <a class="chip ${dia ? '' : 'primary'}" href="#/mapa/${id}">Todos</a>
        ${diasCon.map((x) => `<a class="chip ${dia === x ? 'primary' : ''}" href="#/mapa/${id}/${x}">Día ${x}</a>`).join('')}
      </div>
      <div class="map-box" id="map"><div class="empty"><div class="big">🗺️</div><p>Cargando mapa…</p></div></div>
      <p class="tiny muted mt-s">El mapa necesita conexión. Sin internet, usa los botones de Google Maps (descarga antes las zonas offline en la app de Google Maps). Posiciones aproximadas.</p>
      ${(dia ? listasDia(b, dia) : []).map((l) => `<a class="btn secondary block mt" href="${esc(l.url)}" target="_blank" rel="noopener">${icon('pin', 'sm')} Abrir mi lista de ${esc(l.nombre)} en Google Maps</a>`).join('')}
      ${b.lista ? `<a class="btn ${dia && listasDia(b, dia).length ? 'ghost' : 'secondary'} block mt" href="${esc(b.lista)}" target="_blank" rel="noopener">${icon('pin', 'sm')} Abrir mi lista de ${esc(b.nombre)} en Google Maps</a>` : ''}
      <div class="section"><h2>Lugares</h2></div>
      <div class="list">${lugares.map((l, i) => `<a href="${mapsUrl(l.q)}" target="_blank" rel="noopener"><div class="ico-tile" style="font-weight:800;font-size:15px">${i + 1}</div><div class="grow"><div class="t">${esc(l.nombre)}</div>${l.dia ? `<div class="s">Día ${l.dia}</div>` : ''}</div>${icon('ext', 'sm')}</a>`).join('')}
      ${est.map((e) => `<a href="${mapsUrl(e.direccion)}" target="_blank" rel="noopener"><div class="ico-tile gold">${icon('bed', 'sm')}</div><div class="grow"><div class="t">${esc(e.nombre)}</div><div class="s">Alojamiento</div></div>${icon('ext', 'sm')}</a>`).join('')}</div>`,
    mount(root) {
      const box = root.querySelector('#map');
      if (!navigator.onLine) {
        box.innerHTML = `<div class="empty"><div class="big">📡</div><p>Sin conexión: el mapa no está disponible.</p></div>`;
        return;
      }
      let map;
      loadLeaflet().then((L) => {
        box.innerHTML = '';
        map = L.map(box, { zoomControl: false, attributionControl: true });
        const dark = matchMedia('(prefers-color-scheme: dark)').matches && document.documentElement.dataset.theme !== 'light' || document.documentElement.dataset.theme === 'dark';
        box.classList.toggle('map-dark', dark);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
        }).addTo(map);
        const pts = [];
        lugares.forEach((l, i) => {
          const m = L.marker(l.coords, { icon: L.divIcon({ className: 'map-num', html: String(i + 1), iconSize: [26, 26] }) }).addTo(map);
          m.bindPopup(`<b>${esc(l.nombre)}</b>${l.dia ? `<br>Día ${l.dia}` : ''}<br><a href="${mapsUrl(l.q)}" target="_blank" rel="noopener">Abrir en Google Maps</a>`);
          pts.push(l.coords);
        });
        est.forEach((e) => {
          L.marker(e.coords, { icon: L.divIcon({ className: 'map-num home', html: '🏠', iconSize: [26, 26] }) }).addTo(map)
            .bindPopup(`<b>${esc(e.nombre)}</b><br><a href="${mapsUrl(e.direccion)}" target="_blank" rel="noopener">Abrir en Google Maps</a>`);
          pts.push(e.coords);
        });
        if (pts.length) map.fitBounds(pts, { padding: [30, 30], maxZoom: 15 });
        else map.setView(b.centro, 12);
      }).catch(() => { box.innerHTML = `<div class="empty"><p>No se pudo cargar el mapa.</p></div>`; });
      return () => map?.remove();
    },
  };
}
