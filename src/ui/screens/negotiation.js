// Classic transfer negotiation: club stage (fee, installments, sell-on) and contract stage
// (squad status, wage, signing-on fee, contract length, release clause).
import { h, panel, toast } from '../dom.js';
import { fmtMoney, SQUAD_STATUS } from '../../engine/game.js';
import { positionString } from '../../engine/attributes.js';

export function bg(app, params) {
  const g = app.game;
  const pid = params.playerId || g.s.offers.find((o) => o.id === params.offerId)?.playerId;
  const p = g.player(pid);
  return { kind: 'club', club: g.club(p?.clubId || g.user.id) };
}

const money = (v) => h('span', { class: 'yellow' }, fmtMoney(v));

function moneyInput(initial, step, onChange) {
  let val = initial;
  const show = h('b', { style: { minWidth: '80px', display: 'inline-block', textAlign: 'center' } }, fmtMoney(val));
  const inp = h('input', { class: 'input', type: 'number', value: Math.round(val), step, style: { width: '120px' }, oninput: (e) => { val = Math.max(0, +e.target.value || 0); show.textContent = fmtMoney(val); onChange(val); } });
  const bump = (d) => { val = Math.max(0, val + d); inp.value = Math.round(val); show.textContent = fmtMoney(val); onChange(val); };
  return h('span', { style: { display: 'inline-flex', gap: '4px', alignItems: 'center' } }, h('button', { class: 'btn small', onclick: () => bump(-step) }, '−'), inp, h('button', { class: 'btn small', onclick: () => bump(step) }, '+'), show);
}

export function render(app, params) {
  return params.stage === 'contract' ? contractStage(app, params) : offerStage(app, params);
}

function header(g, p) {
  const c = g.club(p.clubId);
  return h('div', { class: 'kv' },
    h('span', { class: 'k' }, 'Player'), h('span', { class: 'v' }, `${p.name} (${p.age}) — ${positionString(p.positions)}`),
    h('span', { class: 'k' }, 'Club'), h('span', { class: 'v' }, c.name),
    h('span', { class: 'k' }, 'Value'), h('span', { class: 'v' }, money(p.value)),
    h('span', { class: 'k' }, 'Current wage'), h('span', { class: 'v' }, `${fmtMoney(p.wage)}/wk`),
    h('span', { class: 'k' }, 'Contract'), h('span', { class: 'v' }, `until ${p.contractEnd.slice(0, 4)}`));
}

function offerStage(app, params) {
  const g = app.game;
  const p = g.player(params.playerId);
  if (!p) return h('div', {}, 'Player not found');
  const step = p.value > 20e6 ? 1_000_000 : p.value > 2e6 ? 250_000 : 25_000;
  const st = { fee: Math.round(p.value / step) * step, installments: 0, sellOn: 0 };
  const err = g.canBuy(p.id);
  const submit = () => {
    const r = g.makeOffer({ playerId: p.id, ...st });
    if (r.error) return toast(r.error, true);
    toast(`Offer of ${fmtMoney(st.fee)} submitted — expect a reply tomorrow`);
    app.go('player', { id: p.id }, false);
  };
  return h('div', {},
    h('div', { class: 'screen-title' }, h('h1', {}, 'Transfer Offer'), h('span', { class: 'sub' }, `Budget available: ${fmtMoney(g.user.finances.transferBudget)}`)),
    h('div', { class: 'grid2' },
      panel('Player', header(g, p)),
      panel('Offer to club', h('div', { style: { display: 'grid', gap: '10px' } },
        err ? h('div', { class: 'red' }, err) : null,
        h('label', { class: 'field' }, 'Transfer fee', moneyInput(st.fee, step, (v) => (st.fee = v))),
        h('label', { class: 'field' }, 'Payment', h('select', { class: 'input', onchange: (e) => (st.installments = +e.target.value) }, [[0, 'Full fee up front'], [12, '40% now, rest over 12 months'], [24, '40% now, rest over 24 months'], [36, '40% now, rest over 36 months']].map(([v, l]) => h('option', { value: v }, l)))),
        h('label', { class: 'field' }, 'Sell-on percentage', h('select', { class: 'input', onchange: (e) => (st.sellOn = +e.target.value) }, [0, 5, 10, 15, 20, 25, 30, 40, 50].map((v) => h('option', { value: v }, `${v}%`)))),
        h('div', { class: 'muted' }, 'Installments lower the upfront cost but the selling club values them less. A sell-on clause sweetens the deal.'),
        h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: submit, disabled: !!err }, 'Submit Offer'), h('button', { class: 'btn', onclick: () => app.back() }, 'Cancel'))))));
}

function contractStage(app, params) {
  const g = app.game;
  const o = g.s.offers.find((x) => x.id === params.offerId);
  if (!o || o.status !== 'accepted') return h('div', {}, panel('Contract', h('div', { class: 'muted' }, 'This deal is no longer available.')), h('button', { class: 'btn', onclick: () => app.go('inbox') }, 'Back'));
  const p = g.player(o.playerId);
  const expStatus = g.expectedStatus(p);
  const d = g.playerDemands(p, g.user.id, expStatus);
  const st = { status: expStatus, wage: d.wage, signOn: d.signOn, years: d.years, releaseClause: 0 };
  const reply = h('div', { class: 'muted' }, `Agent: "${p.name.split(' ')[0]} is looking for ${fmtMoney(d.wage)} a week as a ${expStatus.toLowerCase()}, over ${d.years} years."`);
  const wageStep = d.wage > 50000 ? 5000 : d.wage > 5000 ? 500 : 100;
  const propose = () => {
    const r = g.proposeContract(o.id, { ...st, releaseClause: st.releaseClause || null });
    if (r.error) return toast(r.error, true);
    if (r.accepted) { toast(`${p.name} has signed!`); app.go('player', { id: p.id }, false); return; }
    reply.className = 'orange';
    reply.textContent = `Agent: "${r.reason}"`;
  };
  return h('div', {},
    h('div', { class: 'screen-title' }, h('h1', {}, 'Contract Negotiation'), h('span', { class: 'sub' }, `Agreed fee ${fmtMoney(o.fee)} with ${g.club(o.seller).name}`)),
    h('div', { class: 'grid2' },
      panel('Player', [header(g, p), h('div', { style: { marginTop: '10px' } }, reply)]),
      panel('Contract offer', h('div', { style: { display: 'grid', gap: '10px' } },
        h('label', { class: 'field' }, 'Squad status', h('select', { class: 'input', onchange: (e) => (st.status = e.target.value) }, SQUAD_STATUS.map((s) => h('option', { selected: s === st.status }, s)))),
        h('label', { class: 'field' }, 'Wage (per week)', moneyInput(st.wage, wageStep, (v) => (st.wage = v))),
        h('label', { class: 'field' }, 'Signing-on fee', moneyInput(st.signOn, wageStep * 10, (v) => (st.signOn = v))),
        h('label', { class: 'field' }, 'Contract length', h('select', { class: 'input', onchange: (e) => (st.years = +e.target.value) }, [1, 2, 3, 4, 5].map((y) => h('option', { value: y, selected: y === st.years }, `${y} year${y > 1 ? 's' : ''}`)))),
        h('label', { class: 'field' }, 'Release clause (0 = none)', moneyInput(0, Math.max(100000, Math.round(p.value / 20 / 100000) * 100000), (v) => (st.releaseClause = v))),
        h('div', { class: 'muted' }, `Wage room: ${fmtMoney(Math.max(0, g.user.finances.wageBudget - g.squad(g.user.id).reduce((s, x) => s + x.wage, 0)))}/wk`),
        h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: propose }, 'Offer Contract'), h('button', { class: 'btn danger', onclick: () => { o.status = 'void'; app.go('inbox'); } }, 'Walk away'))))));
}
