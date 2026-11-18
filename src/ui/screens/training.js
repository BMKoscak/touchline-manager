// Training schedule: weekly intensity per area drives attribute development, condition and injury risk.
import { h, panel } from '../dom.js';
import { TRAINING_LABELS } from '../../engine/game.js';

const LEVEL = ['Rest', 'Light', 'Normal', 'Intensive', 'Very Intensive'];

export function render(app) {
  const g = app.game;
  const tr = g.s.training;
  const total = Object.values(tr).reduce((a, b) => a + b, 0);
  const load = total / 6;
  const rows = Object.keys(TRAINING_LABELS).map((k) => {
    const lbl = h('b', { class: tr[k] >= 3 ? 'orange' : tr[k] === 0 ? 'muted' : 'yellow' }, LEVEL[tr[k]]);
    return h('div', { class: 'row', style: { alignItems: 'center', marginBottom: '6px' } },
      h('span', { style: { width: '120px', fontWeight: 'bold' } }, TRAINING_LABELS[k]),
      h('input', { type: 'range', min: 0, max: 4, value: tr[k], style: { width: '240px' }, oninput: (e) => { tr[k] = +e.target.value; lbl.textContent = LEVEL[tr[k]]; }, onchange: () => app.refresh() }), lbl);
  });
  const young = g.squad(g.user.id).filter((p) => p.age <= 23 && p.pa - p.ca > 10).sort((a, b) => (b.pa - b.ca) - (a.pa - a.ca)).slice(0, 8);
  return h('div', {},
    h('div', { class: 'screen-title' }, h('h1', {}, 'Training'), h('span', { class: 'sub' }, 'The weekly schedule is applied every Monday.')),
    h('div', { class: 'grid2' },
      panel('Weekly Schedule', [rows,
        h('div', { style: { marginTop: '10px' } }, 'Overall workload: ', h('b', { class: load > 3 ? 'red' : load > 2.4 ? 'orange' : load < 1.4 ? 'cyan' : 'green' }, load > 3 ? 'Very high — injury risk' : load > 2.4 ? 'High' : load < 1.4 ? 'Low — slow development' : 'Balanced')),
        h('div', { class: 'muted', style: { marginTop: '6px' } }, 'Higher intensity speeds up development for players with potential, but slows recovery between matches (Fitness) and raises the risk of training injuries. Ball Control, Shooting, Attacking and Defending improve the related attributes. Tactics improves Decisions, Anticipation, Teamwork and Work Rate.')]),
      panel('Developing players', young.length ? h('table', { class: 'cm' }, h('thead', {}, h('tr', {}, h('th', {}, 'Name'), h('th', { class: 'num' }, 'Age'), h('th', {}, 'Outlook'))),
        h('tbody', {}, young.map((p) => h('tr', { class: 'click', onclick: () => app.go('player', { id: p.id }) }, h('td', {}, p.name), h('td', { class: 'num' }, p.age),
          h('td', { class: p.pa - p.ca > 35 ? 'green' : 'cyan' }, p.pa - p.ca > 35 ? 'Excellent potential' : p.pa - p.ca > 20 ? 'Good potential' : 'Some potential')))))
        : h('div', { class: 'muted' }, 'No young players with significant room to improve.'))));
}
