// Application controller: screens, navigation, sidebar, top bar, keyboard shortcuts, saving.
import { h, toast, contrast } from './dom.js';
import { Game, fmtDate } from '../engine/game.js';
import { loadSettings, saveSettings, idb } from '../core/storage.js';
import { CrowdAmbience } from '../audio/CrowdAmbience.js';
import { CommentaryAudioEngine } from '../audio/CommentaryAudioEngine.js';
import { BackgroundService } from '../services/BackgroundService.js';
import { LEAGUES } from '../data/leagues.js';

import * as Start from './screens/start.js';
import * as Inbox from './screens/inbox.js';
import * as Squad from './screens/squad.js';
import * as Player from './screens/player.js';
import * as Tactics from './screens/tactics.js';
import * as Training from './screens/training.js';
import * as Fixtures from './screens/fixtures.js';
import * as Table from './screens/table.js';
import * as Search from './screens/search.js';
import * as Finances from './screens/finances.js';
import * as Match from './screens/match.js';
import * as Negotiation from './screens/negotiation.js';
import * as Settings from './screens/settings.js';

const SCREENS = { start: Start, inbox: Inbox, squad: Squad, player: Player, tactics: Tactics, training: Training, fixtures: Fixtures, table: Table, search: Search, finances: Finances, match: Match, negotiation: Negotiation, settings: Settings };

const NAV = [
  ['inbox', 'Manager News', '1'], ['squad', 'Squad', '2'], ['tactics', 'Tactics', '3'], ['training', 'Training', '4'],
  ['fixtures', 'Fixtures', '5'], ['table', 'Table', '6'], ['search', 'Player Search', '7'], ['finances', 'Finances', '8'], ['settings', 'Settings', '9'],
];

export class App {
  constructor() {
    this.settings = loadSettings();
    this.crowd = new CrowdAmbience();
    this.audio = new CommentaryAudioEngine(this.crowd);
    this.audio.configure(this.settings);
    this.bg = new BackgroundService(this.settings);
    this.game = null;
    this.screen = null; this.params = {}; this.history = [];
    this.hydrated = null;
    this.main = document.getElementById('main');
    this.top = document.getElementById('topbar');
    this.side = document.getElementById('sidebar');
    this.bar = document.getElementById('commentary-bar');
    this.applyOverlay();
  }

  async init() {
    try { const r = await fetch('./data/hydrated.json', { cache: 'no-store' }); if (r.ok) this.hydrated = await r.json(); } catch { /* seed only */ }
    document.addEventListener('keydown', (e) => this.onKey(e));
    // Browsers require a user gesture before audio can start.
    const unlock = () => { this.crowd.resume(); this.crowd.setVolume(this.settings.crowdVolume); };
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
    this.go('start', {}, false);
  }

  setSetting(k, v) {
    this.settings[k] = v; saveSettings(this.settings);
    this.audio.configure(this.settings);
    if (k === 'crowdVolume') this.crowd.setVolume(v);
    if (k === 'scanlines' || k === 'vignette') this.applyOverlay();
    this.bg.settings = this.settings;
  }
  applyOverlay() {
    const o = document.getElementById('overlay');
    o.classList.toggle('scan', !!this.settings.scanlines);
    o.classList.toggle('vignette', !!this.settings.vignette);
  }

  setTheme(club) {
    const root = document.documentElement.style;
    let [c1, c2] = club ? club.colors : ['#1b4fa0', '#ffffff'];
    if (c1.toLowerCase() === '#ffffff') [c1, c2] = [c2, c1]; // avoid white headers
    root.setProperty('--club1', c1);
    root.setProperty('--club2', contrast(c1) === '#ffffff' ? (c2.toLowerCase() === c1.toLowerCase() ? '#fff' : (contrast(c2) === '#0b1224' ? c2 : '#ffffff')) : '#0b1224');
  }

  startGame(game) {
    this.game = game;
    this.setTheme(game.user);
    this.history = [];
    this.go('inbox', {}, false);
    this.autosave();
  }

  go(name, params = {}, push = true) {
    if (this.screen && SCREENS[this.screen]?.leave) SCREENS[this.screen].leave(this);
    if (push && this.screen && this.screen !== name) this.history.push([this.screen, this.params]);
    if (this.history.length > 30) this.history.shift();
    this.screen = name; this.params = params;
    this.render();
  }
  back() { const prev = this.history.pop(); if (prev) this.go(prev[0], prev[1], false); }
  refresh() { this.render(); }

  render() {
    const S = SCREENS[this.screen];
    this.renderTop(); this.renderSide();
    this.main.innerHTML = '';
    this.main.scrollTop = 0;
    try { this.main.appendChild(S.render(this, this.params)); }
    catch (e) { console.error(e); this.main.appendChild(h('div', { class: 'panel' }, h('div', { class: 'body red' }, `Screen error: ${e.message}`))); }
    // Background context
    const ctx = S.bg ? S.bg(this, this.params) : (this.game ? { kind: 'club', club: this.game.user } : { kind: 'default' });
    this.bg.show(ctx);
  }

  renderTop() {
    const t = this.top; t.innerHTML = '';
    const g = this.game;
    t.appendChild(h('span', { class: 'club-title' }, g ? g.user.name : 'TOUCHLINE MANAGER 26/27'));
    if (g) t.appendChild(h('span', { class: 'date' }, fmtDate(g.date)));
    if (g && g.inWindow()) t.appendChild(h('span', { class: 'tag green', title: 'Transfer window open' }, 'WINDOW OPEN'));
    t.appendChild(h('span', { class: 'spacer' }));
    const s = this.settings;
    const speedLbl = h('span', {}, `${s.matchSpeed}x`);
    t.appendChild(h('label', { class: 'ctrl', title: 'Match speed' }, 'Speed', h('input', { type: 'range', min: 1, max: 20, value: s.matchSpeed, oninput: (e) => { this.setSetting('matchSpeed', +e.target.value); speedLbl.textContent = `${e.target.value}x`; } }), speedLbl));
    t.appendChild(h('label', { class: 'ctrl', title: 'Commentary frequency' }, 'Commentary',
      h('select', { onchange: (e) => this.setSetting('commentaryLevel', +e.target.value) },
        [[1, 'Key Highlights'], [2, 'Extended'], [3, 'Full 90']].map(([v, l]) => h('option', { value: v, selected: s.commentaryLevel === v }, l)))));
    t.appendChild(h('label', { class: 'ctrl', title: 'Spoken commentary' }, h('input', { type: 'checkbox', checked: s.voice, onchange: (e) => { this.setSetting('voice', e.target.checked); if (!e.target.checked) this.audio.cancel(); } }), 'Voice'));
    t.appendChild(h('label', { class: 'ctrl', title: 'Crowd volume' }, 'Crowd', h('input', { type: 'range', min: 0, max: 100, value: Math.round(s.crowdVolume * 100), oninput: (e) => this.setSetting('crowdVolume', e.target.value / 100) })));
    if (g) t.appendChild(h('button', { class: 'btn small', onclick: () => this.saveGame('slot1', true), title: 'Save (Ctrl+S)' }, 'Save'));
  }

  renderSide() {
    const sd = this.side; sd.innerHTML = '';
    const g = this.game;
    if (!g) {
      sd.appendChild(h('div', { class: 'sidebar-foot', style: { marginTop: 0, borderTop: 'none' } }, 'Start a new career or load a saved game.'));
      return;
    }
    const pending = !!g.s.pendingMatch;
    sd.appendChild(h('button', { class: 'navbtn continue', onclick: () => this.continue() }, pending ? 'Go to Match' : 'Continue', h('span', { class: 'key', style: { position: 'static', marginLeft: '6px' } }, '␣')));
    for (const [id, label, key] of NAV) {
      const unread = id === 'inbox' ? g.unread() : 0;
      sd.appendChild(h('button', { class: `navbtn ${this.screen === id ? 'active' : ''}`, onclick: () => this.go(id) }, label, unread ? h('span', { class: 'badge' }, unread) : null, h('span', { class: 'key' }, key)));
    }
    const nf = g.nextFixture();
    sd.appendChild(h('div', { class: 'sidebar-foot' },
      nf ? h('div', {}, h('div', { class: 'yellow' }, 'Next match'), `${nf.home === g.user.id ? 'vs' : '@'} ${g.club(nf.home === g.user.id ? nf.away : nf.home).name}`, h('br'), fmtDate(nf.date)) : null,
      h('div', { style: { marginTop: '6px' } }, `${g.league(g.user.league).name} — ${ordinalPos(g.position(g.user.id))}`),
      h('div', { style: { marginTop: '6px' } }, `Board confidence: ${Math.round(g.s.board.confidence)}%`)));
  }

  continue() {
    const g = this.game;
    if (!g) return;
    if (this.screen === 'match') return;
    if (g.s.sacked) { toast('You have been sacked. Start a new game from the title screen.', true); return; }
    if (g.s.pendingMatch) { this.go('match'); return; }
    const res = g.continue();
    this.autosave();
    if (res.status === 'match') { toast('Match day!'); this.go('match'); }
    else if (res.status === 'news') this.go('inbox', { open: g.s.inbox[0]?.id });
    else this.refresh();
  }

  onKey(e) {
    const tag = (e.target.tagName || '').toLowerCase();
    if (['input', 'select', 'textarea'].includes(tag)) return;
    if (document.getElementById('modal').classList.contains('open')) return;
    if (this.screen === 'match' && Match.onKey(this, e)) { e.preventDefault(); return; }
    if (e.code === 'Space') { e.preventDefault(); this.continue(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (this.game) this.saveGame('slot1', true); return; }
    if (e.key === 'Escape') { this.back(); return; }
    if (this.game) { const n = NAV.find((x) => x[2] === e.key); if (n) this.go(n[0]); }
  }

  async saveGame(slot = 'slot1', announce = false) {
    if (!this.game) return;
    const st = this.game.serialize();
    const meta = { manager: st.managerName, club: this.game.user.name, clubId: st.userClubId, date: st.date, season: st.season, savedAt: Date.now() };
    try { await idb.set('saves', slot, { meta, state: st }); if (announce) toast('Game saved'); }
    catch (e) { toast(`Save failed: ${e.message}`, true); }
  }
  autosave() { clearTimeout(this._as); this._as = setTimeout(() => this.saveGame('autosave'), 400); }

  async listSaves() {
    try { const keys = await idb.keys('saves'); const out = []; for (const k of keys) { const v = await idb.get('saves', k); out.push({ slot: k, meta: v.meta }); } return out; }
    catch { return []; }
  }
  async loadGame(slot) {
    const v = await idb.get('saves', slot);
    if (!v) { toast('Save not found', true); return; }
    this.startGame(new Game(v.state));
    toast(`Loaded ${v.meta.club} — ${fmtDate(v.meta.date)}`);
  }

  // Commentary bar (CM 01/02 flashing team-coloured banner)
  showBar(on) { this.bar.hidden = !on; }
}

function ordinalPos(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
export { LEAGUES };
