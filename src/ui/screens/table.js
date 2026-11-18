// League tables with qualification / relegation zones and competition backgrounds.
import { h, panel } from '../dom.js';
import { LEAGUES, COUNTRIES, leaguesOf } from '../../data/leagues.js';

let leagueSel = null;

export function bg(app, params) { return { kind: 'competition', league: LEAGUES.find((l) => l.id === (params.league || leagueSel || app.game.user.league)) }; }


export function render(app, params) {
  const g = app.game;
  if (params.league) { leagueSel = params.league; params.league = null; }
  const lgId = leagueSel || g.user.league;
  const lg = LEAGUES.find((l) => l.id === lgId);
  const rows = g.table(lgId);
  // Zones: promotion (lower divisions) or continental places, plus relegation.
  const promo = g.promoCount(lgId), rel = g.relCount(lgId);
  const cont = lg.cont;
  const cl = promo || (cont ? Math.min(cont[0], lgId === 'fra1' ? 3 : 4) : 0);
  const eu = promo ? promo : cont ? cont[0] + (cont[1] === 'Playoffs' ? 0 : 2) : 0;
  const zone = (i) => (i < cl ? 'zone-cl' : i < eu ? 'zone-eu' : rel && i >= rows.length - rel ? 'zone-rel' : '');
  const legend = [];
  if (promo) legend.push(h('span', { class: 'green' }, '▌'), ' Promotion  ');
  else if (cont && cont[1] === 'Playoffs') legend.push(h('span', { class: 'green' }, '▌'), ' Playoffs  ');
  else if (cont) legend.push(h('span', { class: 'green' }, '▌'), ` ${cont[1]}  `, h('span', { class: 'cyan' }, '▌'), ' Other Europe  ');
  if (rel) legend.push(h('span', { class: 'red' }, '▌'), ' Relegation');
  const t = h('table', { class: 'cm' },
    h('thead', {}, h('tr', {}, ['Pos', 'Club', 'P', 'W', 'D', 'L', 'F', 'A', 'GD', 'Pts', 'Form'].map((x, i) => h('th', { class: i >= 2 && i <= 9 ? 'num' : '' }, x)))),
    h('tbody', {}, rows.map((r, i) => h('tr', { class: `click ${r.club === g.user.id ? 'me' : ''}`, onclick: () => app.go('squad', { club: r.club }) },
      h('td', { class: zone(i) }, i + 1), h('td', {}, h('span', { class: 'color-sw', style: { background: g.club(r.club).colors[0] } }), ' ', h('b', {}, g.club(r.club).name)),
      ...[r.p, r.w, r.d, r.l, r.gf, r.ga, r.gd > 0 ? `+${r.gd}` : r.gd].map((v) => h('td', { class: 'num' }, v)),
      h('td', { class: 'num yellow' }, h('b', {}, r.pts)), h('td', { class: 'form' }, r.form.map((f) => h('span', { class: f }, f)))))));
  const scorers = Object.values(g.s.players).filter((p) => g.club(p.clubId)?.league === lgId && p.stats.goals > 0).sort((a, b) => b.stats.goals - a.stats.goals || a.stats.apps - b.stats.apps).slice(0, 12);
  return h('div', {},
    h('div', { class: 'screen-title' }, h('h1', {}, lg.name), h('span', { class: 'sub' }, `${lg.country} · Tier ${lg.tier} · ${g.seasonLabelOf(lgId)}`)),
    h('div', { class: 'tabs' }, COUNTRIES.map((c) => h('div', { class: `tab ${c === lg.country ? 'active' : ''}`, onclick: () => { leagueSel = (c === g.league(g.user.league).country ? g.user.league : leaguesOf(c)[0].id); app.refresh(); } }, c))),
    h('div', { class: 'tabs' }, leaguesOf(lg.country).map((l) => h('div', { class: `tab ${l.id === lgId ? 'active' : ''}`, onclick: () => { leagueSel = l.id; app.refresh(); } }, l.name))),
    h('div', { class: 'row' },
      h('div', { class: 'grow' }, panel(null, t, { bodyStyle: { padding: 0 } }),
        h('div', { class: 'muted', style: { fontSize: '11px' } }, legend)),
      h('div', { style: { width: '290px' } }, panel('Top Scorers', scorers.length ? h('table', { class: 'cm' }, h('tbody', {}, scorers.map((p) => h('tr', { class: 'click', onclick: () => app.go('player', { id: p.id }) },
        h('td', {}, p.name, h('div', { class: 'muted', style: { fontSize: '10px' } }, g.club(p.clubId).name)), h('td', { class: 'num yellow' }, h('b', {}, p.stats.goals)))))) : h('div', { class: 'muted' }, 'No goals yet.')))));
}
