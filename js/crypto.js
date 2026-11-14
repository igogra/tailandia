// Descifrado AES-256-GCM (clave PBKDF2) y almacenamiento de la clave en IndexedDB.
const DB = 'viaje';
const STORE = 'kv';

function idb() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function tx(mode, fn) {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
  });
}
export const idbGet = (k) => tx('readonly', (s) => s.get(k));
export const idbSet = (k, v) => tx('readwrite', (s) => s.put(v, k));
const idbDel = (k) => tx('readwrite', (s) => s.delete(k));

const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function deriveKey(password, meta) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64(meta.salt), iterations: meta.iter, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
}

export async function decrypt(key, buf) {
  const u = new Uint8Array(buf);
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.subarray(0, 12) }, key, u.subarray(12));
}

async function gunzipJson(buf) {
  const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(stream).text());
}

async function fetchBin(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${path}`);
  return r.arrayBuffer();
}

export async function loadData(key, meta) {
  return gunzipJson(await decrypt(key, await fetchBin(meta.data)));
}

/** Intenta abrir con la clave guardada. Devuelve {key, data} o null. */
export async function unlockStored(meta) {
  try {
    const saved = await idbGet('key');
    if (!saved || saved.salt !== meta.salt) return null;
    const data = await loadData(saved.key, meta);
    return { key: saved.key, data };
  } catch {
    return null;
  }
}

/** Deriva la clave de la contraseña; si descifra, la guarda. Lanza error si es incorrecta. */
export async function unlock(password, meta) {
  const key = await deriveKey(password, meta);
  let data;
  try {
    data = await loadData(key, meta);
  } catch (e) {
    if (e.name === 'OperationError') throw new Error('Contraseña incorrecta');
    throw e;
  }
  await idbSet('key', { salt: meta.salt, key });
  return { key, data };
}

export const forgetKey = () => idbDel('key');

// ───── Assets cifrados → Blob URL (memoizado) ─────
let KEY = null;
const urls = new Map();
export const setKey = (k) => { KEY = k; };

export function assetUrl(name, type = 'image/webp') {
  if (!urls.has(name)) {
    urls.set(name, fetchBin(`d/${name}.bin`)
      .then((b) => decrypt(KEY, b))
      .then((plain) => URL.createObjectURL(new Blob([plain], { type })))
      .catch((e) => { urls.delete(name); throw e; }));
  }
  return urls.get(name);
}

export async function assetBytes(name) {
  return decrypt(KEY, await fetchBin(`d/${name}.bin`));
}
