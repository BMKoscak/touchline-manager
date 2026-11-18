// Fixtures & results — own club, plus per-round league results and match details.
import { h, panel } from '../dom.js';
import { fmtDate } from '../../engine/game.js';
import { LEAGUES } from '../../data/leagues.js';

let tab = 'club', round = null, leagueSel = null;

export function render(app, params) {
  const g = app.game;
  if (params.fixture) { const fx = g.s.fixtures.find((f) => f.id === params.fixture); if (fx) return details(app, fx); }
  const lgId = leagueSel || g.user.league;
  const tabs = h('div', { class: 'tabs' }, [['club', g.user.name], ['league', 'League rounds']].map(([k, l]) => h('div', { class: `tab ${tab === k ? 'active' : ''}`, onclick: () => { tab = k; app.refresh(); } }, l)));
  let body;
  if (tab === 'club') {
    const fx = g.clubFixtures(g.user.id);
    body = h('table', { class: 'cm' }, h('thead', {}, h('tr', {}, h('th', {}, 'Date'), h('th', {}, 'Rd'), h('th', {}, 'Opponent'), h('th', {}, 'Venue'), h('th', {}, 'Result'))),
      h('tbody', {}, fx.map((f) => {
        const home = f.home === g.user.id, opp = g.club(home ? f.away : f.home);
        const gf = home ? f.hg : f.ag, ga = home ? f.ag : f.hg;
        return h('tr', { class: f.played ? 'click' : '', onclick: f.played ? () => app.go('fixtures', { fixture: f.id }) : null },
          h('td', {}, fmtDate(f.date)), h('td', {}, f.round), h('td', {}, h('b', {}, opp.name)), h('td', { class: 'muted' }, home ? 'Home' : 'Away'),
          h('td', {}, f.played ? h('b', { class: gf > ga ? 'green' : gf < ga ? 'red' : 'yellow' }, `${gf > ga ? 'W' : gf < ga ? 'L' : 'D'} ${gf}-${ga}`) : '—'));
      })));
  } else {
    const lgFx = g.s.fixtures.filter((f) => f.league === lgId);
    const maxRound = Math.max(...lgFx.map((f) => f.round));
    const lastPlayed = Math.max(1, ...lgFx.filter((f) => f.played).map((f) => f.round));
    const r = Math.min(round || lastPlayed, maxRound);
    const list = lgFx.filter((f) => f.round === r);
    body = h('div', {},
      h('div', { class: 'row', style: { alignItems: 'center', marginBottom: '8px' } },
        h('select', { class: 'input', onchange: (e) => { leagueSel = e.target.value; round = null; app.refresh(); } }, LEAGUES.map((l) => h('option', { value: l.id, selected: l.id === lgId }, l.name))),
        h('button', { class: 'btn small', onclick: () => { round = Math.max(1, r - 1); app.refresh(); } }, '◀'), h('b', {}, `Round ${r} — ${fmtDate(list[0]?.date || g.date)}`),
        h('button', { class: 'btn small', onclick: () => { round = Math.min(maxRound, r + 1); app.refresh(); } }, '▶')),
      h('table', { class: 'cm' }, h('tbody', {}, list.map((f) => h('tr', { class: `${f.played ? 'click' : ''} ${f.home === g.user.id || f.away === g.user.id ? 'me' : ''}`, onclick: f.played ? () => app.go('fixtures', { fixture: f.id }) : null },
        h('td', { style: { textAlign: 'right', width: '42%' } }, g.club(f.home).name), h('td', { style: { textAlign: 'center' }, class: 'yellow' }, f.played ? `${f.hg} - ${f.ag}` : 'v'), h('td', {}, g.club(f.away).name))))));
  }
  return h('div', {}, h('div', { class: 'screen-title' }, h('h1', {}, 'Fixtures')), tabs, panel(null, body, { bodyStyle: { padding: tab === 'club' ? 0 : '8px' } }));
}

export function bg(app, params) {
  const g = app.game;
  if (params.fixture) { const fx = g.s.fixtures.find((f) => f.id === params.fixture); if (fx) return { kind: 'match', club: g.club(fx.home) }; }
  return { kind: 'club', club: g.user };
}

function details(app, fx) {
  const g = app.game, H = g.club(fx.home), A = g.club(fx.away);
  const st = fx.stats;
  const line = (lbl, a, b) => h('tr', {}, h('td', { class: 'num', style: { width: '40%' } }, h('b', {}, a)), h('td', { style: { textAlign: 'center' }, class: 'muted' }, lbl), h('td', { style: { width: '40%' } }, h('b', {}, b)));
  return h('div', {},
    h('div', { class: 'scoreboard' }, h('div', { class: 'team home' }, H.name), h('div', { class: 'score' }, `${fx.hg} - ${fx.ag}`), h('div', { class: 'team' }, A.name)),
    h('div', { class: 'grid2' },
      panel('Goals', (fx.scorers || []).length ? h('div', {}, fx.scorers.map((s) => h('div', { style: { textAlign: s.side === 'home' ? 'left' : 'right' } }, `⚽ ${s.name} ${s.minute}'${s.kind === 'penalty' ? ' (pen)' : ''}`))) : h('div', { class: 'muted' }, 'No goals.')),
      panel('Statistics', st ? h('table', { class: 'cm' }, h('tbody', {}, line('Possession', `${st.home.possession}%`, `${st.away.possession}%`), line('Shots', st.home.shots, st.away.shots), line('On target', st.home.onTarget, st.away.onTarget), line('xG', st.home.xg, st.away.xg), line('Corners', st.home.corners, st.away.corners), line('Fouls', st.home.fouls, st.away.fouls), line('Yellow cards', st.home.yellows, st.away.yellows), line('Red cards', st.home.reds, st.away.reds))) : h('div', { class: 'muted' }, 'No statistics.'))),
    h('button', { class: 'btn', onclick: () => app.back() }, 'Back'));
}
