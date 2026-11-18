// Squad screen (own club or any other club).
import { h, panel, sortableTable } from '../dom.js';
import { fmtMoney } from '../../engine/game.js';
import { positionString } from '../../engine/attributes.js';

let view = 'general';

export function bg(app, params) { return { kind: 'club', club: app.game.club(params.club || app.game.user.id) }; }

export function render(app, params) {
  const g = app.game;
  const club = g.club(params.club || g.user.id);
  const mine = club.id === g.user.id;
  const players = g.squad(club.id);
  const xi = new Set(club.tactic.lineup);
  const status = (p) => p.injury ? h('span', { class: 'red', title: `${p.injury.type} (${p.injury.days}d)` }, 'INJ') : p.suspension > 0 ? h('span', { class: 'orange' }, 'SUS') : p.transferListed ? h('span', { class: 'cyan' }, 'TRN') : '';
  const avgR = (p) => (p.stats.rated ? p.stats.ratingSum / p.stats.rated : 0);
  const cols = view === 'general' ? [
    { key: 'pos', label: 'Pos', render: (p) => positionString(p.positions), sort: (p) => ['GK', 'DR', 'DC', 'DL', 'DMC', 'MR', 'MC', 'ML', 'AMR', 'AMC', 'AML', 'FC'].indexOf(p.positions[0]) },
    { key: 'name', label: 'Name', render: (p) => h('b', { class: mine && xi.has(p.id) ? 'yellow' : '' }, p.name) },
    { key: 'st', label: '', render: status, nosort: true },
    { key: 'age', label: 'Age', num: true },
    { key: 'nat', label: 'Nat' },
    { key: 'condition', label: 'Cond', num: true, render: (p) => h('span', { class: p.condition < 75 ? 'red' : p.condition < 90 ? 'orange' : '' }, `${Math.round(p.condition)}%`) },
    { key: 'morale', label: 'Morale', num: true, render: (p) => moraleText(p.morale) },
    { key: 'apps', label: 'Apps', num: true, sort: (p) => p.stats.apps, render: (p) => p.stats.apps },
    { key: 'gls', label: 'Gls', num: true, sort: (p) => p.stats.goals, render: (p) => p.stats.goals },
    { key: 'ast', label: 'Ast', num: true, sort: (p) => p.stats.assists, render: (p) => p.stats.assists },
    { key: 'avr', label: 'Av Rat', num: true, sort: avgR, render: (p) => (p.stats.rated ? avgR(p).toFixed(2) : '-') },
    { key: 'value', label: 'Value', num: true, render: (p) => fmtMoney(p.value) },
  ] : [
    { key: 'name', label: 'Name', render: (p) => h('b', {}, p.name) },
    { key: 'pos', label: 'Pos', render: (p) => positionString(p.positions), sort: (p) => p.positions[0] },
    { key: 'squadStatus', label: 'Status' },
    { key: 'wage', label: 'Wage/wk', num: true, render: (p) => fmtMoney(p.wage) },
    { key: 'contractEnd', label: 'Contract', render: (p) => p.contractEnd.slice(0, 4) },
    { key: 'releaseClause', label: 'Release clause', num: true, render: (p) => (p.releaseClause ? fmtMoney(p.releaseClause) : '-') },
    { key: 'value', label: 'Value', num: true, render: (p) => fmtMoney(p.value) },
    { key: 'source', label: 'Data', render: (p) => h('span', { class: p.source === 'generated' ? 'muted' : 'green' }, p.source) },
  ];
  const table = sortableTable(players, cols, { onRow: (p) => app.go('player', { id: p.id }), initialSort: 'pos', initialDir: 1 });
  const wages = players.reduce((s, p) => s + p.wage, 0);
  return h('div', {},
    h('div', { class: 'screen-title' }, h('h1', {}, mine ? 'Squad' : club.name), h('span', { class: 'sub' }, `${players.length} players · ${club.stadium} (${club.capacity.toLocaleString('en-GB')}) · Manager: ${mine ? g.s.managerName : club.manager || '—'} · Wages ${fmtMoney(wages)}/wk`)),
    h('div', { class: 'tabs' }, [['general', 'General'], ['contracts', 'Contracts']].map(([k, l]) => h('div', { class: `tab ${view === k ? 'active' : ''}`, onclick: () => { view = k; app.refresh(); } }, l)),
      !mine ? h('div', { class: 'tab', onclick: () => app.go('table', { league: club.league }) }, 'League table') : null),
    panel(null, table, { bodyStyle: { padding: 0 } }));
}

export function moraleText(m) {
  return m >= 9 ? h('span', { class: 'green' }, 'Superb') : m >= 7.5 ? h('span', { class: 'cyan' }, 'Good') : m >= 5.5 ? 'Okay' : m >= 4 ? h('span', { class: 'orange' }, 'Poor') : h('span', { class: 'red' }, 'Very Poor');
}
