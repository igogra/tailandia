// Más: comida típica, frases, checklist, consejos y ajustes.
import { esc, icon, img, toast, eur, $ } from '../ui.js';
import { efectivoTotal } from '../model.js';
import { getRate } from '../rate.js';
import { forgetKey } from '../crypto.js';
import { state as off, startOffline, shellStatus } from '../offline.js';
import { now, hm, dayKey, TZ_ES } from '../time.js';
import { baseCorta, platosDeBase } from './parts.js';

const row = (href, tile, ic, t, s) => `<a href="${href}"><div class="ico-tile ${tile}">${ic.length > 2 ? icon(ic) : ic}</div><div class="grow"><div class="t">${t}</div><div class="s">${s}</div></div><span class="chev">${icon('right')}</span></a>`;

export function menu(ctx) {
  const items = list(ctx.data);
  const done = items.filter((x) => x.done).length;
  return {
    tab: 'mas',
    html: `<div class="page-head"><h1>Más</h1><div class="sub">Guía práctica de Tailandia</div></div>
      <div class="list">
        ${row('#/mas/comida', 'gold', 'food', 'Comida típica', `${ctx.data.extra.comida?.platos.length ?? 0} platos · especialidades de cada base`)}
        ${row('#/mas/frases', '', 'chat', 'Frases en tailandés', 'Con pronunciación y texto para mostrar')}
        ${row('#/mas/checklist', 'green', 'list', 'Checklist', `${done} de ${items.length} completados`)}
        ${row('#/mas/consejos', 'blue', 'bulb', 'Consejos', 'Templos, estafas, dinero, transporte')}
      </div>
      <div class="section"><h2>App</h2></div>
      <div class="list">${row('#/mas/ajustes', '', 'sliders', 'Ajustes', 'Modo sin conexión, tema, simular fecha')}</div>`,
  };
}

// ───────── Comida ─────────
const SPICE = ['Nada picante', '🌶️', '🌶️🌶️', '🌶️🌶️🌶️'];

export function comida(ctx, params) {
  const d = ctx.data;
  const c = d.extra.comida;
  const f = params.get('t');
  const bid = d.baseById[params.get('b')] ? params.get('b') : null;
  const base = bid && d.baseById[bid];
  const platos = (bid ? platosDeBase(d, bid) : c.platos).filter((p) => !f || p.tipo === f);
  const q = (t, b) => { const u = new URLSearchParams(); if (t) u.set('t', t); if (b) u.set('b', b); return `#/mas/comida${u.size ? `?${u}` : ''}`; };
  const bases = d.bases.filter((b) => platosDeBase(d, b.id).length);
  const chipRow = 'margin:8px 0 6px;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none';
  return {
    tab: 'mas', title: 'Comida típica', back: '#/mas',
    html: `
      <div class="chips" style="${chipRow}">
        <a class="chip ${bid ? '' : 'primary'}" data-f href="${q(f, null)}">🇹🇭 Toda Tailandia</a>
        ${bases.map((b) => `<a class="chip ${bid === b.id ? 'primary' : ''}" data-f href="${q(f, b.id)}">📍 ${esc(baseCorta(b))}</a>`).join('')}
      </div>
      <div class="chips" style="${chipRow};margin-bottom:14px">
        <a class="chip ${f ? '' : 'gold'}" data-f href="${q(null, bid)}">Todo</a>
        ${c.tipos.map(([id, l]) => `<a class="chip ${f === id ? 'gold' : ''}" data-f href="${q(id, bid)}">${esc(l)}</a>`).join('')}
      </div>
      ${base ? `<div class="card card-body" style="margin-bottom:12px"><div class="eyebrow">Qué comer en ${esc(baseCorta(base))}</div><p class="small mt-s">${esc(c.zonas?.[bid]?.intro ?? '')}</p><p class="tiny muted mt-s">Además de estas especialidades, los platos de toda Tailandia se encuentran en cualquier sitio.</p></div>` : ''}
      <div class="food-grid">${platos.map((p) => `
        <article class="card food">
          ${p.foto ? `<button style="display:block;width:100%" data-zoom="${p.id}">${img(p.foto)}</button>` : ''}
          <div class="card-body">
            <div class="row between" style="align-items:flex-start"><div><h3 style="font-size:19px">${esc(p.nombre)}</h3><div class="th" lang="th">${esc(p.thai)} <span class="muted small" style="font-weight:500">· ${esc(p.pron)}</span></div></div>
              <span class="spice small" title="Picante">${p.picante ? SPICE[p.picante] : ''}</span></div>
            <p class="mt-s small">${esc(p.desc)}</p>
            <div class="chips"><span class="chip gold">${esc(p.precio)}</span>${p.picante === 0 && ['plato', 'sopa', 'calle'].includes(p.tipo) ? '<span class="chip green">Sin picante</span>' : ''}${!bid && p.bases?.length ? `<span class="chip primary">📍 ${p.bases.map((x) => d.baseById[x]).filter(Boolean).map((b) => esc(baseCorta(b))).join(' · ')}</span>` : ''}</div>
          </div>
        </article>`).join('') || `<div class="empty"><div class="big">🍜</div><p>Ninguna especialidad de este tipo${base ? ` en ${esc(baseCorta(base))}` : ''}.</p></div>`}</div>
      <p class="tiny muted center mt">Toca una foto para verla en grande. Precios orientativos de puesto callejero / restaurante local.</p>`,
    mount(root) {
      root.addEventListener('click', (e) => {
        const fl = e.target.closest('[data-f]');
        if (fl) { e.preventDefault(); location.replace(fl.getAttribute('href')); return; }
        const b = e.target.closest('[data-zoom]');
        if (!b) return;
        const p = c.platos.find((x) => x.id === b.dataset.zoom);
        ctx.data.galerias.__food = [{ caption: p.nombre, fotos: [p.foto] }];
        import('../ui.js').then((u) => u.openLightbox('__food', 0));
      });
      root.querySelector('.chips .chip.primary')?.scrollIntoView({ inline: 'center', block: 'nearest' });
    },
  };
}

// ───────── Frases ─────────
export function frases(ctx) {
  const f = ctx.data.extra.frases;
  return {
    tab: 'mas', title: 'Frases en tailandés', back: '#/mas',
    html: `<p class="small muted mt-s">${esc(f._nota)} Toca una frase para mostrarla en grande.</p>
      ${f.grupos.map((g) => `<div class="section"><h2>${esc(g.grupo)}</h2></div><div class="card">${g.frases.map(([es, ph, th]) => `
        <button class="phrase" style="display:block;width:100%;text-align:left" data-big="${esc(th)}" data-es="${esc(es)}" data-ph="${esc(ph)}">
          <div class="es">${esc(es)}</div><div class="ph">${esc(ph)}</div><div class="thai" lang="th">${esc(th)}</div>
        </button>`).join('')}</div>`).join('')}`,
    mount(root) {
      root.addEventListener('click', (e) => {
        const b = e.target.closest('[data-big]');
        if (!b) return;
        const el = document.createElement('div');
        el.className = 'taxi';
        el.innerHTML = `<div class="row between"><span class="hint">${esc(b.dataset.es)}</span><button class="icon-btn" style="color:#000" aria-label="Cerrar">${icon('x', 'lg')}</button></div>
          <div class="thai" lang="th" style="font-size:44px;text-align:center">${esc(b.dataset.big)}</div><div class="latin center" style="font-size:20px">${esc(b.dataset.ph)}</div>`;
        document.body.append(el);
        const close = () => { el.remove(); window.removeEventListener('popstate', close); };
        history.pushState({ big: 1 }, '');
        window.addEventListener('popstate', close);
        el.querySelector('button').onclick = () => history.back();
      });
    },
  };
}

// ───────── Checklist ─────────
const CK = 'checklist';
const ckState = () => { try { return JSON.parse(localStorage.getItem(CK)) ?? {}; } catch { return {}; } };
// El estado se guarda por el texto del ítem (plantilla), no por su posición: añadir/quitar ítems no descoloca las marcas.
export function list(d) {
  const st = ckState();
  const vars = { efectivoEur: efectivoTexto(d) };
  return (d.extra.checklist?.grupos ?? []).flatMap((g) => g.items.map((id) => ({ id, grupo: g.grupo, t: id.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m), done: !!st[id] })));
}
function efectivoTexto(d) {
  const { min, max, pend } = efectivoTotal(d);
  const r = getRate(d).eurThb;
  return `≈ ${eur(min / r, 0)} – ${eur(max / r, 0)} presupuestados para todo el viaje${pend.length ? `, sin contar ${pend.length === 1 ? 'una base' : `${pend.length} bases`} aún sin detallar` : ''}`;
}
export function checklist(ctx) {
  const items = list(ctx.data);
  const grupos = [...new Set(items.map((x) => x.grupo))];
  const done = items.filter((x) => x.done).length;
  return {
    tab: 'mas', title: 'Checklist', back: '#/mas',
    html: `<div class="card card-body mt-s"><div class="row between"><b>${done} de ${items.length}</b><span class="muted small">${Math.round((done / items.length) * 100)}%</span></div><div class="meter mt-s"><i style="width:${(done / items.length) * 100}%"></i></div></div>
      ${grupos.map((g) => `<div class="section"><h2>${esc(g)}</h2></div><div class="card">${items.filter((x) => x.grupo === g).map((x) => `
        <label class="check ${x.done ? 'done' : ''}"><input type="checkbox" data-ck="${esc(x.id)}" ${x.done ? 'checked' : ''}><span class="lbl">${esc(x.t)}</span></label>`).join('')}</div>`).join('')}
      <button class="btn ghost block mt" data-reset>Desmarcar todo</button>`,
    mount(root) {
      root.addEventListener('change', (e) => {
        const id = e.target.dataset.ck;
        if (!id) return;
        const st = ckState();
        st[id] = e.target.checked;
        localStorage.setItem(CK, JSON.stringify(st));
        e.target.closest('.check').classList.toggle('done', e.target.checked);
        navigator.vibrate?.(10);
      });
      $('[data-reset]', root).onclick = () => { if (confirm('¿Desmarcar toda la checklist?')) { localStorage.removeItem(CK); ctx.rerender(); } };
    },
  };
}

// ───────── Consejos ─────────
export function consejos(ctx) {
  const c = ctx.data.extra.consejos;
  return {
    tab: 'mas', title: 'Consejos', back: '#/mas',
    html: `<div style="height:8px"></div>${c.temas.map((t, i) => `<details class="fold" ${i === 0 ? 'open' : ''}><summary><span style="font-size:20px">${t.emoji}</span> ${esc(t.titulo)}</summary><div class="fold-body md"><ul>${t.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></details>`).join('')}`,
  };
}

// ───────── Ajustes ─────────
export function ajustes(ctx) {
  const sim = localStorage.getItem('simNow');
  const theme = localStorage.getItem('theme') ?? 'auto';
  const t = now();
  const pct = off.totalBytes ? Math.round((off.bytes / off.totalBytes) * 100) : 0;
  const offTxt = { complete: '✅ 100% disponible sin conexión', running: `⏳ Descargando… ${pct}%`, error: `⚠️ ${off.error}`, idle: '…', unsupported: 'No soportado' }[off.status];
  const simVal = sim ? new Date(Date.parse(sim) + 7 * 3600e3).toISOString().slice(0, 16) : '';
  return {
    tab: 'mas', title: 'Ajustes', back: '#/mas',
    html: `
      <div class="section"><h2>Modo sin conexión</h2></div>
      <div class="card card-body">
        <b>${offTxt}</b>
        <div class="small muted mt-s">${off.done}/${off.total} ficheros · ${(off.totalBytes / 1e6).toFixed(1)} MB · almacenamiento persistente: ${off.persisted ? 'sí' : 'no'}</div>
        <div class="small muted" id="sw-st"></div>
        <button class="btn sm secondary mt-s" data-retry>${icon('refresh', 'sm')} Comprobar / reintentar</button>
      </div>
      <div class="section"><h2>Tema</h2></div>
      <div class="segmented" style="position:static">${[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Oscuro']].map(([id, l]) => `<button aria-selected="${theme === id}" data-theme="${id}">${l}</button>`).join('')}</div>
      <div class="section"><h2>Simular fecha y hora</h2></div>
      <div class="card card-body">
        <p class="small muted">Para ver cómo se verá la pantalla Hoy en cualquier momento del viaje (hora de Tailandia).</p>
        <label class="input-wrap"><input class="input" type="datetime-local" id="sim" value="${simVal}" min="2026-11-14T00:00" max="2026-12-09T23:59"><span class="ic">${icon('calendar')}</span></label>
        <div class="btn-row mt-s"><button class="btn sm" data-sim>Aplicar</button>${sim ? '<button class="btn sm ghost" data-unsim>Volver a la hora real</button>' : ''}</div>
        ${sim ? `<div class="banner mt-s">${icon('clock')}<div class="grow small">Simulando: <b>${dayKey(t)} ${hm(t)}</b> (Tailandia)</div></div>` : ''}
      </div>
      <div class="section"><h2>Seguridad</h2></div>
      <div class="card card-body">
        <p class="small muted">La contraseña está recordada en este dispositivo. Si la olvidas aquí, se pedirá de nuevo al abrir (necesitarás conocerla).</p>
        <button class="btn sm danger" data-lock>${icon('lock', 'sm')} Olvidar contraseña en este móvil</button>
      </div>
      <p class="tiny muted center mt">Versión ${esc(ctx.meta.v)} · datos generados ${new Date(ctx.data.build.fecha).toLocaleString('es-ES', { timeZone: TZ_ES })}</p>`,
    mount(root) {
      shellStatus().then((s) => { const el = $('#sw-st', root); if (el) el.textContent = `App: ${s.shell ? 'en caché' : 'sin caché'} · service worker ${s.sw ? 'activo' : 'inactivo'}`; });
      $('[data-retry]', root).onclick = async () => { await startOffline(ctx.meta); ctx.rerender(); };
      root.querySelectorAll('[data-theme]').forEach((b) => {
        b.onclick = () => {
          const v = b.dataset.theme;
          if (v === 'auto') { localStorage.removeItem('theme'); delete document.documentElement.dataset.theme; } else { localStorage.setItem('theme', v); document.documentElement.dataset.theme = v; }
          ctx.rerender();
        };
      });
      $('[data-sim]', root).onclick = () => {
        const v = $('#sim', root).value;
        if (!v) return;
        localStorage.setItem('simNow', new Date(Date.parse(`${v}:00+07:00`)).toISOString());
        toast('Fecha simulada aplicada');
        location.hash = '#/hoy';
      };
      const un = $('[data-unsim]', root);
      if (un) un.onclick = () => { localStorage.removeItem('simNow'); ctx.rerender(); };
      // Tocar en cualquier parte del campo abre el selector de fecha
      const simEl = $('#sim', root);
      simEl.onclick = () => { try { simEl.showPicker?.(); } catch {} };
      $('[data-lock]', root).onclick = async () => {
        if (!confirm('¿Olvidar la contraseña? La app pedirá la contraseña la próxima vez que se abra.')) return;
        await forgetKey();
        location.reload();
      };
    },
  };
}
