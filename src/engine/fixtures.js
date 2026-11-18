// Round-robin fixture generation and calendar scheduling.
import { LEAGUES, CLUBS } from '../data/leagues.js';

export const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const dayOfWeek = (iso) => new Date(iso + 'T12:00:00Z').getUTCDay(); // 0 Sun..6 Sat
export const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 86400000);

// Circle-method single round robin.
function singleRoundRobin(teams) {
  const t = teams.slice();
  if (t.length % 2) t.push(null);
  const n = t.length, rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const a = t[i], b = t[n - 1 - i];
      if (a && b) pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(pairs);
    t.splice(1, 0, t.pop());
  }
  return rounds;
}

export function generateLeagueFixtures(league, clubIds, rng, idStart = 1) {
  const base = singleRoundRobin(rng.shuffle(clubIds));
  const rounds = [];
  for (let leg = 0; leg < league.legs; leg++) {
    for (const r of base) rounds.push(r.map(([h, a]) => (leg % 2 === 0 ? [h, a] : [a, h])));
  }
  // Schedule: weekends (Sat), skipping break windows; if we run past season end, use midweek (Wed) rounds.
  const inBreak = (d) => league.breaks.some(([a, b]) => d >= a && d <= b);
  let d = league.start;
  while (dayOfWeek(d) !== 6) d = addDays(d, 1);
  const sats = [];
  while (d <= league.end) { if (!inBreak(d)) sats.push(d); d = addDays(d, 7); }
  let slots = sats.slice();
  if (slots.length < rounds.length) {
    // Add midweek (Wednesday) rounds, evenly spread, avoiding the first/last weeks.
    const need = rounds.length - slots.length;
    const mids = [];
    for (let i = 3; i < sats.length - 2; i++) { const w = addDays(sats[i], 4); if (!inBreak(w) && w < sats[i + 1]) mids.push(w); }
    const chosen = [];
    for (let k = 0; k < need && mids.length; k++) chosen.push(mids[Math.floor(((k + 0.5) * mids.length) / need)]);
    slots = [...new Set([...slots, ...chosen])].sort();
  }
  while (slots.length < rounds.length) slots.push(addDays(slots[slots.length - 1] || league.start, 7));
  const dates = slots.slice(0, rounds.length);
  const fixtures = [];
  let id = idStart;
  rounds.forEach((pairs, ri) => {
    for (const [home, away] of pairs) fixtures.push({ id: 'f' + id++, league: league.id, round: ri + 1, date: dates[ri], home, away, played: false, hg: 0, ag: 0 });
  });
  return fixtures;
}

export function generateAllFixtures(rng) {
  const all = [];
  let id = 1;
  for (const lg of LEAGUES) {
    const fx = generateLeagueFixtures(lg, CLUBS[lg.id].map((c) => c.id), rng, id);
    id += fx.length;
    all.push(...fx);
  }
  all.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return all;
}

export function computeTable(fixtures, leagueId, clubIds) {
  const rows = Object.fromEntries(clubIds.map((id) => [id, { club: id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, form: [] }]));
  for (const f of fixtures) {
    if (f.league !== leagueId || !f.played) continue;
    const h = rows[f.home], a = rows[f.away];
    if (!h || !a) continue;
    h.p++; a.p++; h.gf += f.hg; h.ga += f.ag; a.gf += f.ag; a.ga += f.hg;
    if (f.hg > f.ag) { h.w++; a.l++; h.pts += 3; h.form.push('W'); a.form.push('L'); }
    else if (f.hg < f.ag) { a.w++; h.l++; a.pts += 3; h.form.push('L'); a.form.push('W'); }
    else { h.d++; a.d++; h.pts++; a.pts++; h.form.push('D'); a.form.push('D'); }
  }
  const list = Object.values(rows);
  list.forEach((r) => { r.gd = r.gf - r.ga; r.form = r.form.slice(-5); });
  list.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.club.localeCompare(b.club));
  return list;
}
