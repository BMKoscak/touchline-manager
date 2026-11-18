// Manager News — instant-response inbox with actionable messages.
import { h, panel, toast } from '../dom.js';
import { fmtDate } from '../../engine/game.js';

let selected = null;

export function render(app, params) {
  const g = app.game;
  const msgs = g.s.inbox;
  if (params.open) { selected = params.open; params.open = null; }
  if (!msgs.find((m) => m.id === selected)) selected = msgs[0]?.id;
  const cur = msgs.find((m) => m.id === selected);
  if (cur && !cur.read) { cur.read = true; queueMicrotask(() => app.renderSide()); }

  const list = h('div', { class: 'list' }, msgs.map((m) => h('div', { class: `msg-item ${m.read ? '' : 'unread'} ${m.id === selected ? 'sel' : ''}`, onclick: () => { selected = m.id; app.refresh(); } },
    h('span', { class: 'subj' }, m.subject), h('span', { class: 'date' }, m.date.slice(5).split('-').reverse().join('/')),
    h('span', { class: 'from' }, m.from))));

  const body = cur ? h('div', {},
    h('div', { class: 'muted', style: { marginBottom: '6px' } }, `From: ${cur.from} — ${fmtDate(cur.date)}`),
    h('div', { class: 'msg-body' }, cur.body),
    h('div', { class: 'msg-actions' },
      cur.actions.map((a) => h('button', { class: 'btn club', onclick: () => doAction(app, cur, a) }, a.label)),
      cur.data?.playerId && !cur.actions.some((a) => a.action === 'viewPlayer') && g.player(cur.data.playerId) ? h('button', { class: 'btn', onclick: () => app.go('player', { id: cur.data.playerId }) }, 'View player') : null,
      cur.data?.fixtureId ? h('button', { class: 'btn', onclick: () => app.go('fixtures', { fixture: cur.data.fixtureId }) }, 'Match details') : null))
    : h('div', { class: 'muted' }, 'No messages.');

  return h('div', {},
    h('div', { class: 'screen-title' }, h('h1', {}, 'Manager News'), h('span', { class: 'sub' }, `${g.unread()} unread · Press Space to continue`)),
    h('div', { class: 'inbox' }, panel('Inbox', list, { bodyStyle: { padding: 0, height: 'calc(100vh - 150px)', overflowY: 'auto' } }), panel(cur?.subject || '', body)));
}

function doAction(app, msg, a) {
  const g = app.game;
  const res = g.handleAction(a.action, a.data);
  if (res?.error) return toast(res.error, true);
  if (res?.ui === 'openContract') return app.go('negotiation', { stage: 'contract', offerId: a.data.offerId });
  if (res?.ui === 'openOffer') return app.go('negotiation', { stage: 'offer', playerId: a.data.playerId });
  if (res?.ui === 'viewPlayer') return app.go('player', { id: a.data.playerId });
  msg.actions = [];
  toast('Done');
  app.refresh();
}
