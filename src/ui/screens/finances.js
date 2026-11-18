// Finances: balance, budgets, season income/expenditure, recent transactions, installments.
import { h, panel } from '../dom.js';
import { fmtMoney, fmtDate } from '../../engine/game.js';

const LBL = { gate: 'Gate receipts', tv: 'TV & broadcasting', sponsorship: 'Sponsorship & merch', transfers: 'Transfers', prize: 'Prize money', wages: 'Wages' };

export function render(app) {
  const g = app.game, c = g.user, f = c.finances;
  const wages = g.squad(c.id).reduce((s, p) => s + p.wage, 0);
  const breakdown = (obj) => {
    const keys = Object.keys(obj);
    if (!keys.length) return h('div', { class: 'muted' }, 'Nothing yet this season.');
    const total = keys.reduce((s, k) => s + obj[k], 0);
    return h('table', { class: 'cm' }, h('tbody', {}, keys.sort((a, b) => obj[b] - obj[a]).map((k) => h('tr', {}, h('td', {}, LBL[k] || k), h('td', { class: 'num' }, fmtMoney(obj[k])))),
      h('tr', {}, h('td', {}, h('b', {}, 'Total')), h('td', { class: 'num yellow' }, h('b', {}, fmtMoney(total))))));
  };
  const due = g.s.scheduled.filter((x) => x.payer === c.id || x.payee === c.id);
  return h('div', {},
    h('div', { class: 'screen-title' }, h('h1', {}, 'Finances'), h('span', { class: 'sub' }, c.name)),
    h('div', { class: 'grid3' },
      panel('Overview', h('div', { class: 'kv' },
        h('span', { class: 'k' }, 'Bank balance'), h('span', { class: `v ${f.balance < 0 ? 'red' : 'green'}` }, fmtMoney(f.balance)),
        h('span', { class: 'k' }, 'Transfer budget'), h('span', { class: 'v yellow' }, fmtMoney(f.transferBudget)),
        h('span', { class: 'k' }, 'Wage budget'), h('span', { class: 'v' }, `${fmtMoney(f.wageBudget)}/wk`),
        h('span', { class: 'k' }, 'Current wages'), h('span', { class: `v ${wages > f.wageBudget ? 'red' : ''}` }, `${fmtMoney(wages)}/wk`),
        h('span', { class: 'k' }, 'Wage room'), h('span', { class: 'v' }, `${fmtMoney(Math.max(0, f.wageBudget - wages))}/wk`),
        h('span', { class: 'k' }, 'Stadium'), h('span', { class: 'v' }, `${c.stadium} (${c.capacity.toLocaleString('en-GB')})`))),
      panel('Income this season', breakdown(f.seasonIncome)),
      panel('Expenditure this season', breakdown(f.seasonExpense))),
    h('div', { class: 'grid2' },
      panel('Recent transactions', h('table', { class: 'cm' }, h('tbody', {}, f.ledger.slice(0, 40).map((l) => h('tr', {}, h('td', { class: 'muted' }, l.date), h('td', {}, l.desc), h('td', { class: `num ${l.amount < 0 ? 'red' : 'green'}` }, fmtMoney(l.amount)))))), { bodyStyle: { padding: 0, maxHeight: '45vh', overflowY: 'auto' } }),
      panel('Scheduled installments', due.length ? h('table', { class: 'cm' }, h('tbody', {}, due.map((x) => h('tr', {}, h('td', {}, fmtDate(x.date)), h('td', {}, x.desc), h('td', { class: `num ${x.payer === c.id ? 'red' : 'green'}` }, fmtMoney(x.payer === c.id ? -x.amount : x.amount)))))) : h('div', { class: 'muted' }, 'No outstanding installments.'))));
}
