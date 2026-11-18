#!/usr/bin/env node
// Live roster hydration: pulls current squads (names, ages, positions, nationalities, values where available)
// for every seeded 2026/27 club from free open football sources, and writes public/data/hydrated.json.
// The game maps these into the 1–20 CM attribute engine at new-game time (src/data/generator.js).
//
// Sources (in priority order, per club):
//   1. TheSportsDB (free key "123" by default; set THESPORTSDB_KEY for a Patreon key)
//      search_all_teams.php → club ids, stadium, capacity, manager;  lookup_all_players.php → squad
//   2. Wikidata SPARQL (current P54 "member of sports team" statements without an end date)
//
// Usage:
//   node scripts/hydrate_db.js                 # all leagues, auto source
//   node scripts/hydrate_db.js --league svn1   # one league (eng1 esp1 ita1 ger1 fra1 svn1)
//   node scripts/hydrate_db.js --source wikidata
//   node scripts/hydrate_db.js --merge         # keep clubs from the previous file that fail this run
//
// Requires Node 18+ (global fetch).
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEAGUES, CLUBS } from '../src/data/leagues.js';
import { normalizePosition } from '../src/engine/attributes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/data/hydrated.json');
const TSDB_KEY = process.env.THESPORTSDB_KEY || '123';
const TSDB = `https://www.thesportsdb.com/api/v1/json/${TSDB_KEY}`;
const UA = 'TouchlineManager/1.0 (open-source football manager game; roster hydration)';
const SEASON_START = new Date('2026-07-01T00:00:00Z');

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : def; };
const ONLY = opt('league', null);
const SOURCE = opt('source', 'auto');
const MERGE = !!opt('merge', false);
const DELAY = Number(opt('delay', TSDB_KEY === '123' ? 2100 : 300)); // free tier ≈ 30 req/min

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastTsdb = 0;
async function tsdb(path) {
  const wait = lastTsdb + DELAY - Date.now();
  if (wait > 0) await sleep(wait);
  lastTsdb = Date.now();
  const r = await fetch(`${TSDB}/${path}`, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`TheSportsDB ${path}: HTTP ${r.status}`);
  const txt = await r.text();
  try { return JSON.parse(txt); } catch { throw new Error(`TheSportsDB ${path}: not JSON`); }
}

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\b(fc|cf|ac|as|afc|sc|ssc|sv|vfb|vfl|rc|rcd|ud|ca|nk|ns|1\.|tsg|bv|04|05|07|1907|1903|club|de|la|calcio)\b/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
function similarity(a, b) {
  const A = new Set(norm(a).split(' ').filter(Boolean)), B = new Set(norm(b).split(' ').filter(Boolean));
  if (!A.size || !B.size) return 0;
  let inter = 0; for (const x of A) if (B.has(x)) inter++;
  return inter / Math.min(A.size, B.size);
}

function ageAt(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(+d)) return null;
  let a = SEASON_START.getUTCFullYear() - d.getUTCFullYear();
  if (SEASON_START < new Date(Date.UTC(SEASON_START.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))) a--;
  return a;
}

// "€50m", "£45.5M", "$12,000,000", "Free", "Loan" → number in EUR (approx)
function parseMoney(s) {
  if (!s) return null;
  const t = String(s).toLowerCase().replace(/,/g, '');
  const m = t.match(/([€£$])?\s*([\d.]+)\s*(m|mil|million|k|bn)?/);
  if (!m) return null;
  let v = parseFloat(m[2]);
  if (Number.isNaN(v)) return null;
  const unit = m[3];
  if (unit === 'm' || unit === 'mil' || unit === 'million') v *= 1e6; else if (unit === 'k') v *= 1e3; else if (unit === 'bn') v *= 1e9;
  if (v < 1000) return null;
  if (m[1] === '£') v *= 1.17; else if (m[1] === '$') v *= 0.92;
  return Math.round(v);
}

const NAT_CODES = {
  england: 'ENG', spain: 'ESP', italy: 'ITA', germany: 'GER', france: 'FRA', slovenia: 'SVN', brazil: 'BRA', portugal: 'POR', netherlands: 'NED',
  croatia: 'CRO', serbia: 'SRB', argentina: 'ARG', norway: 'NOR', sweden: 'SWE', denmark: 'DEN', belgium: 'BEL', switzerland: 'SUI', austria: 'AUT',
  'united states': 'USA', usa: 'USA', canada: 'CAN', mexico: 'MEX', uruguay: 'URU', ecuador: 'ECU', colombia: 'COL', egypt: 'EGY', morocco: 'MAR',
  algeria: 'ALG', cameroon: 'CMR', "cote d'ivoire": 'CIV', 'ivory coast': 'CIV', ghana: 'GHA', guinea: 'GUI', senegal: 'AFR', nigeria: 'AFR', mali: 'AFR',
  turkey: 'TUR', 'türkiye': 'TUR', georgia: 'GEO', hungary: 'HUN', poland: 'POL', slovakia: 'SVK', 'czech republic': 'CZE', czechia: 'CZE', scotland: 'SCO',
  wales: 'WAL', ireland: 'IRL', 'republic of ireland': 'IRL', kosovo: 'KVX', 'bosnia and herzegovina': 'SRB', 'north macedonia': 'SRB', montenegro: 'SRB',
  japan: 'JPN', 'south korea': 'KOR', korea: 'KOR', australia: 'AUS', uzbekistan: 'UZB', ukraine: 'UKR', greece: 'GRE', romania: 'ROU',
};
const natCode = (s) => NAT_CODES[String(s || '').toLowerCase().trim()] || (s ? String(s).slice(0, 3).toUpperCase() : null);

// ---------------- TheSportsDB ----------------
async function tsdbLeague(league) {
  const j = await tsdb(`search_all_teams.php?l=${encodeURIComponent(league.sportsDbName)}`);
  return (j.teams || []).filter((t) => t.strSport === 'Soccer');
}

function matchTeam(club, teams) {
  let best = null, score = 0;
  for (const t of teams) {
    const s = Math.max(similarity(club.name, t.strTeam), similarity(club.name, t.strTeamAlternate || ''), similarity(club.short, t.strTeamShort || '') * 0.9);
    if (s > score) { score = s; best = t; }
  }
  return score >= 0.5 ? best : null;
}

async function tsdbSquad(team) {
  const j = await tsdb(`lookup_all_players.php?id=${team.idTeam}`);
  const list = (j.player || []).filter((p) => (p.strSport || 'Soccer') === 'Soccer' && !/manager|coach/i.test(p.strPosition || ''));
  return list.map((p) => ({
    name: p.strPlayer,
    positions: normalizePosition(p.strPosition),
    position: p.strPosition,
    age: ageAt(p.dateBorn),
    nat: natCode(p.strNationality),
    value: parseMoney(p.strSigning),
    sportsDbId: p.idPlayer,
    photo: p.strCutout || p.strRender || p.strThumb || null,
  })).filter((p) => p.name && (p.age === null || (p.age >= 15 && p.age <= 42)));
}

// ---------------- Wikidata ----------------
async function wikidataClubQid(club) {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=6&search=${encodeURIComponent(club.name)}`;
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`wbsearchentities HTTP ${r.status}`);
  const j = await r.json();
  const hit = (j.search || []).find((x) => /football club|association football|soccer/i.test(x.description || '') && !/women|youth|reserve|under-|B team/i.test(x.description || '') && !/women/i.test(x.label || ''));
  return hit?.id || null;
}

async function wikidataSquad(qid) {
  const sparql = `
SELECT ?player ?playerLabel ?dob ?posLabel ?natLabel WHERE {
  ?player p:P54 ?st . ?st ps:P54 wd:${qid} .
  FILTER NOT EXISTS { ?st pq:P582 ?end }
  OPTIONAL { ?st pq:P580 ?start }
  ?player wdt:P106 wd:Q937857 ; wdt:P569 ?dob .
  FILTER(?dob >= "1984-01-01"^^xsd:dateTime)
  FILTER NOT EXISTS { ?player wdt:P21 wd:Q6581072 }
  OPTIONAL { ?player wdt:P413 ?pos }
  OPTIONAL { ?player wdt:P1532 ?nat }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;
  const r = await fetch(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`, { headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' } });
  if (!r.ok) throw new Error(`Wikidata SPARQL HTTP ${r.status}`);
  const j = await r.json();
  const byId = new Map();
  for (const b of j.results.bindings) {
    const id = b.player.value;
    const cur = byId.get(id) || { name: b.playerLabel?.value, dob: b.dob?.value, pos: new Set(), nat: b.natLabel?.value };
    if (b.posLabel?.value) cur.pos.add(b.posLabel.value);
    byId.set(id, cur);
  }
  return [...byId.values()].filter((p) => p.name && !/^Q\d+$/.test(p.name)).map((p) => {
    const positions = [...new Set([...p.pos].flatMap((x) => normalizePosition(x)))];
    return { name: p.name, positions: positions.length ? positions.slice(0, 3) : ['MC'], age: ageAt(p.dob), nat: natCode(p.nat), value: null };
  }).filter((p) => p.age !== null && p.age >= 16 && p.age <= 39);
}

// ---------------- main ----------------
async function main() {
  const out = { generatedAt: new Date().toISOString(), season: '2026/27', sources: [], clubs: {} };
  if (MERGE) { try { Object.assign(out.clubs, JSON.parse(await readFile(OUT, 'utf8')).clubs || {}); } catch { /* none */ } }
  const leagues = LEAGUES.filter((l) => !ONLY || l.id === ONLY);
  let ok = 0, fail = 0;
  for (const lg of leagues) {
    console.log(`\n=== ${lg.name} ===`);
    let teams = [];
    if (SOURCE !== 'wikidata') {
      try { teams = await tsdbLeague(lg); console.log(`  TheSportsDB: ${teams.length} teams listed`); }
      catch (e) { console.warn(`  TheSportsDB league lookup failed: ${e.message}`); }
    }
    for (const club of CLUBS[lg.id]) {
      const rec = { name: club.name };
      let players = [];
      const team = teams.length ? matchTeam(club, teams) : null;
      if (team) {
        rec.sportsDbId = team.idTeam;
        if (team.strStadium) rec.stadium = team.strStadium;
        const cap = parseInt(team.intStadiumCapacity, 10); if (cap > 500) rec.capacity = cap;
        if (team.strManager) rec.manager = team.strManager;
      }
      const tryTsdb = async () => {
        if (!team) return;
        try { const sq = await tsdbSquad(team); if (sq.length > players.length) { players = sq; rec.source = 'thesportsdb'; } }
        catch (e) { console.warn(`  ${club.name}: TheSportsDB squad failed (${e.message})`); }
      };
      const tryWikidata = async () => {
        try {
          const qid = await wikidataClubQid(club);
          if (qid) { const wd = await wikidataSquad(qid); if (wd.length > players.length) { players = wd; rec.source = 'wikidata'; rec.wikidata = qid; } }
          await sleep(1100);
        } catch (e) { console.warn(`  ${club.name}: Wikidata failed (${e.message})`); }
      };
      // The free TheSportsDB key ("123") does not expose full squads, so prefer Wikidata unless a premium key is set.
      const order = SOURCE === 'tsdb' ? [tryTsdb] : SOURCE === 'wikidata' ? [tryWikidata] : TSDB_KEY === '123' ? [tryWikidata, tryTsdb] : [tryTsdb, tryWikidata];
      for (const fn of order) { if (players.length >= 14) break; await fn(); }
      // Keep a sensible squad size: drop the oldest surplus beyond 34
      players = players.sort((a, b) => (a.age ?? 25) - (b.age ?? 25)).slice(0, 34);
      if (players.length >= 14) {
        rec.players = players; out.clubs[club.id] = rec; ok++;
        console.log(`  ✓ ${club.name.padEnd(30)} ${String(players.length).padStart(2)} players  [${rec.source}]`);
      } else {
        fail++;
        if (rec.stadium || rec.manager) out.clubs[club.id] = { ...(out.clubs[club.id] || {}), ...rec };
        console.log(`  ✗ ${club.name.padEnd(30)} only ${players.length} players found — seed squad will be used`);
      }
    }
  }
  out.sources = ['TheSportsDB (thesportsdb.com)', 'Wikidata (CC0)'];
  if (!Object.values(out.clubs).some((c) => c.players?.length)) {
    console.error('\nNo squads could be fetched (are you online?). Existing data left untouched.');
    process.exit(2);
  }
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(out, null, 1));
  console.log(`\nWrote ${OUT}\n${ok} clubs hydrated, ${fail} fell back to the seed database. Start a NEW game to use the live rosters.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
