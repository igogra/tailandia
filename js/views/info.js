// Info: vuelos, traslados, alojamientos, seguro (+PDFs), emergencias, equipaje.
import { esc, icon, mapsUrl, telUrl, waUrl, showTaxi, toast, docItem } from '../ui.js';
import { assetBytes } from '../crypto.js';
import { fmtDate, isoHM, isoDay, durHM } from '../time.js';
import { estanciaCard, medioIcon, bindTaxi } from './parts.js';

const CIUDAD = { MAD: 'Madrid', CKG: 'Chongqing', CAN: 'Cantón', BKK: 'Bangkok', DMK: 'Bangkok', CNX: 'Chiang Mai', KBV: 'Krabi', HKT: 'Phuket' };
const fmtTel = (n) => n
  .replace(/^\+662(\d{3})(\d{4})$/, '+66 2 $1 $2') // fijo Bangkok
  .replace(/^\+66(\d{2})(\d{3})(\d{3,4})$/, '+66 $1 $2 $3') // móvil / fijo provincias
  .replace(/^\+34(\d{3})(\d{3})(\d{3})$/, '+34 $1 $2 $3');

export function menu(ctx) {
  const d = ctx.data;
  const row = (href, tile, ic, t, s) => `<a href="${href}"><div class="ico-tile ${tile}">${icon(ic)}</div><div class="grow"><div class="t">${t}</div><div class="s">${s}</div></div><span class="chev">${icon('right')}</span></a>`;
  return {
    tab: 'info',
    html: `<div class="page-head"><h1>Info</h1><div class="sub">Documentos, contactos y emergencias</div></div>
      <div class="list">
        ${row('#/info/emergencias', 'red', 'alert', 'Emergencias', 'Teléfonos, Embajada y hospitales')}
        ${row('#/info/seguro', '', 'shield', 'Seguro de viaje', `Póliza ${esc(d.extra.seguro?.poliza ?? '')} · asistencia 24 h`)}
        ${d.docs?.tdac ? row('#/pdf/tdac', 'blue', 'file', 'TDAC · Tarjeta de llegada', 'Entrada a Tailandia · PDF sin conexión') : ''}
      </div>
      <div class="section"><h2>Reservas</h2></div>
      <div class="list">
        ${row('#/info/vuelos', 'blue', 'plane', 'Vuelos', `${d.vuelos.length} reservas · ${d.vuelos.reduce((a, v) => a + v.tramos.length, 0)} tramos`)}
        ${row('#/info/alojamientos', 'gold', 'bed', 'Alojamientos y contactos', `${d.estancias.length} alojamientos`)}
        ${row('#/info/equipaje', 'green', 'bag', 'Equipaje permitido', 'Comparativa por aerolínea')}
        ${row('#/dinero?tab=presupuesto', 'gold', 'cash', 'Pagos pendientes', 'A pagar en destino')}
      </div>
      <div class="section"><h2>Traslados</h2></div>
      <div class="list">${d.traslados.map((t) => row(`#/traslado/${t.id}`, 'gold', medioIcon(t.medio), esc(t.titulo.replace(/^Traslado\s*/, '')), `${fmtDate(t.fecha)} · ${esc(t.medio ?? '')}`)).join('')}</div>`,
  };
}

// ───────── Vuelos ─────────
function pass(v, t) {
  const term = (s) => s?.match(/Terminal\s*\w+/i)?.[0] ?? '';
  const dur = t.duracion ?? durHM(Date.parse(t.a.dt) - Date.parse(t.de.dt));
  return `<div class="pass">
    <div class="pass-head"><span>${esc(v.aerolinea)}</span><span>${esc(t.vuelo)}</span></div>
    <div class="pass-route">
      <div><div class="iata">${esc(t.de.iata)}</div><div class="city">${esc(CIUDAD[t.de.iata] ?? '')} ${esc(term(t.de.texto ?? t.de.lugar))}</div>
        <div class="time">${isoHM(t.de.dt)}</div><div class="date">${fmtDate(isoDay(t.de.dt))}</div></div>
      <div class="mid">${icon('plane', 'lg')}<div>${esc(dur)}</div></div>
      <div class="r"><div class="iata">${esc(t.a.iata)}</div><div class="city">${esc(CIUDAD[t.a.iata] ?? '')} ${esc(term(t.a.texto ?? t.a.lugar))}</div>
        <div class="time">${isoHM(t.a.dt)}</div><div class="date">${fmtDate(isoDay(t.a.dt))}</div></div>
    </div>
    <div class="pass-cut"></div>
    <div class="pass-foot">
      <div><div class="l">Localizador</div><div class="v">${v.pnr ? `<button class="code" data-copy="${esc(v.pnr)}">${esc(v.pnr)}</button>` : '—'}</div></div>
      <div><div class="l">Vuelo</div><div class="v">${esc(t.vuelo)}</div></div>
      <div><div class="l">Hora</div><div class="v">local</div></div>
    </div>
  </div>`;
}

function vueloHtml(v) {
  const parts = [];
  v.tramos.forEach((t, i) => {
    if (i > 0) parts.push(`<div class="layover">${icon('clock', 'sm')} ${esc(v.escala?.titulo ?? 'Escala')}: ${esc(v.escala?.texto ?? durHM(Date.parse(t.de.dt) - Date.parse(v.tramos[i - 1].a.dt)))}</div>`);
    parts.push(pass(v, t));
  });
  const eq = v.equipaje ? `<div class="card card-body mt"><div class="eyebrow" style="margin-bottom:8px">Equipaje</div><dl class="kv">${Object.entries(v.equipaje).map(([k, x]) => `<dt>${esc(k)}</dt><dd>${esc(typeof x === 'object' ? x._ : x)}</dd>`).join('')}</dl></div>` : '';
  return `${parts.join('')}
    ${v.eticket ? `<div class="card card-body mt row between"><span class="muted">Billete electrónico</span><button class="code" data-copy="${esc(v.eticket)}">${esc(v.eticket)}</button></div>` : ''}
    ${eq}`;
}

export function vuelos(ctx) {
  return {
    tab: 'info', title: 'Vuelos', back: '#/info',
    html: ctx.data.vuelos.map((v) => `<div class="section"><h2>${esc(v.emoji)} ${esc(v.titulo)}</h2></div>${vueloHtml(v)}`).join(''),
  };
}

export function vuelo(ctx, id) {
  const v = ctx.data.vuelos.find((x) => x.id === id);
  if (!v) return { title: 'Vuelo', html: '', back: '#/info/vuelos' };
  return {
    tab: 'info', title: v.titulo, back: '#/info/vuelos',
    html: `<div style="height:8px"></div>${vueloHtml(v)}
      <p class="tiny muted mt">Las horas son locales de cada aeropuerto. Llega al aeropuerto 3 h antes en vuelos internacionales y 2 h en el doméstico.</p>`,
  };
}

// ───────── Traslado ─────────
export function traslado(ctx, id) {
  const t = ctx.data.traslados.find((x) => x.id === id);
  if (!t) return { title: 'Traslado', html: '', back: '#/info' };
  const kv = [
    ['Fecha', fmtDate(t.fecha, { weekday: 'long', day: 'numeric', month: 'long' })],
    ['Medio', t.medio], ['Operador', t.operador],
    ['Horario', t.ini ? `${isoHM(t.ini)} – ${isoHM(t.fin)}` : 'Por reservar / confirmar'],
    ['Duración', t.duracion], ['Plataforma', t.plataforma], ['Pago', t.pago],
  ].filter(([, x]) => x);
  return {
    tab: 'info', title: t.titulo, back: '#/info',
    html: `
      <div class="card card-body mt-s">
        <div class="row"><div class="ico-tile gold">${icon(medioIcon(t.medio), 'lg')}</div><div class="grow"><div class="eyebrow">${esc(t.medio ?? '')}</div><div style="font-weight:750;font-size:19px">${esc(t.de)} → ${esc(t.a)}</div></div></div>
        ${t.reserva ? `<div class="banner info">${icon('ticket')}<div class="grow">Reserva</div><button class="code" data-copy="${esc(t.reserva)}">${esc(t.reserva)}</button></div>` : ''}
      </div>
      <div class="card mt">
        <a class="card-row" href="${mapsUrl(t.origen ?? t.de)}" target="_blank" rel="noopener" style="color:inherit"><div class="ico-tile">${icon('pin')}</div><div class="grow"><div class="eyebrow">Salida</div><div>${esc(t.origen ?? t.de)}</div></div>${icon('ext', 'sm')}</a>
        <a class="card-row" href="${mapsUrl(t.destino ?? t.a)}" target="_blank" rel="noopener" style="color:inherit"><div class="ico-tile gold">${icon('pin')}</div><div class="grow"><div class="eyebrow">Llegada</div><div>${esc(t.destino ?? t.a)}</div></div>${icon('ext', 'sm')}</a>
      </div>
      <div class="card card-body mt"><dl class="kv">${kv.map(([k, x]) => `<dt>${k}</dt><dd>${esc(x)}</dd>`).join('')}</dl></div>
      ${!t.reserva ? `<div class="banner mt">${icon('alert')}<div class="grow small">Sin reserva registrada. Reserva en <b>12go.asia</b> (lleva el billete en el móvil).</div></div>` : ''}
      ${/lancha/i.test(t.medio ?? '') ? `<div class="banner danger">${icon('shield')}<div class="grow small">El seguro excluye la <b>lancha rápida</b>. Si puedes, elige el ferry grande.</div></div>` : ''}`,
  };
}

// ───────── Alojamientos ─────────
export function estancia(ctx, id) {
  const d = ctx.data;
  const e = d.estancias.find((x) => x.id === id);
  if (!e) return { title: 'Alojamiento', html: '', back: '#/info/alojamientos' };
  const base = d.baseById[e.base];
  return {
    tab: 'info', title: e.nombre, back: '#/info/alojamientos',
    html: `
      <div class="page-head" style="padding-top:8px"><div class="eyebrow">${esc(base?.nombre ?? '')} · ${esc(e.titulo)}</div><h1 style="font-size:26px">${esc(e.nombre)}</h1>
        <div class="sub">${fmtDate(e.desde)} → ${fmtDate(e.hasta)}</div></div>
      <div class="btn-row">
        ${e.telefono ? `<a class="btn" href="${telUrl(e.telefono)}">${icon('phone', 'sm')} Llamar</a><a class="btn secondary" href="${waUrl(e.telefono)}" target="_blank" rel="noopener">${icon('whatsapp', 'sm')} WhatsApp</a>` : ''}
      </div>
      <div class="card mt">
        <div class="card-row"><div class="ico-tile">${icon('pin')}</div><div class="grow"><div class="eyebrow">Dirección</div><div>${esc(e.direccion)}</div></div><button class="icon-btn" data-copy="${esc(e.direccion)}" aria-label="Copiar dirección">${icon('copy')}</button></div>
        <div class="card-row"><div class="btn-row" style="width:100%">
          <a class="btn sm secondary" href="${mapsUrl(e.direccion)}" target="_blank" rel="noopener">${icon('nav', 'sm')} Google Maps</a>
          ${e.thai ? `<button class="btn sm ghost" data-taxi="${e.id}">${icon('taxi', 'sm')} Mostrar al taxista</button>` : ''}
        </div></div>
      </div>
      <div class="card card-body mt"><dl class="kv">
        <dt>Check-in</dt><dd>${esc(e.checkinTexto ?? '')}</dd>
        <dt>Check-out</dt><dd>${esc(e.checkoutTexto ?? '')}</dd>
        ${e.anfitrion ? `<dt>Anfitrión</dt><dd>${esc(e.anfitrion)}</dd>` : ''}
        ${e.telefono ? `<dt>Teléfono</dt><dd><a class="phone" href="${telUrl(e.telefono)}">${esc(fmtTel(e.telefono.replace(/\s/g, '')))}</a></dd>` : ''}
        <dt>Reserva</dt><dd>${esc(e.plataforma ?? '')}</dd>
        ${e.codigo ? `<dt>Código</dt><dd><button class="code" data-copy="${esc(e.codigo)}">${esc(e.codigo)}</button></dd>` : ''}
        ${e.pin ? `<dt>PIN</dt><dd><button class="code" data-copy="${esc(e.pin)}">${esc(e.pin)}</button></dd>` : ''}
      </dl></div>
      <div class="card card-body mt"><div class="eyebrow" style="margin-bottom:8px">Pago</div><div class="md">
        <p>${esc(e.pago ?? '')}</p>${e.importe ? `<p><b>${esc(e.importe)}</b></p>` : ''}${e.deposito ? `<p>⚠️ ${esc(e.deposito)}</p>` : ''}</div></div>`,
    mount(root) { bindTaxi(root, d, showTaxi); },
  };
}

export function alojamientos(ctx) {
  const d = ctx.data;
  return {
    tab: 'info', title: 'Alojamientos y contactos', back: '#/info',
    html: `<div style="height:8px"></div>${d.estancias.map((e) => estanciaCard(d, e, { titulo: d.baseById[e.base]?.nombre })).join('')}
      <p class="tiny muted mt">Las direcciones en tailandés ("Taxi") se han preparado para el viaje: confírmalas con cada alojamiento.</p>`,
    mount(root) { bindTaxi(root, d, showTaxi); },
  };
}

export function equipaje(ctx) {
  const d = ctx.data;
  return {
    tab: 'info', title: 'Equipaje permitido', back: '#/info',
    html: `<div class="card card-body mt-s md">${d.resumenes.equipaje?.html ?? ''}</div>
      ${d.vuelos.map((v) => v.equipaje ? `<div class="section"><h2>${esc(v.aerolinea)}</h2></div><div class="card card-body"><dl class="kv">${Object.entries(v.equipaje).map(([k, x]) => `<dt>${esc(k)}</dt><dd>${esc(typeof x === 'object' ? x._ : x)}</dd>`).join('')}</dl></div>` : '').join('')}
      <div class="banner mt">${icon('alert')}<div class="grow small">El vuelo interno de AirAsia es el más restrictivo: <b>7 kg</b> de mano (mochila + maleta) y <b>15 kg</b> facturado.</div></div>`,
  };
}

// ───────── Seguro ─────────
export function seguro(ctx) {
  const s = ctx.data.extra.seguro;
  if (!s) return { title: 'Seguro', html: '', back: '#/info' };
  return {
    tab: 'info', title: 'Seguro de viaje', back: '#/info',
    html: `
      <div class="hero-today" style="margin-top:8px">
        <div class="date">${esc(s.correduria)}</div>
        <h1 style="margin-bottom:4px">${esc(s.producto)}</h1>
        <div class="row" style="position:relative;z-index:1;gap:8px;flex-wrap:wrap">
          <span>Póliza</span><button class="code" data-copy="${esc(s.poliza)}" style="font-size:18px">${esc(s.poliza)}</button>
        </div>
        <div class="meta">${fmtDate(s.desde)} – ${fmtDate(s.hasta)} · ${esc(s.destino)}</div>
      </div>
      <div class="section"><h2>Asistencia</h2></div>
      <div class="list">
        ${s.telefonos.map((t) => `<a href="${telUrl(t.numero)}"><div class="ico-tile red">${icon('phone')}</div><div class="grow"><div class="t">${esc(t.etiqueta)}</div><div class="s">${esc(fmtTel(t.numero))} · ${esc(t.nota)}</div></div></a>`).join('')}
        ${s.web.map((w) => `<a href="${esc(w.url)}" target="_blank" rel="noopener"><div class="ico-tile">${icon('globe')}</div><div class="grow"><div class="t">${esc(w.etiqueta)}</div><div class="s">${esc(w.url.replace(/^https?:\/\//, ''))}</div></div>${icon('ext', 'sm')}</a>`).join('')}
      </div>
      <p class="small muted mt-s">${esc(s.app)}</p>
      <div class="section"><h2>Qué hacer en caso de siniestro</h2></div>
      <div class="card card-body md"><ol>${s.pasos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol></div>
      <div class="section"><h2>Atención</h2></div>
      <div class="card card-body md"><ul>${s.avisos.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>
      <div class="section"><h2>Coberturas</h2></div>
      ${s.coberturas.map((g) => `<details class="fold"><summary>${esc(g.grupo)}</summary><div class="fold-body"><dl class="kv">${g.items.map(([k, x]) => `<dt>${esc(k)}</dt><dd>${esc(x)}</dd>`).join('')}</dl></div></details>`).join('')}
      <div class="banner info mt">${icon('plane')}<div class="grow small">${esc(s.airhelp)}</div></div>
      <div class="section"><h2>Documentos</h2></div>
      <div class="list">${s.pdfs.filter((p) => ctx.data.docs?.[p.id]).map((p) => docItem(p.id, ctx.data.docs[p.id])).join('')}</div>`,
  };
}

// ───────── PDF (pdf.js) ─────────
export function pdf(ctx, id) {
  const p = ctx.data.docs?.[id];
  if (!p) return { title: 'PDF', html: '', back: '#/info' };
  return {
    tab: p.tab ?? 'info', title: p.titulo, back: p.vuelta ?? '#/info',
    actions: `<button class="icon-btn" data-save aria-label="Guardar PDF">${icon('download')}</button>`,
    html: `<div class="pdf-pages mt-s" id="pdf"><div class="empty"><div class="big">📄</div><p>Abriendo documento…</p></div></div>
      <p class="tiny muted center mt">Pellizca para ampliar. Botón ⬇ para guardarlo o abrirlo con otra app.</p>`,
    mount(root) {
      let cancelled = false;
      let doc = null;
      const box = root.querySelector('#pdf');
      const bytesP = assetBytes(p.asset);
      document.querySelector('[data-save]').onclick = async () => {
        const url = URL.createObjectURL(new Blob([await bytesP], { type: 'application/pdf' }));
        const a = Object.assign(document.createElement('a'), { href: url, download: `${p.titulo}.pdf` });
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      };
      (async () => {
        const pdfjs = await import(new URL('../../vendor/pdfjs/pdf.min.mjs', import.meta.url).href);
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('../../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
        const data = new Uint8Array((await bytesP).slice(0));
        doc = await pdfjs.getDocument({ data, standardFontDataUrl: new URL('../../vendor/pdfjs/standard_fonts/', import.meta.url).href, isEvalSupported: false }).promise;
        if (cancelled) return;
        box.innerHTML = '';
        const dpr = Math.min(2.5, window.devicePixelRatio || 1);
        const width = box.clientWidth;
        const canvases = [];
        for (let n = 1; n <= doc.numPages; n++) {
          const c = document.createElement('canvas');
          c.dataset.page = n;
          c.style.aspectRatio = '1 / 1.414';
          box.append(c);
          canvases.push(c);
        }
        const render = async (c) => {
          if (c.dataset.done) return;
          c.dataset.done = '1';
          const page = await doc.getPage(+c.dataset.page);
          const vp1 = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale: (width / vp1.width) * dpr });
          c.width = vp.width;
          c.height = vp.height;
          c.style.aspectRatio = `${vp.width} / ${vp.height}`;
          await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
        };
        const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); render(e.target); } }), { rootMargin: '800px' });
        canvases.forEach((c) => io.observe(c));
      })().catch((e) => { console.error(e); box.innerHTML = `<div class="empty"><p>No se pudo mostrar el PDF. Usa ⬇ para abrirlo con otra app.</p></div>`; toast('Error al abrir el PDF'); });
      return () => { cancelled = true; doc?.destroy(); };
    },
  };
}

// ───────── Emergencias ─────────
export function emergencias(ctx) {
  const d = ctx.data;
  const em = d.extra.emergencias;
  const s = d.extra.seguro;
  const hosp = em.hospitales.reduce((m, h) => { (m[h.base] ??= []).push(h); return m; }, {});
  return {
    tab: 'info', title: 'Emergencias', back: '#/info',
    html: `
      <div class="banner danger mt-s">${icon('shield')}<div class="grow small"><b>Asistencia médica:</b> llama primero al seguro para que autorice y te indique centro.</div></div>
      <a class="btn block mt-s" style="background:var(--danger);color:#fff" href="${telUrl(s?.telefonos[0].numero ?? '')}">${icon('phone', 'sm')} Seguro 24 h · ${esc(fmtTel(s?.telefonos[0].numero ?? ''))}</a>
      <div class="section"><h2>Teléfonos en Tailandia</h2></div>
      <div class="list">${em.numeros.map((n) => `<a href="tel:${n.num}"><div class="ico-tile red" style="font-size:20px">${n.icono}</div><div class="grow"><div class="t">${esc(n.num)} · ${esc(n.nombre)}</div><div class="s">${esc(n.desc)}</div></div>${icon('phone', 'sm')}</a>`).join('')}</div>
      <div class="section"><h2>${esc(em.embajada.nombre)}</h2></div>
      <div class="list">
        ${em.embajada.telefonos.map((t) => `<a href="${telUrl(t.num)}"><div class="ico-tile">${icon('phone')}</div><div class="grow"><div class="t">${esc(t.etiqueta)}</div><div class="s">${esc(fmtTel(t.num))} · ${esc(t.nota)}</div></div></a>`).join('')}
        <a href="${mapsUrl(em.embajada.q)}" target="_blank" rel="noopener"><div class="ico-tile">${icon('pin')}</div><div class="grow"><div class="t">Dirección</div><div class="s">${esc(em.embajada.direccion)}</div></div>${icon('ext', 'sm')}</a>
        <a href="mailto:${esc(em.embajada.email)}"><div class="ico-tile">${icon('chat')}</div><div class="grow"><div class="t">Email consular</div><div class="s">${esc(em.embajada.email)}</div></div></a>
      </div>
      <div class="section"><h2>Hospitales por base</h2></div>
      ${d.bases.map((b) => hosp[b.id] ? `<div class="eyebrow" style="margin:14px 0 6px">${esc(b.nombre)}</div><div class="list">${hosp[b.id].map((h) => `
        <div><div class="ico-tile red">${icon('hospital')}</div><div class="grow"><div class="t">${esc(h.nombre)}</div><div class="s">${esc(h.nota)}</div></div>
          ${h.tel ? `<a class="icon-btn" href="${telUrl(h.tel)}" aria-label="Llamar">${icon('phone')}</a>` : ''}
          <a class="icon-btn" href="${mapsUrl(h.q)}" target="_blank" rel="noopener" aria-label="Mapa">${icon('nav')}</a></div>`).join('')}</div>` : '').join('')}
      <div class="section"><h2>Recuerda</h2></div>
      <div class="card card-body md"><ul>${em.consejos.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>`,
  };
}
