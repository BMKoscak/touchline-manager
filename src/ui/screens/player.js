// Player profile: CM 01/02 three-column attribute layout + portrait + actions.
import { h, panel, attrClass, toast } from '../dom.js';
import { fmtMoney } from '../../engine/game.js';
import { TECHNICAL, MENTAL, PHYSICAL, GOALKEEPING, ATTR_LABEL, positionString, shown } from '../../engine/attributes.js';
import { NAT_LABEL } from '../../data/names.js';
import { moraleText } from './squad.js';

export function bg(app, params) { const p = app.game.player(params.id); return { kind: 'player', club: app.game.club(p?.clubId || app.game.user.id) }; }

export function render(app, params) {
  const g = app.game;
  const p = g.player(params.id);
  if (!p) return h('div', { class: 'muted' }, 'Player not found.');
  const club = g.club(p.clubId);
  const mine = p.clubId === g.user.id;
  const isGK = p.positions.includes('GK');

  const col = (title, list) => h('div', { class: 'attr-col' }, h('h3', {}, title), list.flatMap((a) => [
    h('span', {}, ATTR_LABEL[a]), h('span', { class: `n ${a === 'injuryProneness' ? attrClass(21 - p.attrs[a]) : attrClass(p.attrs[a])}` }, shown(p.attrs[a])),
  ]));
  const tech = isGK ? [...GOALKEEPING, 'passing', 'technique'] : TECHNICAL;

  const portrait = h('div', { class: 'portrait' }, h('div', { class: 'silhouette' }, '👤'));
  app.bg.playerPhoto(p, club).then((url) => {
    if (!url || !portrait.isConnected) return;
    const img = h('img', { src: url, alt: p.name, referrerpolicy: 'no-referrer', onerror: () => img.remove() });
    portrait.innerHTML = ''; portrait.appendChild(img);
  });

  const avgR = p.stats.rated ? (p.stats.ratingSum / p.stats.rated).toFixed(2) : '-';
  const info = h('div', { class: 'kv' },
    h('span', { class: 'k' }, 'Club'), h('span', { class: 'v' }, h('a', { href: '#', onclick: (e) => { e.preventDefault(); app.go('squad', { club: club.id }); } }, club.name)),
    h('span', { class: 'k' }, 'Position'), h('span', { class: 'v' }, positionString(p.positions)),
    h('span', { class: 'k' }, 'Age'), h('span', { class: 'v' }, p.age),
    h('span', { class: 'k' }, 'Nationality'), h('span', { class: 'v' }, NAT_LABEL[p.nat] || p.nat),
    h('span', { class: 'k' }, 'Value'), h('span', { class: 'v yellow' }, fmtMoney(p.value)),
    h('span', { class: 'k' }, 'Wage'), h('span', { class: 'v' }, `${fmtMoney(p.wage)} p/w`),
    h('span', { class: 'k' }, 'Contract'), h('span', { class: 'v' }, `until ${p.contractEnd.slice(0, 4)}`),
    h('span', { class: 'k' }, 'Squad status'), h('span', { class: 'v' }, p.squadStatus),
    p.releaseClause ? h('span', { class: 'k' }, 'Release clause') : null, p.releaseClause ? h('span', { class: 'v cyan' }, fmtMoney(p.releaseClause)) : null,
    h('span', { class: 'k' }, 'Condition'), h('span', { class: 'v' }, `${Math.round(p.condition)}%`),
    h('span', { class: 'k' }, 'Morale'), h('span', { class: 'v' }, moraleText(p.morale)),
    h('span', { class: 'k' }, 'Fitness'), h('span', { class: `v ${p.injury ? 'red' : 'green'}` }, p.injury ? `${p.injury.type} (${p.injury.days} days)` : p.suspension > 0 ? `Suspended (${p.suspension})` : 'Fit'),
    h('span', { class: 'k' }, 'Data source'), h('span', { class: 'v muted' }, p.source));

  const season = h('div', { class: 'kv' },
    h('span', { class: 'k' }, 'Appearances'), h('span', { class: 'v' }, p.stats.apps),
    h('span', { class: 'k' }, 'Goals'), h('span', { class: 'v' }, p.stats.goals),
    h('span', { class: 'k' }, 'Assists'), h('span', { class: 'v' }, p.stats.assists),
    h('span', { class: 'k' }, 'Av. rating'), h('span', { class: 'v' }, avgR),
    h('span', { class: 'k' }, 'Clean sheets'), h('span', { class: 'v' }, p.stats.cleanSheets),
    h('span', { class: 'k' }, 'Cards'), h('span', { class: 'v' }, `${p.stats.yellows} Y / ${p.stats.reds} R`));

  const actions = h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } });
  if (mine) {
    actions.appendChild(h('button', { class: 'btn', onclick: () => { const on = g.toggleTransferList(p.id); toast(on ? `${p.name} placed on the transfer list` : `${p.name} removed from the transfer list`); app.refresh(); } }, p.transferListed ? 'Remove from transfer list' : 'Transfer list'));
    actions.appendChild(h('select', { class: 'input', onchange: (e) => { p.squadStatus = e.target.value; toast('Squad status updated'); } }, ['Key Player', 'First Team', 'Rotation', 'Backup', 'Youngster'].map((s) => h('option', { selected: p.squadStatus === s }, s))));
  } else {
    actions.appendChild(h('button', { class: 'btn primary', onclick: () => { const err = g.canBuy(p.id); if (err) return toast(err, true); app.go('negotiation', { stage: 'offer', playerId: p.id }); } }, 'Make Offer'));
    if (p.releaseClause) actions.appendChild(h('button', { class: 'btn club', onclick: () => { const r = g.makeOffer({ playerId: p.id, fee: p.releaseClause, viaReleaseClause: true }); if (r.error) return toast(r.error, true); app.go('negotiation', { stage: 'contract', offerId: r.offer.id }); } }, `Pay release clause (${fmtMoney(p.releaseClause)})`));
    actions.appendChild(h('button', { class: 'btn', onclick: () => { g.requestScout(p.id); toast(`Scout sent to watch ${p.name}`); } }, 'Scout'));
    const sl = g.user.shortlist.includes(p.id);
    actions.appendChild(h('button', { class: 'btn', onclick: () => { if (sl) g.user.shortlist = g.user.shortlist.filter((x) => x !== p.id); else g.user.shortlist.push(p.id); app.refresh(); } }, sl ? 'Remove from shortlist' : 'Add to shortlist'));
  }

  const head = h('div', { class: 'profile-head' }, portrait,
    h('div', { class: 'grow' },
      h('div', { class: 'screen-title' }, h('h1', {}, p.name), h('span', { class: 'sub' }, `${positionString(p.positions)} · ${club.name}`)),
      h('div', { class: 'grid2' }, info, h('div', {}, h('div', { class: 'yellow', style: { fontWeight: 'bold', marginBottom: '4px' } }, 'This season'), season,
        p.history?.length ? h('div', { style: { marginTop: '8px' } }, h('div', { class: 'yellow', style: { fontWeight: 'bold' } }, 'Transfers'), p.history.map((t) => h('div', { class: 'muted' }, `${t.date.slice(0, 4)}: ${t.from} → ${t.to} (${fmtMoney(t.fee)})`))) : null)),
      h('div', { style: { marginTop: '10px' } }, actions)));

  return h('div', {},
    panel(null, head),
    panel('Attributes', h('div', { class: 'grid3' }, col(isGK ? 'Goalkeeping' : 'Technical', tech), col('Mental', MENTAL), col('Physical', PHYSICAL))));
}
