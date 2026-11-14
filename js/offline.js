// Descarga todos los ficheros cifrados a la caché para uso 100% offline, con progreso.
// Reutiliza ficheros ya presentes en cachés de versiones anteriores (mismo nombre = mismo contenido)
// y, al terminar, borra las cachés de datos antiguas.
export const state = { status: 'idle', done: 0, total: 0, bytes: 0, totalBytes: 0, persisted: null, error: null };
const listeners = new Set();
export const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach((fn) => fn(state));

export const cacheName = (meta) => `data-${meta.v}`;
const fileName = (u) => new URL(u, location.href).pathname.split('/').pop();

export async function startOffline(meta) {
  if (!('caches' in window)) { state.status = 'unsupported'; emit(); return; }
  try {
    state.persisted = await navigator.storage?.persist?.().catch(() => false) ?? false;
  } catch { state.persisted = false; }
  const name = cacheName(meta);
  const cache = await caches.open(name);
  const have = new Set((await cache.keys()).map((r) => fileName(r.url)));
  let missing = meta.files.filter((f) => !have.has(fileName(f.n)));

  // Reutilizar lo que ya esté en cachés de datos anteriores
  const olds = (await caches.keys()).filter((k) => k.startsWith('data-') && k !== name);
  if (missing.length && olds.length) {
    const rest = [];
    for (const f of missing) {
      let hit = null;
      for (const k of olds) {
        hit = await (await caches.open(k)).match(f.n, { ignoreSearch: true });
        if (hit) break;
      }
      if (hit) await cache.put(f.n, hit);
      else rest.push(f);
    }
    missing = rest;
  }

  state.total = meta.files.length;
  state.totalBytes = meta.total;
  const missingSet = new Set(missing.map((f) => f.n));
  state.done = state.total - missing.length;
  state.bytes = meta.files.filter((f) => !missingSet.has(f.n)).reduce((a, f) => a + f.s, 0);
  if (missing.length) {
    state.status = 'running';
    emit();
    const queue = [...missing];
    let failed = 0;
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const f = queue.shift();
        try {
          const res = await fetch(f.n, { cache: 'reload' });
          if (!res.ok) throw new Error(res.status);
          await cache.put(f.n, res);
          state.done++;
          state.bytes += f.s;
        } catch {
          failed++;
        }
        emit();
      }
    }));
    state.status = failed ? 'error' : 'complete';
    state.error = failed ? `${failed} ficheros no se pudieron descargar. Reintenta con conexión.` : null;
  } else {
    state.status = 'complete';
  }
  emit();
  if (state.status === 'complete') await Promise.all(olds.map((k) => caches.delete(k)));
}

export async function shellStatus() {
  const keys = await caches.keys();
  return { shell: keys.some((k) => k.startsWith('shell-')), sw: !!navigator.serviceWorker?.controller };
}
