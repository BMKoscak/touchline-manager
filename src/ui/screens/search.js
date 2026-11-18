// Player Search with filters + shortlist.
import { h, panel, sortableTable, stars } from '../dom.js';
import { fmtMoney } from '../../engine/game.js';
import { positionString, POSITIONS, ATTR_LABEL, TECHNICAL, MENTAL, PHYSICAL } from '../../engine/attributes.js';
import { LEAGUES } from '../../data/leagues.js';

const F = { name: '', pos: '', league: '', minAge: 15, maxAge: 40, maxValue: 0, attr: '', attrMin: 1, listed: false, shortlist: false };

export function render(app) {
  const g = app.game;
  const inp = (key, props = {}) => h('input', { class: 'input', value: F[key], ...props, oninput: (e) => { F[key] = props.type === 'number' ? +e.target.value : e.target.value; }, onchange: () => app.refresh() });
  const filters = h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-end' } },
    h('label', { class: 'field' }, 'Name', inp('name', { style: { width: '150px' }, placeholder: 'Any' })),
    h('label', { class: 'field' }, 'Position', h('select', { class: 'input', onchange: (e) => { F.pos = e.target.value; app.refresh(); } }, h('option', { value: '' }, 'Any'), POSITIONS.map((p) => h('option', { selected: F.pos === p }, p)))),
    h('label', { class: 'field' }, 'League', h('select', { class: 'input', onchange: (e) => { F.league = e.target.value; app.refresh(); } }, h('option', { value: '' }, 'All'), LEAGUES.map((l) => h('option', { value: l.id, selected: F.league === l.id }, l.name)))),
    h('label', { class: 'field' }, 'Age', h('div', {}, inp('minAge', { type: 'number', style: { width: '52px' } }), ' – ', inp('maxAge', { type: 'number', style: { width: '52px' } }))),
    h('label', { class: 'field' }, 'Max value (€M, 0 = any)', inp('maxValue', { type: 'number', style: { width: '90px' } })),
    h('label', { class: 'field' }, 'Attribute ≥', h('div', {}, h('select', { class: 'input', onchange: (e) => { F.attr = e.target.value; app.refresh(); } }, h('option', { value: '' }, '—'), [...TECHNICAL, ...MENTAL, ...PHYSICAL].map((a) => h('option', { value: a, selected: F.attr === a }, ATTR_LABEL[a]))), ' ', inp('attrMin', { type: 'number', style: { width: '52px' } }))),
    h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: F.listed, onchange: (e) => { F.listed = e.target.checked; app.refresh(); } }), 'Transfer listed'),
    h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: F.shortlist, onchange: (e) => { F.shortlist = e.target.checked; app.refresh(); } }), 'Shortlist'),
    h('button', { class: 'btn small', onclick: () => { Object.assign(F, { name: '', pos: '', league: '', minAge: 15, maxAge: 40, maxValue: 0, attr: '', attrMin: 1, listed: false, shortlist: false }); app.refresh(); } }, 'Reset'));

  const q = F.name.trim().toLowerCase();
  const sl = new Set(g.user.shortlist);
  let res = Object.values(g.s.players).filter((p) => p.clubId !== g.user.id
    && (!q || p.name.toLowerCase().includes(q))
    && (!F.pos || p.positions.includes(F.pos))
    && (!F.league || g.club(p.clubId).league === F.league)
    && p.age >= F.minAge && p.age <= F.maxAge
    && (!F.maxValue || p.value <= F.maxValue * 1e6)
    && (!F.attr || p.attrs[F.attr] >= F.attrMin)
    && (!F.listed || p.transferListed)
    && (!F.shortlist || sl.has(p.id)));
  const total = res.length;
  res = res.sort((a, b) => b.ca - a.ca).slice(0, 300);
  const cols = [
    { key: 'name', label: 'Name', render: (p) => h('b', {}, p.name, p.transferListed ? h('span', { class: 'tag cyan' }, 'TRN') : null, sl.has(p.id) ? h('span', { class: 'tag yellow' }, '★') : null) },
    { key: 'club', label: 'Club', sort: (p) => g.club(p.clubId).name, render: (p) => g.club(p.clubId).name },
    { key: 'pos', label: 'Pos', sort: (p) => p.positions[0], render: (p) => positionString(p.positions) },
    { key: 'age', label: 'Age', num: true },
    { key: 'nat', label: 'Nat' },
    { key: 'ca', label: 'Ability', num: true, render: (p) => h('span', { class: 'stars' }, stars(p.ca)) },
    F.attr ? { key: 'attr', label: ATTR_LABEL[F.attr], num: true, sort: (p) => p.attrs[F.attr], render: (p) => Math.round(p.attrs[F.attr]) } : null,
    { key: 'value', label: 'Value', num: true, render: (p) => fmtMoney(p.value) },
    { key: 'wage', label: 'Wage', num: true, render: (p) => fmtMoney(p.wage) },
  ].filter(Boolean);
  return h('div', {},
    h('div', { class: 'screen-title' }, h('h1', {}, 'Player Search'), h('span', { class: 'sub' }, `${total} players found${total > 300 ? ' (showing best 300)' : ''}`)),
    panel('Filters', filters),
    panel(null, sortableTable(res, cols, { onRow: (p) => app.go('player', { id: p.id }), initialSort: 'ca' }), { bodyStyle: { padding: 0, maxHeight: 'calc(100vh - 290px)', overflowY: 'auto' } }));
}
