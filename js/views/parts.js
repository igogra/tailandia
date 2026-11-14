// Componentes compartidos entre vistas.
import { esc, icon, img, mapsUrl, telUrl, waUrl, nf } from '../ui.js';
import { state as off, onChange } from '../offline.js';
import { fmtDate } from '../time.js';

/** Primera foto de una galería incluida en un HTML de sección. */
export function medioIcon(medio = '') {
  const m = medio.toLowerCase();
  if (/ferry|lancha|barco/.test(m)) return 'boat';
  if (/furgoneta|van/.test(m)) return 'van';
  if (/tren/.test(m)) return 'bus';
  return 'bus';
}

export function estanciaCard(d, e, { titulo = null } = {}) {
  if (!e) return '';
  const base = d.baseById[e.base];
  const q = e.direccion ?? e.nombre;
  return `
    <div class="card">
      <a class="card-row" href="#/estancia/${e.id}" style="color:inherit">
        <div class="ico-tile gold">${icon('bed')}</div>
        <div class="grow">
          ${titulo ? `<div class="eyebrow">${esc(titulo)}</div>` : ''}
          <div style="font-weight:700">${esc(e.nombre)}</div>
          <div class="small muted">${esc(base?.nombre ?? '')} · ${fmtDate(e.desde)} → ${fmtDate(e.hasta)}</div>
        </div>
        <span class="chev">${icon('right')}</span>
      </a>
      <div class="card-row" style="padding-top:0;border:0">
        <div class="btn-row" style="width:100%">
          ${e.telefono ? `<a class="btn sm secondary" href="${telUrl(e.telefono)}">${icon('phone', 'sm')} Llamar</a>` : ''}
          <a class="btn sm secondary" href="${mapsUrl(q)}" target="_blank" rel="noopener">${icon('nav', 'sm')} Cómo llegar</a>
          ${e.thai ? `<button class="btn sm ghost" data-taxi="${e.id}">${icon('taxi', 'sm')} Taxi</button>` : ''}
        </div>
      </div>
    </div>`;
}

/** Banner de descarga offline (se actualiza solo). Devuelve [html, mount]. */
export function offlineBanner() {
  const html = `<div id="off-banner"></div>`;
  const paint = () => {
    const el = document.getElementById('off-banner');
    if (!el) return;
    if (off.status === 'running') {
      const pct = off.totalBytes ? Math.round((off.bytes / off.totalBytes) * 100) : 0;
      el.innerHTML = `<div class="banner info">${icon('download')}<div class="grow"><b>Preparando uso sin conexión… ${pct}%</b><div class="tiny muted">${off.done}/${off.total} ficheros · no cierres la app</div><div class="meter"><i style="width:${pct}%"></i></div></div></div>`;
    } else if (off.status === 'error') {
      el.innerHTML = `<div class="banner danger">${icon('wifiOff')}<div class="grow"><b>Descarga incompleta</b><div class="tiny">${esc(off.error)}</div></div></div>`;
    } else el.innerHTML = '';
  };
  const mount = () => { paint(); return onChange(paint); };
  return [html, mount];
}

export const thbRange = (min, max) => (min === max ? `${nf(min)} THB` : `${nf(min)} – ${nf(max)} THB`);

export function placesHtml(base, idxs) {
  if (!idxs?.length) return '';
  return `<div class="places">${idxs.map((i) => {
    const l = base.lugares[i];
    return `<a class="place-btn" href="${mapsUrl(l.q)}" target="_blank" rel="noopener">${icon('pin', 'sm')} ${esc(l.nombre)}</a>`;
  }).join('')}</div>`;
}

export function bindTaxi(root, d, showTaxi) {
  root.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-taxi]');
    if (!b) return;
    const e = d.estancias.find((x) => x.id === b.dataset.taxi);
    if (e) showTaxi(e.thai, `${e.nombre} · ${e.direccion}`);
  });
}


// Comida típica por base
export const baseCorta = (b) => b.nombre.replace(/\s*\(.*\)\s*$/, '');
/** Especialidades de una base (platos con esa base en `bases`), en el orden de `zonas[id].destacados`. */
export function platosDeBase(d, id) {
  const c = d.extra.comida;
  const orden = c?.zonas?.[id]?.destacados ?? [];
  const pos = (p) => (orden.includes(p.id) ? orden.indexOf(p.id) : 1e3);
  return (c?.platos.filter((p) => p.bases?.includes(id)) ?? []).sort((a, b) => pos(a) - pos(b));
}
