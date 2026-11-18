// Headless full-season run through the Game layer (user matches auto-played).
import { Game } from '../src/engine/game.js';
const g = Game.newGame({ managerName: 'Test', clubId: process.argv[2] || 'olimpija', seed: 99 });
let matches = 0, guard = 0;
const t0 = Date.now();
while (guard++ < 3000) {
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
  if (g.s.seasonYear === 2027 && g.date >= '2027-08-15') break;
}
console.log(`Done in ${Date.now() - t0}ms. Date ${g.date}, season ${g.s.season}, user matches ${matches}`);
console.log('History', g.s.history);
console.log('Balance', g.user.finances.balance, 'Board', g.s.board);
console.log('Inbox sample:', g.s.inbox.slice(0, 8).map((m) => `${m.date} ${m.subject}`));
console.log('Players', Object.keys(g.s.players).length, 'JSON size', (JSON.stringify(g.serialize()).length / 1e6).toFixed(2), 'MB');
