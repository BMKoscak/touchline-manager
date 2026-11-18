// Context-aware full-window backgrounds, CM 01/02 ".pic"-style, resolved live from the web.
// Priority: TheSportsDB (team id or premium key) → Wikipedia PageImages (Wikimedia Commons) → Unsplash (if key) → procedural fallback.
// Resolved images are cached as blobs in IndexedDB, plus an in-memory object-URL map for instant (<16ms) repeats.
import { idb } from '../core/storage.js';

const WIKI = 'https://en.wikipedia.org/w/api.php';
const BAD_IMG = /logo|crest|badge|emblem|map|locator|kit|flag|\.svg/i;

async function getJSON(url, timeout = 6000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout);
  try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error(r.status); return await r.json(); }
  finally { clearTimeout(t); }
}

export class BackgroundService {
  constructor(settings) {
    this.settings = settings;
    this.mem = new Map(); // key -> { url, credit }
    this.inflight = new Map();
    this.currentKey = null;
    this.layers = [document.getElementById('bg-a'), document.getElementById('bg-b')];
    this.front = 0;
    this.creditEl = document.getElementById('bg-credit');
  }

  keyFor(ctx) {
    switch (ctx.kind) {
      case 'club': case 'match': case 'player': return `stadium:${ctx.club.id}`;
      case 'competition': return `comp:${ctx.league.id}`;
      default: return 'default';
    }
  }

  /** Show the background for a context: { kind: 'club'|'match'|'player'|'competition'|'default', club?, league? } */
  async show(ctx) {
    const key = this.keyFor(ctx);
    if (key === this.currentKey) return;
    this.currentKey = key;
    const hit = this.mem.get(key);
    if (hit) { this.apply(hit); return; }
    this.apply({ url: null, gradient: this.fallbackGradient(ctx), credit: '' });
    if (!this.settings.fetchBackgrounds) return;
    const res = await this.resolve(key, ctx);
    if (res && this.currentKey === key) this.apply(res);
  }

  fallbackGradient(ctx) {
    const [c1, c2] = ctx.club?.colors || ['#123', '#234'];
    return `radial-gradient(ellipse at 50% 120%, ${c1}55 0%, transparent 60%), repeating-linear-gradient(90deg, #0c3a1d 0 80px, #0e4322 80px 160px), linear-gradient(180deg, #050a14 0%, ${c2}22 100%)`;
  }

  apply({ url, gradient, credit }) {
    const next = this.layers[1 - this.front], cur = this.layers[this.front];
    if (!next || !cur) return;
    next.style.backgroundImage = url ? `url("${url}")` : gradient;
    next.classList.add('visible'); cur.classList.remove('visible');
    this.front = 1 - this.front;
    if (this.creditEl) this.creditEl.textContent = credit || '';
  }

  resolve(key, ctx) {
    if (this.inflight.has(key)) return this.inflight.get(key);
    const p = (async () => {
      // 1) IndexedDB cache
      try {
        const cached = await idb.get('backgrounds', key);
        if (cached) {
          const url = cached.blob ? URL.createObjectURL(cached.blob) : cached.url;
          const res = { url, credit: cached.credit };
          this.mem.set(key, res);
          return res;
        }
      } catch { /* no idb */ }
      // 2) Live sources
      let found = null;
      try {
        if (ctx.kind === 'competition') found = await this.fromWikipedia(ctx.league.trophyQuery) || await this.fromWikipedia(ctx.league.wikiImage);
        else {
          found = await this.fromSportsDB(ctx.club).catch(() => null)
            || await this.fromWikipedia(`${ctx.club.stadium} stadium ${ctx.club.city}`).catch(() => null)
            || await this.fromWikipedia(ctx.club.stadium).catch(() => null);
        }
        if (!found && this.settings.unsplashKey) found = await this.fromUnsplash(ctx.kind === 'competition' ? 'football trophy' : `${ctx.club.city} football stadium`).catch(() => null);
      } catch (e) { console.warn('[bg] resolve failed', e); }
      if (!found) return null;
      // 3) Fetch blob (CORS permitting) and cache
      let blob = null;
      try { const r = await fetch(found.url, { mode: 'cors' }); if (r.ok) blob = await r.blob(); } catch { /* use URL only */ }
      const res = { url: blob ? URL.createObjectURL(blob) : found.url, credit: found.credit };
      this.mem.set(key, res);
      idb.set('backgrounds', key, { blob, url: found.url, credit: found.credit, at: Date.now() }).catch(() => {});
      return res;
    })();
    this.inflight.set(key, p);
    p.finally(() => this.inflight.delete(key));
    return p;
  }

  get tsdb() { return `https://www.thesportsdb.com/api/v1/json/${this.settings.thesportsdbKey || '123'}`; }

  async fromSportsDB(club) {
    // Free key: name search is restricted, so use a known team id (from the hydrator) when we have one.
    let team = null;
    if (club.sportsDbId) team = (await getJSON(`${this.tsdb}/lookupteam.php?id=${club.sportsDbId}`)).teams?.[0] || null;
    else if (this.settings.thesportsdbKey) team = ((await getJSON(`${this.tsdb}/searchteams.php?t=${encodeURIComponent(club.name)}`)).teams || []).find((t) => t.strSport === 'Soccer') || null;
    if (!team) return null;
    if (team.idVenue) {
      const v = await getJSON(`${this.tsdb}/lookupvenue.php?id=${team.idVenue}`).catch(() => null);
      const venue = v?.venues?.[0];
      const img = venue?.strThumb || venue?.strFanart1 || venue?.strFanart2;
      if (img) return { url: img, credit: `Photo: TheSportsDB — ${venue.strVenue || club.stadium}` };
    }
    const img = team.strStadiumThumb || team.strFanart1 || team.strFanart2 || team.strFanart3;
    return img ? { url: img, credit: 'Photo: TheSportsDB' } : null;
  }

  async fromWikipedia(query) {
    const url = `${WIKI}?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=4&prop=pageimages&piprop=thumbnail|name&pithumbsize=1920`;
    const j = await getJSON(url);
    const pages = Object.values(j.query?.pages || {}).sort((a, b) => a.index - b.index);
    const page = pages.find((p) => p.thumbnail?.source && !BAD_IMG.test(p.pageimage || '') && (p.thumbnail.width || 0) >= 800);
    return page ? { url: page.thumbnail.source, credit: `Photo: Wikimedia Commons — ${page.title}` } : null;
  }

  async fromUnsplash(query) {
    const j = await getJSON(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=5&client_id=${this.settings.unsplashKey}`);
    const r = j.results?.[0];
    return r ? { url: r.urls.regular, credit: `Photo: ${r.user?.name} / Unsplash` } : null;
  }

  // Player portrait cutouts / thumbnails (TheSportsDB). Cached by player name.
  async playerPhoto(player, club) {
    if (!this.settings.fetchPhotos) return null;
    if (player.photo) return player.photo;
    const key = `player:${player.name}`;
    if (this.mem.has(key)) return this.mem.get(key).url;
    try {
      const cached = await idb.get('backgrounds', key);
      if (cached !== undefined) { const url = cached?.blob ? URL.createObjectURL(cached.blob) : cached?.url || null; this.mem.set(key, { url }); return url; }
    } catch { /* ignore */ }
    let url = null;
    try {
      const j = await getJSON(`${this.tsdb}/searchplayers.php?p=${encodeURIComponent(player.name)}`);
      const list = (j.player || []).filter((p) => p.strSport === 'Soccer');
      const best = list.find((p) => club && p.strTeam && club.name.toLowerCase().includes(p.strTeam.toLowerCase().split(' ')[0])) || list[0];
      url = best?.strCutout || best?.strRender || best?.strThumb || null;
    } catch { /* offline */ }
    this.mem.set(key, { url });
    idb.set('backgrounds', key, { url, at: Date.now() }).catch(() => {});
    return url;
  }

  async clearCache() { this.mem.clear(); this.currentKey = null; await idb.clear('backgrounds').catch(() => {}); }
}
