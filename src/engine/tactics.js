// Formations, With/Without Ball (wib-wob) 5x5 grid defaults, and team selection.
import { roleRating, familiarity } from './attributes.js';
import { clamp } from '../core/rng.js';

// x: width 0 (left touchline) .. 1 (right touchline); y: depth 0 (own goal) .. 1 (opposition goal)
const S = (pos, x, y) => ({ pos, x, y });
export const FORMATIONS = {
  '4-4-2': [S('GK', .5, .04), S('DR', .88, .22), S('DC', .62, .18), S('DC', .38, .18), S('DL', .12, .22), S('MR', .88, .5), S('MC', .62, .46), S('MC', .38, .46), S('ML', .12, .5), S('FC', .62, .8), S('FC', .38, .8)],
  '4-1-3-2': [S('GK', .5, .04), S('DR', .88, .22), S('DC', .62, .18), S('DC', .38, .18), S('DL', .12, .22), S('DMC', .5, .34), S('MR', .86, .54), S('MC', .5, .52), S('ML', .14, .54), S('FC', .62, .82), S('FC', .38, .82)],
  '4-3-3': [S('GK', .5, .04), S('DR', .88, .22), S('DC', .62, .18), S('DC', .38, .18), S('DL', .12, .22), S('MC', .7, .47), S('DMC', .5, .36), S('MC', .3, .47), S('AMR', .86, .76), S('FC', .5, .86), S('AML', .14, .76)],
  '3-5-2': [S('GK', .5, .04), S('DC', .76, .2), S('DC', .5, .16), S('DC', .24, .2), S('MR', .9, .52), S('MC', .66, .46), S('DMC', .5, .36), S('MC', .34, .46), S('ML', .1, .52), S('FC', .62, .82), S('FC', .38, .82)],
  '4-2-3-1': [S('GK', .5, .04), S('DR', .88, .22), S('DC', .62, .18), S('DC', .38, .18), S('DL', .12, .22), S('DMC', .64, .36), S('DMC', .36, .36), S('AMR', .86, .68), S('AMC', .5, .66), S('AML', .14, .68), S('FC', .5, .86)],
  '5-3-2': [S('GK', .5, .04), S('DR', .9, .26), S('DC', .7, .18), S('DC', .5, .15), S('DC', .3, .18), S('DL', .1, .26), S('MC', .72, .48), S('MC', .5, .44), S('MC', .28, .48), S('FC', .62, .8), S('FC', .38, .8)],
};

export const MENTALITY = ['Defensive', 'Cautious', 'Normal', 'Attacking', 'All-Out Attack'];
export const PASSING = ['short', 'mixed', 'direct'];
export const TACKLING = ['easy', 'normal', 'hard'];
export const RUNS = ['none', 'forward', 'diagonal', 'wide'];

const toCell = (v) => clamp(Math.floor(v * 5), 0, 4);

export function defaultSlots(formation) {
  return FORMATIONS[formation].map((s) => {
    const col = toCell(s.x), row = toCell(s.y);
    let wibRow = row, wobRow = row;
    if (s.pos === 'GK') { wibRow = 0; wobRow = 0; }
    else if (['DR', 'DL'].includes(s.pos)) { wibRow = Math.min(4, row + 1); }
    else if (['MR', 'ML', 'MC', 'AMR', 'AML', 'AMC'].includes(s.pos)) { wibRow = Math.min(4, row + 1); wobRow = Math.max(1, row - 1); }
    else if (s.pos === 'FC') { wobRow = Math.max(2, row - 1); }
    return { ...s, wib: { c: col, r: wibRow }, wob: { c: col, r: wobRow }, run: s.pos === 'FC' ? 'forward' : 'none' };
  });
}

export function defaultInstructions() {
  return { mentality: 2, passing: 'mixed', tackling: 'normal', pressing: false, offsideTrap: false, counter: false, menBehindBall: false };
}

export function createTactic(formation = '4-4-2') {
  return { formation, slots: defaultSlots(formation), lineup: [], subs: [], instructions: defaultInstructions(), captain: null, penaltyTaker: null, freeKickTaker: null, cornerTaker: null };
}

export function changeFormation(tactic, formation) {
  const old = tactic.lineup.slice();
  tactic.formation = formation;
  tactic.slots = defaultSlots(formation);
  tactic.lineup = old.slice(0, 11);
}

export const available = (p, date) => p && !p.injury && !(p.suspension > 0);

// Greedy best-XI selection by role rating, condition and fitness.
export function autoPick(club, players, tactic) {
  const pool = club.playerIds.map((id) => players[id]).filter((p) => available(p));
  const used = new Set();
  const lineup = new Array(tactic.slots.length).fill(null);
  const order = tactic.slots.map((s, i) => i).sort((a, b) => (tactic.slots[a].pos === 'GK' ? -1 : 0) - (tactic.slots[b].pos === 'GK' ? -1 : 0));
  // Fill scarce slots first: compute candidate counts with familiarity 1.
  order.sort((a, b) => {
    const ca = pool.filter((p) => p.positions.includes(tactic.slots[a].pos)).length;
    const cb = pool.filter((p) => p.positions.includes(tactic.slots[b].pos)).length;
    return ca - cb;
  });
  for (const i of order) {
    const pos = tactic.slots[i].pos;
    let best = null, bestScore = -1;
    for (const p of pool) {
      if (used.has(p.id)) continue;
      const score = roleRating(p, pos) * (0.6 + 0.4 * (p.condition / 100));
      if (score > bestScore) { bestScore = score; best = p; }
    }
    if (best) { lineup[i] = best.id; used.add(best.id); }
  }
  tactic.lineup = lineup;
  // Subs: GK + best remaining outfielders covering D/M/F
  const rest = pool.filter((p) => !used.has(p.id));
  const subs = [];
  const gk = rest.filter((p) => p.positions.includes('GK')).sort((a, b) => b.ca - a.ca)[0];
  if (gk) subs.push(gk.id);
  rest.filter((p) => !p.positions.includes('GK')).sort((a, b) => b.ca * (b.condition / 100) - a.ca * (a.condition / 100)).slice(0, 6).forEach((p) => subs.push(p.id));
  tactic.subs = subs;
  const xi = lineup.map((id) => players[id]).filter(Boolean);
  const byInfluence = xi.slice().sort((a, b) => (b.attrs.influence + b.ca / 20) - (a.attrs.influence + a.ca / 20));
  tactic.captain = byInfluence[0]?.id ?? null;
  tactic.penaltyTaker = xi.slice().sort((a, b) => b.attrs.penalties - a.attrs.penalties)[0]?.id ?? null;
  tactic.freeKickTaker = xi.slice().sort((a, b) => b.attrs.setPieces - a.attrs.setPieces)[0]?.id ?? null;
  tactic.cornerTaker = xi.slice().sort((a, b) => (b.attrs.setPieces + b.attrs.crossing) - (a.attrs.setPieces + a.attrs.crossing))[0]?.id ?? null;
  return tactic;
}

// Ensure lineup still valid (injuries, sold players). Returns true if repaired.
export function validateLineup(club, players, tactic) {
  const ids = new Set(club.playerIds);
  let broken = tactic.lineup.length !== tactic.slots.length;
  for (const id of tactic.lineup) if (!id || !ids.has(id) || !available(players[id])) broken = true;
  if (broken) {
    // keep valid ones in place, fill gaps
    const keep = tactic.lineup.map((id) => (id && ids.has(id) && available(players[id]) ? id : null));
    autoPick(club, players, tactic);
    const auto = tactic.lineup.slice();
    const used = new Set(keep.filter(Boolean));
    tactic.lineup = keep.map((id, i) => id || (auto[i] && !used.has(auto[i]) ? (used.add(auto[i]), auto[i]) : null));
    // fill any remaining nulls
    for (let i = 0; i < tactic.lineup.length; i++) {
      if (!tactic.lineup[i]) {
        const cand = club.playerIds.map((id) => players[id]).filter((p) => available(p) && !used.has(p.id))
          .sort((a, b) => roleRating(b, tactic.slots[i].pos) - roleRating(a, tactic.slots[i].pos))[0];
        if (cand) { tactic.lineup[i] = cand.id; used.add(cand.id); }
      }
    }
    tactic.subs = tactic.subs.filter((id) => ids.has(id) && available(players[id]) && !used.has(id));
  }
  return broken;
}

// Wib-wob shape analysis used by the match engine.
export function shapeAnalysis(tactic) {
  const s = tactic.slots;
  const attackersWithBall = s.filter((x) => x.pos !== 'GK' && x.wib.r >= 3).length;
  const defendersWithoutBall = s.filter((x) => x.pos !== 'GK' && x.wob.r <= 1).length;
  const wobCols = new Set(s.filter((x) => x.pos !== 'GK' && x.wob.r <= 2).map((x) => x.wob.c));
  const wibCols = new Set(s.filter((x) => x.pos !== 'GK' && x.wib.r >= 2).map((x) => x.wib.c));
  const flankCoverL = [0, 1].some((c) => wobCols.has(c));
  const flankCoverR = [3, 4].some((c) => wobCols.has(c));
  const width = wibCols.size; // 1..5
  const runs = s.filter((x) => x.run !== 'none').length;
  return { attackersWithBall, defendersWithoutBall, flankCoverL, flankCoverR, width, runs };
}

export { familiarity };
