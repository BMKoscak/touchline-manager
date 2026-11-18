// Tactics: formation board, drag & drop selection, With/Without Ball 5x5 grid, runs, team instructions.
import { h, panel, toast } from '../dom.js';
import { FORMATIONS, MENTALITY, RUNS, changeFormation, autoPick, defaultSlots, validateLineup } from '../../engine/tactics.js';
import { roleRating, familiarity, positionString } from '../../engine/attributes.js';
import { surname } from '../../engine/commentary.js';

let mode = 'pos'; // pos | wib | wob | runs
let selSlot = null;

export function render(app, params = {}) {
  const g = app.game;
  const club = g.user;
  validateLineup(club, g.s.players, club.tactic);
  return h('div', {},
    h('div', { class: 'screen-title' }, h('h1', {}, 'Tactics'), h('span', { class: 'sub' }, 'Click or drag players to pick the team. Use the With Ball / Without Ball grids to set where each player moves.')),
    board(app, { tactic: club.tactic, club, inMatch: false, onChange: () => app.refresh() }));
}

/** Reusable board (also used inside the live match). */
export function board(app, { tactic, club, inMatch, onChange, onPitchIds }) {
  const g = app.game;
  const P = (id) => g.s.players[id];
  const lockedSquad = inMatch; // in-match: only positions/instructions; subs happen on the match screen
  const pitch = h('div', { class: `pitch ${mode === 'wib' || mode === 'wob' ? 'zmode' : ''}` }, h('div', { class: 'circle' }), h('div', { class: 'box-top' }), h('div', { class: 'box-bot' }));
  const grid = h('div', { class: `grid5 ${mode === 'wib' || mode === 'wob' ? 'on' : ''}` });
  for (let r = 4; r >= 0; r--) for (let c = 0; c < 5; c++) {
    const cell = h('div', { onclick: () => {
      if (selSlot === null) return toast('Select a player first', true);
      tactic.slots[selSlot][mode] = { c, r };
      changed();
    } });
    if (selSlot !== null && (mode === 'wib' || mode === 'wob')) {
      const z = tactic.slots[selSlot][mode];
      if (z.c === c && z.r === r) cell.classList.add(mode === 'wib' ? 'cell-wib' : 'cell-wob');
    }
    grid.appendChild(cell);
  }
  pitch.appendChild(grid);

  const changed = () => { if (inMatch) onChange?.('tactic'); else onChange?.(); };
  const posOf = (s) => {
    if (mode === 'wib') return { x: (s.wib.c + 0.5) / 5, y: (s.wib.r + 0.5) / 5 };
    if (mode === 'wob') return { x: (s.wob.c + 0.5) / 5, y: (s.wob.r + 0.5) / 5 };
    return { x: s.x, y: s.y };
  };

  tactic.slots.forEach((s, i) => {
    const pid = tactic.lineup[i];
    const pl = pid ? P(pid) : null;
    if (inMatch && onPitchIds && pid && !onPitchIds.has(pid)) return; // sent off
    const { x, y } = posOf(s);
    const fam = pl ? familiarity(pl, s.pos) : 0;
    const chip = h('div', {
      class: `chip ${selSlot === i ? 'sel' : ''}`, draggable: true,
      style: { left: `${x * 100}%`, top: `${(1 - y) * 100}%` },
      title: pl ? `${pl.name} — ${s.pos} (${fam === 1 ? 'natural' : fam > 0.8 ? 'accomplished' : 'unfamiliar'})` : s.pos,
      onclick: () => {
        if (selSlot !== null && selSlot !== i && mode === 'pos') { [tactic.lineup[selSlot], tactic.lineup[i]] = [tactic.lineup[i], tactic.lineup[selSlot]]; selSlot = null; changed(); return; }
        selSlot = selSlot === i ? null : i; onChange?.('select');
      },
      ondragstart: (e) => { e.dataTransfer.setData('text/slot', String(i)); chip.classList.add('dragging'); },
      ondragend: () => chip.classList.remove('dragging'),
      ondragover: (e) => e.preventDefault(),
      ondrop: (e) => {
        e.preventDefault();
        const from = e.dataTransfer.getData('text/slot');
        const pidIn = e.dataTransfer.getData('text/player');
        if (from !== '') { const f = +from; [tactic.lineup[f], tactic.lineup[i]] = [tactic.lineup[i], tactic.lineup[f]]; changed(); }
        else if (pidIn && !lockedSquad) placePlayer(tactic, i, pidIn) && changed();
      },
    },
    h('div', { class: 'dot' }, s.pos),
    h('div', { class: `nm ${pl && fam < 0.7 ? 'bad' : pl && fam < 1 ? 'poor' : ''}` }, pl ? surname(pl.name) : '—'));
    pitch.appendChild(chip);
    if (mode === 'runs' || mode === 'pos') {
      if (s.run && s.run !== 'none') {
        const dx = s.run === 'wide' ? (s.x < 0.5 ? -0.12 : 0.12) : s.run === 'diagonal' ? (s.x < 0.5 ? 0.12 : -0.12) : 0;
        const dy = s.run === 'wide' ? 0.08 : 0.14;
        const W = 68, Hh = 100;
        const len = Math.hypot(dx * W, dy * Hh);
        const ang = Math.atan2(-dy * Hh, dx * W) * 180 / Math.PI;
        pitch.appendChild(h('div', { class: 'run-arrow', style: { left: `${x * 100}%`, top: `${(1 - y) * 100}%`, width: `${len}%`, transform: `rotate(${ang}deg)` } }));
      }
    }
  });

  // Mode tabs
  const modes = h('div', { class: 'tabs' }, [['pos', 'Positions'], ['wib', 'With Ball'], ['wob', 'Without Ball'], ['runs', 'Runs']].map(([k, l]) =>
    h('div', { class: `tab ${mode === k ? 'active' : ''}`, onclick: () => { mode = k; onChange?.('mode'); } }, l)));
  const sel = selSlot !== null ? tactic.slots[selSlot] : null;
  const help = h('div', { class: 'muted', style: { margin: '6px 0', minHeight: '18px' } },
    mode === 'pos' ? 'Click two players to swap them, or drag a squad player onto a shirt.'
      : mode === 'runs' ? (sel ? h('span', {}, `Run for ${sel.pos}: `, RUNS.map((r) => h('button', { class: `btn small ${sel.run === r ? 'club' : ''}`, style: { marginRight: '4px' }, onclick: () => { sel.run = r; changed(); } }, r))) : 'Select a player to set his attacking run.')
        : sel ? `Click a zone to set where ${P(tactic.lineup[selSlot])?.name || sel.pos} moves ${mode === 'wib' ? 'when we have the ball' : 'when the opposition has the ball'}.` : 'Select a player, then click a zone of the 5×5 grid.');

  // Right column: formation, instructions, squad list
  const ins = tactic.instructions;
  const formSel = h('select', { class: 'input', onchange: (e) => { changeFormation(tactic, e.target.value); selSlot = null; changed(); } }, Object.keys(FORMATIONS).map((f) => h('option', { selected: tactic.formation === f }, f)));
  const mentLbl = h('b', { class: 'yellow' }, MENTALITY[ins.mentality]);
  const chk = (key, label) => h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: ins[key], onchange: (e) => { ins[key] = e.target.checked; changed(); } }), label);
  const seg = (key, opts) => h('div', { style: { display: 'flex', gap: '2px' } }, opts.map((o) => h('button', { class: `btn small ${ins[key] === o ? 'club' : ''}`, onclick: () => { ins[key] = o; changed(); } }, o[0].toUpperCase() + o.slice(1))));
  const instructions = panel('Team Instructions', h('div', { style: { display: 'grid', gap: '7px' } },
    h('div', { class: 'row', style: { alignItems: 'center' } }, h('span', { style: { width: '90px' } }, 'Formation'), formSel,
      !inMatch ? h('button', { class: 'btn small', onclick: () => { autoPick(club, g.s.players, tactic); changed(); toast('Assistant picked the team'); } }, 'Auto pick') : null,
      h('button', { class: 'btn small', onclick: () => { tactic.slots = defaultSlots(tactic.formation); changed(); } }, 'Reset shape')),
    h('div', { class: 'row', style: { alignItems: 'center' } }, h('span', { style: { width: '90px' } }, 'Mentality'),
      h('input', { type: 'range', min: 0, max: 4, value: ins.mentality, oninput: (e) => { ins.mentality = +e.target.value; mentLbl.textContent = MENTALITY[ins.mentality]; }, onchange: () => changed() }), mentLbl),
    h('div', { class: 'row', style: { alignItems: 'center' } }, h('span', { style: { width: '90px' } }, 'Passing'), seg('passing', ['short', 'mixed', 'direct'])),
    h('div', { class: 'row', style: { alignItems: 'center' } }, h('span', { style: { width: '90px' } }, 'Tackling'), seg('tackling', ['easy', 'normal', 'hard'])),
    h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' } }, chk('pressing', 'Pressing'), chk('offsideTrap', 'Offside Trap'), chk('counter', 'Counter Attack'), chk('menBehindBall', 'Men Behind Ball'))));

  const squad = club.playerIds.map(P).filter(Boolean);
  const inXI = new Set(tactic.lineup);
  const subs = new Set(tactic.subs);
  const rows = squad.slice().sort((a, b) => (inXI.has(b.id) - inXI.has(a.id)) || (subs.has(b.id) - subs.has(a.id)) || (b.ca - a.ca));
  const list = h('table', { class: 'cm squad-pick' },
    h('thead', {}, h('tr', {}, h('th', {}, ''), h('th', {}, 'Name'), h('th', {}, 'Pos'), h('th', { class: 'num' }, 'Cond'), h('th', { class: 'num', title: 'Suitability for the selected slot' }, sel ? sel.pos : 'Rtg'), !lockedSquad ? h('th', {}, 'Sub') : null)),
    h('tbody', {}, rows.map((p) => {
      const unavailable = p.injury || p.suspension > 0;
      const tr = h('tr', {
        class: `click ${inXI.has(p.id) ? 'inxi' : subs.has(p.id) ? 'sub' : ''}`, draggable: !lockedSquad && !unavailable,
        ondragstart: (e) => e.dataTransfer.setData('text/player', p.id),
        onclick: () => {
          if (lockedSquad) return app.go('player', { id: p.id });
          if (selSlot === null) return app.go('player', { id: p.id });
          if (unavailable) return toast(`${p.name} is unavailable`, true);
          if (placePlayer(tactic, selSlot, p.id)) { selSlot = null; changed(); }
        },
      },
      h('td', {}, inXI.has(p.id) ? h('span', { class: 'green' }, tactic.slots[tactic.lineup.indexOf(p.id)]?.pos) : subs.has(p.id) ? h('span', { class: 'cyan' }, 'S') : ''),
      h('td', {}, h('b', { class: unavailable ? 'red' : '' }, p.name), p.injury ? h('span', { class: 'tag red' }, 'INJ') : p.suspension > 0 ? h('span', { class: 'tag orange' }, 'SUS') : null),
      h('td', { class: 'muted' }, positionString(p.positions)),
      h('td', { class: `num ${p.condition < 80 ? 'orange' : ''}` }, `${Math.round(p.condition)}%`),
      h('td', { class: 'num' }, (roleRating(p, sel ? sel.pos : p.positions[0])).toFixed(1)),
      !lockedSquad ? h('td', {}, inXI.has(p.id) ? '' : h('button', { class: 'btn small', onclick: (e) => { e.stopPropagation(); toggleSub(tactic, p.id); changed(); } }, subs.has(p.id) ? '−' : '+')) : null);
      return tr;
    })));

  const xi = tactic.lineup.map(P).filter(Boolean);
  const pickSel = (key, label) => h('div', { class: 'row', style: { alignItems: 'center' } }, h('span', { style: { width: '90px' } }, label),
    h('select', { class: 'input', onchange: (e) => { tactic[key] = e.target.value; } }, xi.map((p) => h('option', { value: p.id, selected: tactic[key] === p.id }, p.name))));
  const setPieces = panel('Set Pieces & Captain', h('div', { style: { display: 'grid', gap: '5px' } }, pickSel('captain', 'Captain'), pickSel('penaltyTaker', 'Penalties'), pickSel('freeKickTaker', 'Free kicks'), pickSel('cornerTaker', 'Corners')));

  return h('div', { class: 'tactics' },
    h('div', {}, modes, help, pitch),
    h('div', {}, instructions, panel(`Squad — ${tactic.subs.length}/7 subs`, list, { bodyStyle: { padding: 0, maxHeight: inMatch ? '300px' : '42vh', overflowY: 'auto' } }), setPieces));
}

function placePlayer(tactic, slotIdx, pid) {
  const cur = tactic.lineup.indexOf(pid);
  if (cur >= 0) { [tactic.lineup[cur], tactic.lineup[slotIdx]] = [tactic.lineup[slotIdx], tactic.lineup[cur]]; return true; }
  const out = tactic.lineup[slotIdx];
  tactic.lineup[slotIdx] = pid;
  const si = tactic.subs.indexOf(pid);
  if (si >= 0) { if (out) tactic.subs[si] = out; else tactic.subs.splice(si, 1); }
  return true;
}
function toggleSub(tactic, pid) {
  const i = tactic.subs.indexOf(pid);
  if (i >= 0) tactic.subs.splice(i, 1);
  else if (tactic.subs.length >= 7) toast('Maximum 7 substitutes', true);
  else tactic.subs.push(pid);
}
export function resetSelection() { selSlot = null; }
