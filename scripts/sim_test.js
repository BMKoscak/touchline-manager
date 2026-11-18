// Headless engine check: builds the world, simulates every league season and prints realism stats.
import { RNG } from '../src/core/rng.js';
import { buildWorld } from '../src/data/generator.js';
import { generateAllFixtures, computeTable } from '../src/engine/fixtures.js';
import { MatchSimulator } from '../src/engine/match.js';
import { LEAGUES, CLUBS } from '../src/data/leagues.js';
import { validateLineup } from '../src/engine/tactics.js';

const rng = new RNG(12345);
const t0 = Date.now();
const world = buildWorld(rng);
console.log(`World: ${Object.keys(world.clubs).length} clubs, ${Object.keys(world.players).length} players in ${Date.now() - t0}ms`);
const fixtures = generateAllFixtures(rng);
console.log(`Fixtures: ${fixtures.length}`);
for (const lg of LEAGUES) {
  const fx = fixtures.filter((f) => f.league === lg.id);
  console.log(`  ${lg.name}: ${fx.length} matches, ${fx[0].date} → ${fx[fx.length - 1].date}`);
}

const agg = { n: 0, goals: 0, shots: 0, ot: 0, corners: 0, fouls: 0, yellows: 0, reds: 0, home: 0, draw: 0, away: 0, pens: 0, offsides: 0, poss: 0 };
const t1 = Date.now();
let sample = null;
for (const f of fixtures) {
  const hc = world.clubs[f.home], ac = world.clubs[f.away];
  validateLineup(hc, world.players, hc.tactic); validateLineup(ac, world.players, ac.tactic);
  const sim = new MatchSimulator({ players: world.players, homeClub: hc, awayClub: ac, homeTactic: structuredClone(hc.tactic), awayTactic: structuredClone(ac.tactic), rng, withText: !sample });
  sim.runToEnd();
  if (!sample) sample = sim;
  const s = sim.summary();
  f.played = true; f.hg = s.score[0]; f.ag = s.score[1];
  agg.n++; agg.goals += f.hg + f.ag; agg.shots += s.home.shots + s.away.shots; agg.ot += s.home.onTarget + s.away.onTarget;
  agg.corners += s.home.corners + s.away.corners; agg.fouls += s.home.fouls + s.away.fouls; agg.yellows += s.home.yellows + s.away.yellows;
  agg.reds += s.home.reds + s.away.reds; agg.offsides += s.home.offsides + s.away.offsides; agg.poss += s.home.possession;
  agg.pens += sim.events.filter((e) => e.type === 'penalty_award').length;
  if (f.hg > f.ag) agg.home++; else if (f.hg === f.ag) agg.draw++; else agg.away++;
}
const per = (k) => (agg[k] / agg.n).toFixed(2);
console.log(`\nSimulated ${agg.n} matches in ${Date.now() - t1}ms`);
console.log(`Per match → goals ${per('goals')} | shots ${per('shots')} | on target ${per('ot')} | corners ${per('corners')} | fouls ${per('fouls')} | yellows ${per('yellows')} | reds ${per('reds')} | pens ${per('pens')} | offsides ${per('offsides')} | home poss ${per('poss')}%`);
console.log(`Home ${(agg.home / agg.n * 100).toFixed(1)}% | Draw ${(agg.draw / agg.n * 100).toFixed(1)}% | Away ${(agg.away / agg.n * 100).toFixed(1)}%`);

for (const lg of LEAGUES) {
  const table = computeTable(fixtures, lg.id, CLUBS[lg.id].map((c) => c.id));
  console.log(`\n${lg.name} — top 4 / bottom 2:`);
  [...table.slice(0, 4), ...table.slice(-2)].forEach((r) => console.log(`  ${world.clubs[r.club].name.padEnd(28)} P${r.p} W${r.w} D${r.d} L${r.l} ${r.gf}-${r.ga} ${r.pts}pts`));
}

console.log('\nSample commentary (first 25 key/extended events):');
sample.events.filter((e) => e.level <= 2).slice(0, 25).forEach((e) => console.log(`  ${e.display.padStart(5)}' ${e.text}${e.analyst ? `  [ANALYST] ${e.analyst}` : ''}`));
const s = sample.summary();
console.log(`  Final: ${s.score.join('-')}`);
