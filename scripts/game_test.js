// Headless full-season run through the Game layer (user matches auto-played).
import { Game } from '../src/engine/game.js';
const END = process.argv[3] || '2027-08-15';
const g = Game.newGame({ managerName: 'Test', clubId: process.argv[2] || 'olimpija', seed: 99 });
console.log('Start', g.date, g.user.name, g.user.league, g.season, 'expectation:', g.s.board.expectation.text);
let matches = 0, guard = 0;
const t0 = Date.now();
while (guard++ < 20000) {
  const r = g.continue();
  if (r.status === 'match') {
    const sim = g.createSim(r.fixture, true); sim.runToEnd(); g.completeUserMatch(sim); matches++;
  }
  if (r.status === 'sacked') { console.log('SACKED on', g.date); break; }
  // exercise transfers sometimes
  for (const m of g.s.inbox.filter((m) => !m.read)) {
    m.read = true;
    for (const a of m.actions) if (a.action === 'rejectBid') g.handleAction('rejectBid', a.data);
  }
  if (g.date >= END) break;
  if (process.env.NOSACK) { g.s.board.confidence = Math.max(g.s.board.confidence, 50); g.s.sacked = false; }
}
console.log(`Done in ${Date.now() - t0}ms. Date ${g.date}, season ${g.season}, league ${g.user.league}, user matches ${matches}`);
console.log('History', g.s.history);
console.log('Balance', g.user.finances.balance, 'Board', g.s.board);
console.log('Inbox sample:', g.s.inbox.slice(0, 8).map((m) => `${m.date} ${m.subject}`));
console.log('Players', Object.keys(g.s.players).length, 'JSON size', (JSON.stringify(g.serialize()).length / 1e6).toFixed(2), 'MB');
console.log('Promotion news:', g.s.inbox.filter((m) => m.subject === 'Promotion & relegation').map((m) => `${m.date}\n${m.body}`).slice(0, 2).join('\n---\n'));
console.log('League sizes', Object.fromEntries(Object.entries(g.s.leagueClubs).map(([k, v]) => [k, v.length])));
console.log('Seasons', JSON.stringify(g.s.leagueSeasons));
