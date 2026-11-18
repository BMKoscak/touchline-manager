// Tiny IndexedDB key-value wrapper (saves, background cache, TTS phrase cache).
const DB_NAME = 'touchline-manager';
const DB_VERSION = 1;
const STORES = ['saves', 'backgrounds', 'tts', 'kv'];
let dbPromise = null;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => { for (const s of STORES) if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const st = t.objectStore(store);
    const req = fn(st);
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const idb = {
  get: (store, key) => tx(store, 'readonly', (s) => s.get(key)),
  set: (store, key, value) => tx(store, 'readwrite', (s) => s.put(value, key)),
  del: (store, key) => tx(store, 'readwrite', (s) => s.delete(key)),
  keys: (store) => tx(store, 'readonly', (s) => s.getAllKeys()),
  clear: (store) => tx(store, 'readwrite', (s) => s.clear()),
};

// Settings in localStorage (small).
const SETTINGS_KEY = 'tm.settings';
export const DEFAULT_SETTINGS = {
  matchSpeed: 3, commentaryLevel: 2, voice: true, crowdVolume: 0.6, voiceVolume: 1,
  ttsProvider: 'webspeech', elevenKey: '', elevenLeadVoice: '', elevenAnalystVoice: '', elevenModel: 'eleven_flash_v2_5',
  webLeadVoice: '', webAnalystVoice: '',
  unsplashKey: '', thesportsdbKey: '', scanlines: true, vignette: true, fetchPhotos: true, fetchBackgrounds: true, autoSubs: false,
};
export function loadSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; } catch { return { ...DEFAULT_SETTINGS }; }
}
export function saveSettings(s) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ } }
