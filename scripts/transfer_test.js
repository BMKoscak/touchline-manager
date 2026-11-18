// Headless check of the transfer pipeline: offer → club response → contract → completion.
import { Game } from '../src/engine/game.js';
const g = Game.newGame({ managerName: 'T', clubId: 'maribor', seed: 7 });
g.user.finances.transferBudget = 5_000_000;
const target = Object.values(g.s.players).filter((p) => g.club(p.clubId).league === 'svn1' && p.clubId !== 'maribor').sort((a, b) => b.ca - a.ca)[0];
console.log('Target', target.name, g.club(target.clubId).name, 'value', target.value, 'asking', g.askingPrice(target));
let r = g.makeOffer({ playerId: target.id, fee: Math.round(target.value * 0.5) });
console.log('Lowball offer', r.offer?.status);
g.advanceDay();
const reply = () => g.s.inbox.find((m) => m.data?.playerId === target.id && m.from === g.club(target.clubId).name);
console.log('Response:', reply()?.subject);
for (let i = 0; i < 3; i++) {
  const last = g.s.offers.filter((o) => o.playerId === target.id).pop();
  if (last.status === 'accepted') break;
  if (last.status === 'countered') { console.log('acceptCounter', g.acceptCounter(last.id)); break; }
  g.makeOffer({ playerId: target.id, fee: g.askingPrice(target), installments: 12, sellOn: 10 }); g.advanceDay();
  console.log('Response:', reply()?.subject);
}
const o = g.s.offers.find((x) => x.playerId === target.id && x.status === 'accepted');
console.log('Accepted offer?', !!o);
const status = g.expectedStatus(target);
const d = g.playerDemands(target, 'maribor', status);
console.log('Demands', d, status);
console.log('Low wage', g.proposeContract(o.id, { status, wage: Math.round(d.wage * 0.6), signOn: 0, years: 3, releaseClause: null }));
console.log('Fair wage', g.proposeContract(o.id, { status, wage: d.wage, signOn: d.signOn, years: d.years, releaseClause: target.value * 3 }));
console.log('Now at', g.club(target.clubId).name, '| wage', target.wage, '| RC', target.releaseClause, '| sellOn', target.sellOn, '| scheduled', g.s.scheduled.length);
g.requestScout(Object.values(g.s.players).find((p) => p.clubId === 'olimpija').id);
for (let i = 0; i < 4; i++) g.advanceDay();
console.log('Scout msg:', g.s.inbox.find((m) => m.from === 'Chief Scout')?.subject);
