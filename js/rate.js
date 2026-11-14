// Tasa EUR→THB: guardada en el dispositivo > la del build. Actualizable online.
const K = 'rate';

export function getRate(data) {
  try {
    const s = JSON.parse(localStorage.getItem(K));
    if (s?.eurThb > 0) return s;
  } catch {}
  return data.tasa;
}

export function setRate(r) {
  localStorage.setItem(K, JSON.stringify(r));
}

export function resetRate() {
  localStorage.removeItem(K);
}

export async function refreshRate() {
  const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=THB', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  const j = await res.json();
  if (!j?.rates?.THB) throw new Error('Respuesta no válida');
  const r = { eurThb: j.rates.THB, fecha: j.date, fuente: 'BCE (frankfurter.app)' };
  setRate(r);
  return r;
}
