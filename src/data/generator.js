// Builds the playable world from the seed database (+ optional hydrated live data).
import { LEAGUES, CLUBS } from './leagues.js';
import { SEED_PLAYERS } from './seedPlayers.js';
import { NAME_POOLS, LEAGUE_NAT_MIX } from './names.js';
import { generateAttributes, valueFromAbility, wageFromAbility, abilityFromValue, clubTargetCA, normalizePosition } from '../engine/attributes.js';
import { createTactic, autoPick, FORMATIONS } from '../engine/tactics.js';
import { clamp } from '../core/rng.js';

const TEMPLATE = { GK: 3, DR: 2, DC: 4, DL: 2, DMC: 2, MC: 3, MR: 1, ML: 1, AMR: 1, AMC: 1, AML: 1, FC: 3 };
const ADJ_FILL = { MR: ['AMR'], ML: ['AML'], AMR: ['MR'], AML: ['ML'], DMC: ['MC'], AMC: ['MC'] };

export function leagueById(id) { return LEAGUES.find((l) => l.id === id); }

function makeName(rng, nat, usedNames, clubLast = null) {
  const pool = NAME_POOLS[nat] || NAME_POOLS.ENG;
  for (let i = 0; i < 60; i++) {
    const last = rng.pick(pool.last);
    if (clubLast && i < 40 && clubLast.has(last)) continue; // avoid two "Majcen"s in one squad
    const n = `${rng.pick(pool.first)} ${last}`;
    if (!usedNames.has(n)) { usedNames.add(n); clubLast?.add(last); return n; }
  }
  // Fall back to a double surname (common in many football nations) rather than a numeric suffix.
  for (let i = 0; i < 60; i++) {
    const l1 = rng.pick(pool.last), l2 = rng.pick(pool.last.filter((x) => x !== l1));
    const n = `${rng.pick(pool.first)} ${l1} ${l2}`;
    if (!usedNames.has(n)) { usedNames.add(n); return n; }
  }
  return `${rng.pick(pool.first)} ${rng.pick(pool.first)} ${rng.pick(pool.last)}`;
}

function pickNat(rng, leagueId) {
  const mix = LEAGUE_NAT_MIX[leagueId] || [['ENG', 1]];
  return rng.weighted(mix, (m) => m[1])[0];
}

let NEXT_ID = 1;
export function setNextId(n) { NEXT_ID = n; }
export function getNextId() { return NEXT_ID; }
export function newPlayerId() { return 'p' + (NEXT_ID++); }

export function createPlayer(rng, { name, nat, age, positions, ca, pa, clubId, leagueId, source = 'generated', extra = {} }) {
  const lg = leagueById(leagueId);
  const attrs = generateAttributes(ca, positions, rng, { age });
  const value = valueFromAbility(ca, pa, age, lg?.valueFactor ?? 1);
  return {
    id: newPlayerId(), name, nat, age, positions, attrs, ca, pa, clubId,
    value, wage: wageFromAbility(ca, lg?.valueFactor ?? 1),
    contractEnd: `${2027 + rng.int(0, 4)}-06-30`,
    condition: 100, morale: 7, injury: null, suspension: 0, yellowAccum: 0,
    squadStatus: 'First Team', transferListed: false, releaseClause: null,
    stats: { apps: 0, goals: 0, assists: 0, ratingSum: 0, rated: 0, yellows: 0, reds: 0, cleanSheets: 0 },
    history: [], source, ...extra,
  };
}

function generateFiller(rng, club, leagueId, pos, tier, usedNames, seeded = 0) {
  const target = clubTargetCA(club.rep) - (seeded >= 8 ? 9 : seeded >= 4 ? 5 : 0);
  const cap = Math.round(Math.min(clubTargetCA(club.rep) + (seeded >= 4 ? -4 : 8), 170));
  let age, ca, pa;
  if (tier === 'youth') {
    age = rng.int(17, 20); ca = clamp(Math.round(target - 30 + rng.normal(0, 8)), 25, 190);
    pa = clamp(Math.round(ca + 15 + Math.abs(rng.normal(20, 12))), ca, 200);
  } else {
    age = clamp(Math.round(rng.normal(26, 4)), 19, 35);
    const off = tier === 'starter' ? rng.normal(0, 7) : tier === 'backup' ? rng.normal(-14, 6) : rng.normal(-26, 6);
    ca = clamp(Math.round(target + off), 25, cap);
    pa = clamp(Math.round(age < 24 ? ca + Math.abs(rng.normal(12, 8)) : ca + Math.abs(rng.normal(2, 2))), ca, 200);
  }
  const positions = [pos];
  if (ADJ_FILL[pos] && rng.chance(0.45)) positions.push(rng.pick(ADJ_FILL[pos]));
  if (pos === 'DC' && rng.chance(0.15)) positions.push('DMC');
  if (pos === 'FC' && rng.chance(0.2)) positions.push(rng.pick(['AMR', 'AML', 'AMC']));
  const nat = pickNat(rng, leagueId);
  club._lastNames ||= new Set();
  return createPlayer(rng, { name: makeName(rng, nat, usedNames, club._lastNames), nat, age, positions, ca, pa, clubId: club.id, leagueId });
}

function clubFinances(club, lg) {
  const transfer = Math.round(1_000_000 * Math.exp((club.rep - 40) / 11) * (lg.id === 'svn1' ? 0.6 : 1));
  return { balance: Math.round(transfer * 1.6 + 2_000_000), transferBudget: transfer, wageBudget: 0, ledger: [], seasonIncome: {}, seasonExpense: {} };
}

/**
 * @param {RNG} rng
 * @param {object|null} hydrated - output of scripts/hydrate_db.js (public/data/hydrated.json)
 */
export function buildWorld(rng, hydrated = null) {
  NEXT_ID = 1;
  const clubs = {}, players = {};
  const usedNames = new Set();
  let hydratedClubs = 0;
  for (const lg of LEAGUES) {
    for (const base of CLUBS[lg.id]) {
      const club = { ...base, league: lg.id, playerIds: [], finances: clubFinances(base, lg), shortlist: [] };
      const hyd = hydrated?.clubs?.[club.id];
      if (hyd?.manager) club.manager = hyd.manager;
      if (hyd?.stadium) club.stadium = hyd.stadium;
      if (hyd?.capacity) club.capacity = hyd.capacity;
      if (hyd?.sportsDbId) club.sportsDbId = hyd.sportsDbId;
      const counts = Object.fromEntries(Object.keys(TEMPLATE).map((k) => [k, 0]));
      const add = (p) => { players[p.id] = p; club.playerIds.push(p.id); counts[p.positions[0]] = (counts[p.positions[0]] || 0) + 1; usedNames.add(p.name); };

      if (hyd?.players?.length >= 14) {
        hydratedClubs++;
        for (const hp of hyd.players) {
          const positions = hp.positions?.length ? hp.positions : normalizePosition(hp.position);
          const age = hp.age || 25;
          let ca = hp.value ? abilityFromValue(hp.value, age, lg.valueFactor) : clamp(Math.round(clubTargetCA(club.rep) + rng.normal(-8, 10)), 30, 190);
          ca = clamp(Math.round(ca * 0.6 + clubTargetCA(club.rep) * 0.4 + rng.normal(0, 4)), 25, 192); // blend toward club level for sanity
          const pa = clamp(Math.round(age < 24 ? ca + Math.abs(rng.normal(15, 10)) : ca + 2), ca, 200);
          add(createPlayer(rng, { name: hp.name, nat: hp.nat || lg.nat, age, positions, ca, pa, clubId: club.id, leagueId: lg.id, source: 'hydrated', extra: { sportsDbId: hp.sportsDbId || null, photo: hp.photo || null } }));
        }
      } else {
        for (const row of SEED_PLAYERS[club.id] || []) {
          const [name, posStr, age, nat, ca, pa] = row;
          add(createPlayer(rng, { name, nat, age, positions: posStr.split('/'), ca, pa, clubId: club.id, leagueId: lg.id, source: 'seed' }));
        }
      }
      // Fill template
      const seededCount = club.playerIds.length;
      for (const [pos, n] of Object.entries(TEMPLATE)) {
        let have = counts[pos] || 0;
        while (have < n) {
          const tier = have === 0 ? 'starter' : (pos === 'GK' && have === 2) ? 'third' : have >= 2 && rng.chance(0.4) ? 'youth' : 'backup';
          add(generateFiller(rng, club, lg.id, pos, tier, usedNames, seededCount));
          have++;
        }
      }
      // Two academy prospects
      for (let i = 0; i < 2; i++) add(generateFiller(rng, club, lg.id, rng.pick(['DC', 'MC', 'AMR', 'FC', 'DL']), 'youth', usedNames, seededCount));

      // Squad status
      const sorted = club.playerIds.map((id) => players[id]).sort((a, b) => b.ca - a.ca);
      sorted.forEach((p, i) => { p.squadStatus = p.age <= 20 && i > 14 ? 'Youngster' : i < 4 ? 'Key Player' : i < 13 ? 'First Team' : i < 19 ? 'Rotation' : 'Backup'; });
      club.finances.wageBudget = Math.round(sorted.reduce((s, p) => s + p.wage, 0) * 1.12);

      const formations = Object.keys(FORMATIONS);
      club.tactic = createTactic(club.rep > 80 ? rng.pick(['4-3-3', '4-2-3-1', '4-4-2']) : rng.pick(formations));
      if (club.rep > 75) club.tactic.instructions.pressing = rng.chance(0.6);
      club.tactic.instructions.passing = rng.pick(['short', 'mixed', 'mixed', 'direct']);
      autoPick(club, players, club.tactic);
      delete club._lastNames;
      clubs[club.id] = club;
    }
  }
  return { clubs, players, nextId: NEXT_ID, meta: { hydratedAt: hydrated?.generatedAt || null, hydratedClubs } };
}
