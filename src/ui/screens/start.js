// Title screen: new career (choose league + club) or load a save.
import { h, panel, toast, stars } from '../dom.js';
import { LEAGUES, CLUBS, COUNTRIES, leaguesOf, seasonLabel, baseYear } from '../../data/leagues.js';
import { Game, fmtDate, fmtMoney } from '../../engine/game.js';

let selLeague = 'eng1', selClub = null, managerName = '';

export function bg() {
  const club = selClub && CLUBS[selLeague].find((c) => c.id === selClub);
  return club ? { kind: 'club', club } : { kind: 'competition', league: LEAGUES.find((l) => l.id === selLeague) };
}

export function render(app) {
  const root = h('div', { class: 'start' });
  root.appendChild(h('div', { style: { display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '14px' } },
    h('h1', { class: 'logo' }, 'TOUCHLINE MANAGER', h('small', {}, 'SEASON 2026/27')),
    h('div', { class: 'muted', style: { paddingBottom: '8px' } }, 'A fast, classic football management game. Inspired by Championship Manager 01/02.')));

  const hyd = app.hydrated && Object.values(app.hydrated.clubs || {}).some((c) => c.players?.length) ? app.hydrated : null;
  const dataNote = hyd
    ? h('span', { class: 'green' }, `Live rosters loaded — updated ${new Date(hyd.generatedAt).toLocaleDateString('en-GB')} (${Object.values(hyd.clubs).filter((c) => c.players?.length).length} clubs)`)
    : h('span', { class: 'orange' }, 'Seed database (best-known 2026/27 squads + generated fillers). Run "npm run hydrate" to pull live rosters.');

  const nameIn = h('input', { class: 'input', placeholder: 'Your name', value: managerName, oninput: (e) => (managerName = e.target.value), style: { width: '220px' } });
  const curCountry = LEAGUES.find((l) => l.id === selLeague).country;
  const pick = (id) => { selLeague = id; selClub = null; app.refresh(); };
  const tabs = h('div', {},
    h('div', { class: 'tabs' }, COUNTRIES.map((c) => h('div', { class: `tab ${c === curCountry ? 'active' : ''}`, onclick: () => pick(leaguesOf(c)[0].id) }, c))),
    h('div', { class: 'tabs' }, leaguesOf(curCountry).map((l) => h('div', { class: `tab ${selLeague === l.id ? 'active' : ''}`, onclick: () => pick(l.id) }, l.name))));
  const clubs = CLUBS[selLeague].slice().sort((a, b) => b.rep - a.rep);
  const lg = LEAGUES.find((l) => l.id === selLeague);
  const list = h('table', { class: 'cm' },
    h('thead', {}, h('tr', {}, h('th', {}, 'Club'), h('th', {}, 'Stadium'), h('th', { class: 'num' }, 'Capacity'), h('th', {}, 'Manager'), h('th', {}, 'Reputation'), h('th', { class: 'num' }, 'Budget'))),
    h('tbody', {}, clubs.map((c) => h('tr', { class: `click ${selClub === c.id ? 'me' : ''}`, onclick: () => { selClub = c.id; app.setTheme(c); app.refresh(); }, ondblclick: () => begin() },
      h('td', {}, h('span', { class: 'color-sw', style: { background: c.colors[0] } }), h('span', { class: 'color-sw', style: { background: c.colors[1] } }), ' ', h('b', {}, c.name)),
      h('td', {}, c.stadium), h('td', { class: 'num' }, c.capacity.toLocaleString('en-GB')), h('td', { class: 'muted' }, c.manager || '—'),
      h('td', { class: 'stars' }, stars(c.rep, 100)), h('td', { class: 'num' }, fmtMoney(Math.round(1_000_000 * Math.exp((c.rep - 40) / 11) * (selLeague === 'svn1' ? 0.6 : 1))))))));

  const begin = () => {
    if (!selClub) return toast('Choose a club first', true);
    const name = managerName.trim() || 'The Gaffer';
    app.main.innerHTML = '';
    app.main.appendChild(h('div', { class: 'loading' }, 'Building the world database…'));
    setTimeout(() => {
      const g = Game.newGame({ managerName: name, clubId: selClub, hydrated: app.hydrated });
      app.startGame(g);
    }, 30);
  };

  root.appendChild(h('div', { class: 'row' },
    h('div', { class: 'grow' }, panel('New Career', [
      h('div', { class: 'row', style: { alignItems: 'center', marginBottom: '8px' } }, h('label', { class: 'field' }, 'Manager name', nameIn), h('div', { class: 'grow' }), dataNote),
      tabs,
      h('div', { class: 'muted', style: { marginBottom: '6px' } }, `${lg.name} ${seasonLabel(lg, baseYear(lg))} — ${CLUBS[selLeague].length} clubs, ${(CLUBS[selLeague].length - 1) * lg.legs} rounds, starts ${fmtDate(lg.start)}.${lg.cycle === 'cal' ? ' Calendar-year league: your career begins in January 2027.' : ''} Double-click a club to start.`),
      h('div', { class: 'club-list' }, list),
      h('div', { style: { marginTop: '10px', display: 'flex', gap: '8px' } }, h('button', { class: 'btn primary', onclick: begin, disabled: !selClub }, selClub ? `Manage ${CLUBS[selLeague].find((c) => c.id === selClub).name}` : 'Select a club')),
    ])),
    h('div', { style: { width: '300px' } }, loadPanel(app), panel('Controls', h('div', { class: 'kv' },
      h('span', { class: 'k' }, 'Space'), h('span', { class: 'v' }, 'Continue / next match event'),
      h('span', { class: 'k' }, '1–9'), h('span', { class: 'v' }, 'Sidebar screens'),
      h('span', { class: 'k' }, 'Esc'), h('span', { class: 'v' }, 'Back'),
      h('span', { class: 'k' }, 'P'), h('span', { class: 'v' }, 'Pause match'),
      h('span', { class: 'k' }, 'Ctrl+S'), h('span', { class: 'v' }, 'Save game'))))));
  root.appendChild(h('div', { class: 'studio-foot' }, 'A ', h('b', {}, 'Blind Dragon Studios'), ' game · © 2026 Blind Dragon Studios. All rights reserved. · ',
    h('a', { href: 'https://github.com/Blind-Dragon-Studios', target: '_blank', rel: 'noopener' }, 'blind-dragon-studios')));
  return root;
}

function loadPanel(app) {
  const body = h('div', {}, h('div', { class: 'muted' }, 'Looking for saves…'));
  app.listSaves().then((saves) => {
    body.innerHTML = '';
    if (!saves.length) { body.appendChild(h('div', { class: 'muted' }, 'No saved games yet.')); return; }
    saves.sort((a, b) => b.meta.savedAt - a.meta.savedAt).forEach((s) => body.appendChild(h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' } },
      h('div', { class: 'grow' }, h('b', {}, s.meta.club), h('div', { class: 'muted', style: { fontSize: '11px' } }, `${s.slot === 'autosave' ? 'Autosave' : 'Save'} · ${s.meta.manager} · ${fmtDate(s.meta.date)}`)),
      h('button', { class: 'btn small primary', onclick: () => app.loadGame(s.slot) }, 'Load'))));
  });
  return panel('Load Game', body);
}
