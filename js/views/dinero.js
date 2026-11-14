// Dinero: conversor THB↔EUR, presupuesto de efectivo y registro de gastos en efectivo (la tarjeta no se controla).
import { esc, icon, sheet, toast, nf, eur, $ } from '../ui.js';
import { getRate, refreshRate, setRate, resetRate } from '../rate.js';
import { presupuesto, efectivoTotal } from '../model.js';
import { now, dayKey, fmtDate, hm } from '../time.js';
import { thbRange } from './parts.js';
import * as G from '../gastos.js';

const parseNum = (s) => parseFloat(String(s).replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')) || 0;
let lastThb = 100;

export function render(ctx, params) {
  const tab = params.get('tab') ?? 'conversor';
  const tabs = [['conversor', 'Conversor'], ['presupuesto', 'Presupuesto'], ['gastos', 'Gastos']];
  let body = '';
  let mount = null;
  if (tab === 'presupuesto') body = presupuestoHtml(ctx);
  else if (tab === 'gastos') [body, mount] = gastosView(ctx);
  else [body, mount] = conversor(ctx);
  return {
    tab: 'dinero',
    html: `<div class="page-head"><h1>Dinero</h1></div>
      <div class="segmented" role="tablist">${tabs.map(([id, l]) => `<button role="tab" aria-selected="${id === tab}" data-tab="${id}">${l}</button>`).join('')}</div>
      ${body}`,
    mount(root) {
      root.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => location.replace(`#/dinero?tab=${b.dataset.tab}`); });
      return mount?.(root);
    },
  };
}

// ───────── Conversor ─────────
function conversor(ctx) {
  const r = getRate(ctx.data);
  const ex = [20, 50, 100, 200, 500, 1000, 2000, 5000];
  const exE = [1, 5, 10, 20, 50, 100, 200, 500];
  const html = `
    <div class="card converter">
      <div class="conv-field"><div class="cur"><b>🇹🇭 THB</b><span>Baht</span></div><input id="thb" inputmode="decimal" value="${nf(lastThb)}" aria-label="Importe en baht"></div>
      <div class="conv-swap"><span class="chip gold">1 € = ${nf(r.eurThb, 2)} THB</span></div>
      <div class="conv-field"><div class="cur"><b>🇪🇺 EUR</b><span>Euro</span></div><input id="eur" inputmode="decimal" value="${nf(lastThb / r.eurThb, 2)}" aria-label="Importe en euros"></div>
      <div class="quick">${[20, 50, 100, 500, 1000, 2000].map((v) => `<button data-q="${v}">${nf(v)} ฿</button>`).join('')}</div>
    </div>
    <div class="row between mt-s small muted"><span>Tasa: ${esc(r.fuente)}${r.fecha ? ` · ${fmtDate(r.fecha)}` : ''}${r.manual ? ' · manual' : ''}</span>
      <span class="row" style="gap:4px"><button class="icon-btn" data-refresh aria-label="Actualizar tasa">${icon('refresh')}</button><button class="icon-btn" data-edit aria-label="Editar tasa">${icon('sliders')}</button></span></div>
    <div class="section"><h2>Referencias rápidas</h2></div>
    <div class="card"><div class="ex-grid">
      ${ex.map((v, i) => `<div><span>${nf(v)} ฿</span><b>${eur(v / r.eurThb)}</b></div><div><span>${nf(exE[i])} €</span><b>${nf(exE[i] * r.eurThb)} ฿</b></div>`).join('')}
    </div></div>
    <div class="section"><h2>¿Cuánto cuesta…?</h2></div>
    <div class="card card-body small md"><ul>
      <li>Plato callejero: <b>50–80 THB</b> (${eur(65 / r.eurThb)})</li>
      <li>Cerveza grande en 7-Eleven: <b>~70 THB</b> (${eur(70 / r.eurThb)})</li>
      <li>Botella de agua: <b>7–15 THB</b> (${eur(10 / r.eurThb)})</li>
      <li>Masaje tailandés 1 h: <b>250–400 THB</b> (${eur(300 / r.eurThb)})</li>
      <li>Trayecto BTS: <b>17–62 THB</b> (${eur(40 / r.eurThb)})</li>
    </ul></div>`;
  const mount = (root) => {
    const a = $('#thb', root);
    const b = $('#eur', root);
    const rate = () => getRate(ctx.data).eurThb;
    a.oninput = () => { lastThb = parseNum(a.value); b.value = nf(lastThb / rate(), 2); };
    b.oninput = () => { lastThb = parseNum(b.value) * rate(); a.value = nf(lastThb); };
    [a, b].forEach((el) => { el.onfocus = () => el.select(); });
    root.querySelectorAll('[data-q]').forEach((q) => { q.onclick = () => { a.value = nf(+q.dataset.q); a.oninput(); }; });
    $('[data-refresh]', root).onclick = async () => {
      if (!navigator.onLine) { toast('Sin conexión: se mantiene la tasa guardada'); return; }
      try { const nr = await refreshRate(); toast(`Tasa actualizada: 1 € = ${nf(nr.eurThb, 2)} THB`); ctx.rerender(); } catch { toast('No se pudo actualizar la tasa'); }
    };
    $('[data-edit]', root).onclick = () => sheet(`
      <h2>Tasa de cambio</h2>
      <p class="small muted">Pon la tasa real de tu casa de cambio o de tu banco para cálculos exactos.</p>
      <label class="field"><span>1 € = ? THB</span><input class="input big" id="rate" inputmode="decimal" value="${nf(rate(), 2)}"></label>
      <div class="btn-row"><button class="btn ghost" data-reset>Restablecer</button><button class="btn" data-save>Guardar</button></div>`, (sh, close) => {
      sh.querySelector('[data-save]').onclick = () => {
        const v = parseNum(sh.querySelector('#rate').value);
        if (v > 10 && v < 100) { setRate({ eurThb: v, fecha: dayKey(Date.now()), fuente: 'Introducida a mano', manual: true }); close(); ctx.rerender(); } else toast('Tasa no válida');
      };
      sh.querySelector('[data-reset]').onclick = () => { resetRate(); close(); ctx.rerender(); };
    });
  };
  return [html, mount];
}

// ───────── Presupuesto ─────────
function presupuestoHtml(ctx) {
  const d = ctx.data;
  const r = getRate(d).eurThb;
  const p = presupuesto(d);
  const aloj = p.alojamientos.reduce((a, x) => a + x.efectivo, 0);
  const dep = p.alojamientos.reduce((a, x) => a + x.deposito, 0);
  const { min, max, pend } = efectivoTotal(d);
  return `
    <div class="card card-body">
      <div class="eyebrow">Efectivo a llevar desde España</div>
      <div class="big-num">${nf(min)} – ${nf(max)} THB</div>
      <div class="muted">≈ ${eur(min / r, 0)} – ${eur(max / r, 0)}</div>
      <div class="small muted mt-s">Solo efectivo: gastos diarios + alojamientos que se pagan en metálico al llegar. Lo que se paga con tarjeta no cuenta.</div>
      ${pend.length ? `<div class="small muted mt-s">No incluye gastos diarios de: ${pend.map(esc).join(', ')} (itinerario pendiente).</div>` : ''}
    </div>
    <div class="section"><h2>Gastos diarios por base</h2></div>
    <div class="list">${p.porBase.map((x) => `<a href="#/viaje/${x.base.id}"><div class="grow"><div class="t">${esc(x.base.nombre)}</div><div class="s">${x.dias ? `${x.dias} días detallados` : 'Pendiente'}</div></div>${x.dias ? `<div style="text-align:right"><b>${thbRange(x.min, x.max)}</b><div class="tiny muted">${eur(x.min / r, 0)} – ${eur(x.max / r, 0)}</div></div>` : '<span class="chip">—</span>'}</a>`).join('')}</div>
    <div class="section"><h2>Pagos de alojamiento en destino</h2></div>
    <div class="list">${p.alojamientos.map((x) => `<a href="#/estancia/${x.est.id}"><div class="ico-tile gold">${icon('bed')}</div><div class="grow"><div class="t">${esc(x.est.nombre)}</div><div class="s">${esc(x.est.importe ?? '')}${x.deposito ? ` · + ${nf(x.deposito)} THB depósito` : ''}</div></div><div style="text-align:right"><b>${nf(x.efectivo + x.deposito)} ฿</b><div class="tiny muted">${eur((x.efectivo + x.deposito) / r, 0)}</div></div></a>`).join('')}
      <div><div class="grow"><b>Total alojamientos</b><div class="s">${nf(aloj)} THB + ${nf(dep)} THB depósito (reembolsable)</div></div><b>${nf(aloj + dep)} ฿</b></div></div>
    ${d.bases.filter((b) => b.itinerario).map((b) => {
      const tabla = b.itinerario.info.find((s) => /Resumen/i.test(s.titulo));
      return tabla ? `<details class="fold mt"><summary>📊 ${esc(tabla.titulo)}</summary><div class="fold-body md">${tabla.html}</div></details>` : '';
    }).join('')}`;
}

// ───────── Gastos (solo efectivo) ─────────
function gastosView(ctx) {
  const d = ctx.data;
  const dias = G.porDia();
  const all = G.list();
  const gastado = G.total(all);
  const r = getRate(d).eurThb;
  const hoy = dayKey(now());
  // Comparación con lo previsto hasta hoy: efectivo de cada día ya empezado + pagos de alojamiento ya llegados.
  const p = presupuesto(d);
  const diasHasta = Object.entries(d.diaPorFecha).filter(([f, x]) => f <= hoy && x.dia.efectivo);
  const prevMax = diasHasta.reduce((a, [, x]) => a + x.dia.efectivo.max, 0)
    + p.alojamientos.filter((x) => x.est.desde <= hoy).reduce((a, x) => a + x.efectivo + x.deposito, 0);
  const pct = prevMax ? Math.round((gastado / prevMax) * 100) : 0;
  const dif = prevMax - gastado;
  const html = `
    <div class="card card-body">
      <div class="row between"><div><div class="eyebrow">Efectivo gastado</div><div class="big-num">${nf(gastado)} THB</div><div class="muted">≈ ${eur(gastado / r, 0)}</div></div><span style="font-size:32px">💵</span></div>
      ${prevMax ? `<div class="meter mt-s"><i class="${pct > 100 ? 'over' : pct > 90 ? 'warn' : ''}" style="width:${Math.min(100, pct)}%"></i></div>
      <div class="small muted mt-s">Previsto hasta hoy: <b>${nf(prevMax)} THB</b> (máx.) · ${dif >= 0 ? `<span class="chip green">${nf(dif)} por debajo</span>` : `<span class="chip red">${nf(-dif)} por encima</span>`}</div>` : ''}
    </div>
    ${all.length ? `<div class="row between mt-s"><span class="small muted">${all.length} gastos en efectivo · guardados solo en este móvil</span><button class="btn sm ghost" data-export>${icon('download', 'sm')} Exportar</button></div>` : ''}
    ${[...dias].map(([fecha, gs]) => {
      const ef = d.diaPorFecha[fecha]?.dia.efectivo;
      const tt = G.total(gs);
      const td = G.totalDia(fecha);
      const aloj = tt - td;
      const tag = ef ? `<span class="chip ${td > ef.max ? 'red' : 'green'}">${nf(td)} / ${nf(ef.max)} THB</span>` : `<span class="small muted">${nf(tt)} THB</span>`;
      return `<div class="section"><h2 style="font-size:16px;text-transform:capitalize">${fmtDate(fecha, { weekday: 'long', day: 'numeric', month: 'short' })}</h2>${tag}</div>
        ${ef && aloj ? `<div class="tiny muted" style="margin:-6px 0 6px">+ ${nf(aloj)} THB de alojamiento (presupuesto aparte)</div>` : ''}
        <div class="list">${gs.map((g) => {
          const [, em, lbl] = G.catInfo(g.cat);
          return `<button data-g="${g.id}" style="width:100%;text-align:left"><div class="ico-tile green" style="font-size:20px">${em}</div><div class="grow"><div class="t">${esc(g.nota || lbl)}</div><div class="s">${hm(g.t)}${g.nota ? ` · ${esc(lbl)}` : ''}</div></div><div style="text-align:right"><b>${g.moneda === 'EUR' ? eur(g.importe) : `${nf(g.importe)} ฿`}</b>${g.moneda === 'EUR' ? `<div class="tiny muted">${nf(G.enThb(g))} ฿</div>` : ''}</div></button>`;
        }).join('')}</div>`;
    }).join('') || `<div class="empty"><div class="big">💵</div><p>Aún no hay gastos. Pulsa <b>+</b> para apuntar lo que pagues en efectivo.</p><p class="small muted">Lo pagado con tarjeta no hace falta apuntarlo.</p></div>`}
    <button class="fab" data-add aria-label="Añadir gasto en efectivo">${icon('plus', 'lg')}</button>`;
  const mount = (root) => {
    $('[data-add]', root).onclick = () => form(ctx);
    root.querySelectorAll('[data-g]').forEach((b) => { b.onclick = () => form(ctx, G.list().find((g) => g.id === b.dataset.g)); });
    const ex = $('[data-export]', root);
    if (ex) ex.onclick = async () => {
      const file = new File([G.toCsv()], 'gastos-tailandia.csv', { type: 'text/csv' });
      if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: 'Gastos Tailandia' }); return; } catch {} }
      const url = URL.createObjectURL(file);
      Object.assign(document.createElement('a'), { href: url, download: file.name }).click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    };
  };
  return [html, mount];
}

function form(ctx, g = null) {
  const r = getRate(ctx.data).eurThb;
  const t = g?.t ?? now();
  const local = new Date(t + 7 * 3600e3).toISOString().slice(0, 16); // hora de Tailandia
  sheet(`
    <h2>${g ? 'Editar gasto' : 'Nuevo gasto en efectivo'}</h2>
    <label class="field"><span>Importe</span><input class="input big" name="importe" inputmode="decimal" placeholder="0" value="${g ? nf(g.importe, g.moneda === 'EUR' ? 2 : 0) : ''}"></label>
    <div class="field"><span>Moneda</span><div class="opts">
      <label><input type="radio" name="moneda" value="THB" ${g?.moneda !== 'EUR' ? 'checked' : ''}><span>฿ THB</span></label>
      <label><input type="radio" name="moneda" value="EUR" ${g?.moneda === 'EUR' ? 'checked' : ''}><span>€ EUR</span></label></div></div>
    <div class="field"><span>Categoría</span><div class="opts">${G.CATEGORIAS.map(([id, em, l], i) => `<label><input type="radio" name="cat" value="${id}" ${(g ? g.cat === id : i === 0) ? 'checked' : ''}><span>${em} ${l}</span></label>`).join('')}</div></div>
    <label class="field"><span>Nota (opcional)</span><input class="input" name="nota" value="${esc(g?.nota ?? '')}" placeholder="Ej. Pad thai en Khao San"></label>
    <label class="field"><span>Fecha y hora (Tailandia)</span><input class="input" type="datetime-local" name="t" value="${local}"></label>
    <div class="btn-row">${g ? `<button class="btn danger" data-del>${icon('trash', 'sm')} Borrar</button>` : ''}<button class="btn" data-ok>${icon('check', 'sm')} Guardar</button></div>`, (sh, close) => {
    const val = (n) => sh.querySelector(`[name="${n}"]:checked`)?.value ?? sh.querySelector(`[name="${n}"]`).value;
    if (!g) setTimeout(() => sh.querySelector('[name="importe"]').focus(), 250);
    sh.querySelector('[data-ok]').onclick = () => {
      const importe = parseNum(val('importe'));
      if (!(importe > 0)) { toast('Introduce un importe'); return; }
      const tt = Date.parse(`${val('t')}:00+07:00`) || now();
      const data = { importe, moneda: val('moneda'), cat: val('cat'), nota: val('nota').trim(), t: tt, tasa: r };
      if (g) G.update(g.id, data); else G.add(data);
      close();
      toast('Gasto guardado');
      ctx.rerender();
    };
    const del = sh.querySelector('[data-del]');
    if (del) del.onclick = () => { if (confirm('¿Borrar este gasto?')) { G.remove(g.id); close(); ctx.rerender(); } };
  });
}
