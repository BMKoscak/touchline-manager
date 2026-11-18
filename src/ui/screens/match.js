// Match day: pre-match team sheets → live match (2D radar, stats, flashing commentary bar,
// spoken dual commentary, crowd ambience) → post-match ratings.
import { h, panel, toast, modal, contrast } from '../dom.js';
import { fmtDate } from '../../engine/game.js';
import { surname } from '../../engine/commentary.js';
import { board as tacticsBoard, resetSelection } from './tactics.js';
import { validateLineup } from '../../engine/tactics.js';

let M = null; // persistent match controller across re-renders

export function bg(app) {
  const fx = currentFixture(app);
  return fx ? { kind: 'match', club: app.game.club(fx.home) } : { kind: 'club', club: app.game.user };
}
function currentFixture(app) { return app.game.s.fixtures.find((f) => f.id === (M?.fixtureId || app.game.s.pendingMatch)); }

export function leave(app) {
  if (M && M.phase === 'live') { M.paused = true; M.skip?.(); }
  app.audio.cancel();
  app.crowd.setIntensity(0.1);
  app.showBar(false);
}

export function onKey(app, e) {
  if (!M || M.phase !== 'live') return false;
  if (e.code === 'Space') { M.skip?.(); return true; }
  if (e.key === 'p' || e.key === 'P') { togglePause(app); return true; }
  return false;
}

export function render(app) {
  const g = app.game;
  const fxId = g.s.pendingMatch;
  if (!fxId && !(M && M.phase === 'post')) return h('div', {}, panel('Match', h('div', { class: 'muted' }, 'No match scheduled today. Press Continue.')));
  if (!M || (fxId && M.fixtureId !== fxId)) M = { fixtureId: fxId, phase: 'pre', paused: false };
  if (M.phase === 'pre') return preMatch(app);
  if (M.phase === 'live') return liveView(app);
  return postMatch(app);
}

// ---------------- PRE-MATCH ----------------
function preMatch(app) {
  const g = app.game, fx = currentFixture(app);
  const H = g.club(fx.home), A = g.club(fx.away);
  g.prepareTactic(H.id); g.prepareTactic(A.id);
  validateLineup(g.user, g.s.players, g.user.tactic);
  app.showBar(false);
  const sheet = (club) => {
    const t = club.tactic;
    return panel(`${club.name} (${t.formation})`, h('table', { class: 'cm' }, h('tbody', {},
      t.lineup.map((pid, i) => { const p = g.player(pid); return h('tr', { class: 'click', onclick: () => app.go('player', { id: pid }) }, h('td', { class: 'yellow' }, t.slots[i].pos), h('td', {}, h('b', {}, p?.name || '—')), h('td', { class: 'num muted' }, p ? `${Math.round(p.condition)}%` : '')); }),
      h('tr', {}, h('td', { colspan: 3, class: 'muted' }, 'Substitutes')),
      t.subs.map((pid) => { const p = g.player(pid); return h('tr', {}, h('td', { class: 'cyan' }, 'S'), h('td', {}, p?.name), h('td', { class: 'num muted' }, `${Math.round(p?.condition || 0)}%`)); }))),
    { right: club.id === g.user.id ? h('button', { class: 'btn small', onclick: () => app.go('tactics') }, 'Edit tactics') : `Manager: ${club.manager || '—'}` });
  };
  const lg = g.league(H.league);
  return h('div', {},
    h('div', { class: 'scoreboard' }, h('div', { class: 'team home', style: teamStyle(H) }, H.name), h('div', { class: 'clock' }, 'v', h('div', { class: 'muted', style: { fontSize: '11px' } }, `${lg.name} · Round ${fx.round}`)), h('div', { class: 'team', style: teamStyle(A) }, A.name)),
    h('div', { class: 'muted', style: { textAlign: 'center', marginBottom: '10px' } }, `${H.stadium}, ${H.city} — ${fmtDate(fx.date)} · Capacity ${H.capacity.toLocaleString('en-GB')}`),
    h('div', { class: 'grid2' }, sheet(H), sheet(A)),
    h('div', { style: { textAlign: 'center' } },
      h('button', { class: 'btn primary', style: { fontSize: '16px', padding: '10px 30px' }, onclick: () => kickOff(app) }, 'Kick Off'),
      h('button', { class: 'btn', style: { marginLeft: '10px' }, onclick: () => instantResult(app) }, 'Instant result')));
}

function teamStyle(c) { return { background: c.colors[0], color: contrast(c.colors[0]) === '#ffffff' ? '#fff' : '#0b1224', border: `2px solid ${c.colors[1]}` }; }

function kickOff(app) {
  const g = app.game, fx = currentFixture(app);
  app.crowd.resume();
  app.crowd.setVolume(app.settings.crowdVolume);
  M.sim = g.createSim(fx, true);
  M.sim.autoSubsUser = app.settings.autoSubs;
  M.userSide = M.sim.userSide;
  M.savedLineup = { lineup: g.user.tactic.lineup.slice(), subs: g.user.tactic.subs.slice() };
  M.feed = [];
  M.phase = 'live';
  M.paused = false;
  M.ball = { x: 0.5, y: 0.5 }; M.ballTarget = { x: 0.5, y: 0.5 }; M.poss = 'home';
  app.refresh();
  runLoop(app);
}

function instantResult(app) {
  const g = app.game, fx = currentFixture(app);
  M.sim = g.createSim(fx, true);
  M.sim.autoSubsUser = true;
  M.sim.runToEnd();
  finishMatch(app);
}

// ---------------- LIVE ----------------
function liveView(app) {
  const g = app.game, sim = M.sim;
  const H = sim.teams.home.club, A = sim.teams.away.club;
  M.el = {};
  M.el.score = h('div', { class: 'score' }, `${sim.score[0]} - ${sim.score[1]}`);
  M.el.clock = h('div', { class: 'clock' }, `${sim.displayMinute()}'`);
  M.el.scorersH = h('div', { class: 'scorers', style: { textAlign: 'right' } });
  M.el.scorersA = h('div', { class: 'scorers' });
  M.el.canvas = h('canvas', { class: 'radar', width: 840, height: 544 });
  M.el.feed = h('div', { class: 'feed' });
  M.el.stats = h('div');
  M.el.ratings = h('div');
  M.el.pauseBtn = h('button', { class: 'btn small', onclick: () => togglePause(app) }, M.paused ? 'Resume (P)' : 'Pause (P)');
  const subPanel = subsUI(app);
  const view = h('div', {},
    h('div', { class: 'scoreboard' },
      h('div', {}, h('div', { class: 'team home', style: teamStyle(H) }, H.name), M.el.scorersH),
      h('div', {}, M.el.score, M.el.clock),
      h('div', {}, h('div', { class: 'team', style: teamStyle(A) }, A.name), M.el.scorersA)),
    h('div', { class: 'match' },
      h('div', {}, M.el.canvas,
        h('div', { class: 'row', style: { margin: '8px 0', alignItems: 'center' } }, M.el.pauseBtn,
          h('button', { class: 'btn small', onclick: () => openTactics(app) }, 'Tactics'),
          h('button', { class: 'btn small', onclick: () => M.skip?.() }, 'Next event (Space)'),
          h('button', { class: 'btn small danger', onclick: () => { M.fastForward = true; M.paused = false; M.skip?.(); M.resume?.(); } }, 'Skip to result'),
          h('span', { class: 'muted' }, `${H.stadium}`)),
        panel('Commentary', M.el.feed, { bodyStyle: { padding: 0 } })),
      h('div', {}, panel('Match Stats', M.el.stats), subPanel, panel(`${g.user.short || g.user.name} ratings`, M.el.ratings, { bodyStyle: { padding: 0, maxHeight: '240px', overflowY: 'auto' } }))));
  for (const f of M.feed.slice(-120)) M.el.feed.prepend(feedLine(f));
  updateStats(app); updateScorers(app);
  requestAnimationFrame(() => drawRadar(app));
  app.showBar(true);
  if (!M.running) setTimeout(() => runLoop(app), 0); // resume after visiting other screens mid-match
  return view;
}

function subsUI(app) {
  const g = app.game, sim = M.sim, T = sim.teams[M.userSide];
  const outSel = h('select', { class: 'input' }, T.onPitch.map((x) => h('option', { value: x.pid }, `${T.tactic.slots[x.slotIdx].pos} ${surname(g.player(x.pid).name)} (${Math.round(T.cond[x.pid])}%)`)));
  const inSel = h('select', { class: 'input' }, T.bench.filter((id) => !T.appeared.has(id)).map((id) => h('option', { value: id }, `${surname(g.player(id).name)} — ${g.player(id).positions[0]}`)));
  return panel(`Substitutions (${T.subsUsed}/5)`, h('div', { style: { display: 'grid', gap: '5px' } },
    h('label', { class: 'field' }, 'Off', outSel), h('label', { class: 'field' }, 'On', inSel),
    h('button', { class: 'btn club small', disabled: T.subsUsed >= 5 || !inSel.value, onclick: () => {
      const ok = sim.substitute(M.userSide, outSel.value, inSel.value, 'tactical');
      if (!ok) return toast('Substitution not allowed', true);
      const ev = sim.events[sim.events.length - 1];
      present(app, ev, true);
      app.refresh();
    } }, 'Make substitution')));
}

function openTactics(app) {
  const wasPaused = M.paused;
  M.paused = true; M.skip?.();
  const sim = M.sim, T = sim.teams[M.userSide];
  let dirty = false;
  const holder = h('div');
  const draw = () => {
    holder.innerHTML = '';
    holder.appendChild(tacticsBoard(app, { tactic: T.tactic, club: app.game.user, inMatch: true, onPitchIds: new Set(T.onPitch.map((x) => x.pid)), onChange: (k) => { if (k === 'tactic') dirty = true; draw(); } }));
  };
  draw();
  // Keep on-pitch slot mapping in sync with lineup swaps
  const close = modal(panel('In-match tactics', [holder, h('div', { style: { marginTop: '8px' } }, h('button', { class: 'btn primary', onclick: () => done() }, 'Back to match'))], { style: { width: 'min(1100px, 96vw)' } }));
  document.querySelector('#modal .dialog').style.width = 'min(1120px, 96vw)';
  const done = () => {
    close();
    // Re-map onPitch slot indices to lineup positions
    T.onPitch.forEach((x) => { const i = T.tactic.lineup.indexOf(x.pid); if (i >= 0) x.slotIdx = i; });
    if (dirty) { sim.tacticChanged(M.userSide); present(app, sim.events[sim.events.length - 1], true); }
    resetSelection();
    M.paused = wasPaused;
    M.resume?.();
    if (M.el?.pauseBtn) M.el.pauseBtn.textContent = M.paused ? 'Resume (P)' : 'Pause (P)';
  };
}

function togglePause(app) {
  M.paused = !M.paused;
  if (M.paused) { app.audio.cancel(); M.skip?.(); } else M.resume?.();
  if (M.el?.pauseBtn) M.el.pauseBtn.textContent = M.paused ? 'Resume (P)' : 'Pause (P)';
}

const sleep = (ms) => new Promise((res) => { const t = setTimeout(res, ms); M.skip = () => { clearTimeout(t); res(); }; });
const waitResume = () => new Promise((res) => { M.resume = () => { M.resume = null; res(); }; });

async function runLoop(app) {
  const sim = M.sim;
  if (M.running) return;
  M.running = true;
  try {
    while (!sim.finished && app.screen === 'match' && M.phase === 'live') {
      if (M.paused) { await waitResume(); continue; }
      if (M.fastForward) { sim.autoSubsUser = true; while (!sim.finished) sim.step(); break; }
      const evs = sim.step();
      // Prefetch neural voice lines for this minute
      if (app.settings.voice) for (const ev of evs) if (ev.level <= app.settings.commentaryLevel) app.audio.prefetch({ speaker: 'lead', text: ev.text, excitement: ev.excitement });
      if (M.el) M.el.clock.textContent = `${sim.displayMinute()}'`;
      for (const ev of evs) { if (M.paused || M.fastForward) break; try { await present(app, ev); } catch (e) { console.error('[match] present failed', e); } }
      const speed = app.settings.matchSpeed;
      if (!M.fastForward) await sleep(Math.max(20, 1500 / speed));
    }
  } finally { M.running = false; }
  if (sim.finished && M.phase === 'live') finishMatch(app);
}

/** Present one event: radar, feed, stats, crowd SFX, flashing bar + synchronised speech. */
async function present(app, ev, immediate = false) {
  if (!ev || !M) return;
  const g = app.game, sim = M.sim;
  const lvl = app.settings.commentaryLevel;
  if (ev.ball) { M.ballTarget = ev.ball; }
  M.poss = ev.frame || ev.team || M.poss;
  // Crowd: intensity from how deep the attack is
  if (ev.ball) {
    const atkHome = (ev.frame || ev.team) === 'home';
    const depth = atkHome ? ev.ball.x : 1 - ev.ball.x;
    app.crowd.setIntensity(Math.min(1, Math.max(0.1, (depth - 0.35) * 1.6)) * (ev.excitement >= 7 ? 1.2 : 1));
  }
  const homeCrowdSide = 'home';
  try { crowdFx(app, ev, homeCrowdSide); } catch (e) { console.warn('[crowd]', e); }
  if (ev.type === 'goal' || ev.type === 'sub' || ev.type === 'yellow' || ev.type === 'red' || ev.type === 'second_yellow') { updateScorers(app); }
  if (M.el) { M.el.score.textContent = `${ev.score[0]} - ${ev.score[1]}`; updateStats(app); }
  return presentText(app, ev, immediate);
}

function crowdFx(app, ev, homeCrowdSide) {
  switch (ev.type) {
    case 'goal': app.crowd.goal(ev.team === homeCrowdSide); break;
    case 'foul': case 'offside': app.crowd.whistle('short'); break;
    case 'foul_box': app.crowd.whistle('short'); break;
    case 'yellow': case 'red': case 'second_yellow': break;
    case 'halftime': app.crowd.whistle('double'); break;
    case 'fulltime': app.crowd.whistle('long'); break;
    case 'kickoff': case 'kickoff2': app.crowd.whistle('short'); break;
    case 'save': case 'woodwork': case 'miss': if (ev.big || ev.type === 'woodwork') app.crowd.ooh(); break;
    case 'penalty_save': case 'penalty_miss': app.crowd.ooh(); break;
  }
}

async function presentText(app, ev, immediate) {
  const lvl = app.settings.commentaryLevel;
  const show = ev.level <= lvl;
  if (!show) return;
  const f = { display: ev.display, text: ev.text, type: ev.type, analyst: ev.analyst };
  M.feed.push(f);
  if (M.el) M.el.feed.prepend(feedLine(f));
  if (immediate) { setBar(app, ev, ev.text, 'lead', true); return; }
  const speed = app.settings.matchSpeed;
  const voice = app.settings.voice && (speed <= 6 || ev.level === 1);
  // Lead commentator
  await speakLine(app, ev, ev.text, 'lead', voice, speed);
  if (ev.type === 'goal') await sleep(Math.max(300, 2400 / speed));
  // Colour analyst
  if (ev.analyst && !M.paused && !M.fastForward) {
    M.feed.push({ display: ev.display, text: ev.analyst, type: 'analyst' });
    if (M.el) M.el.feed.prepend(feedLine({ display: '', text: ev.analyst, type: 'analyst' }));
    await speakLine(app, ev, ev.analyst, 'analyst', voice && (speed <= 10 || ['halftime', 'fulltime', 'red', 'second_yellow'].includes(ev.type)), speed);
  }
}

async function speakLine(app, ev, text, speaker, voice, speed) {
  const spans = setBar(app, ev, text, speaker, !voice);
  if (voice) {
    let skipped = false;
    const p = app.audio.speak({ speaker, text, excitement: speaker === 'lead' ? ev.excitement : 4 }, {
      onWord: (ci) => { for (const s of spans) if (s.start <= ci) s.el.classList.add('on'); },
    });
    await Promise.race([p, new Promise((res) => { M.skip = () => { skipped = true; app.audio.cancel(); res(); }; })]);
    spans.forEach((s) => s.el.classList.add('on'));
    if (!skipped) await sleep(Math.max(60, 350 / speed));
  } else {
    await sleep(Math.max(120, (ev.level === 1 ? 2600 : 1400) / speed + text.length * 6 / speed));
  }
}

function setBar(app, ev, text, speaker, revealAll) {
  const bar = app.bar;
  const club = ev.team ? M.sim.teams[ev.team].club : null;
  let bgc = '#0a1428', fg = '#ffffff';
  if (speaker === 'lead' && club) { bgc = club.colors[0]; fg = contrast(bgc) === '#ffffff' ? (contrast(club.colors[1]) === '#0b1224' ? club.colors[1] : '#ffffff') : '#0b1224'; }
  bar.style.setProperty('--bar-bg', bgc);
  bar.style.setProperty('--bar-fg', fg);
  bar.classList.toggle('analyst', speaker === 'analyst');
  bar.classList.remove('flash');
  if (ev.type === 'goal' && speaker === 'lead') { void bar.offsetWidth; bar.classList.add('flash'); }
  bar.innerHTML = '';
  bar.appendChild(h('span', { class: 'who' }, speaker === 'lead' ? `${ev.display}'` : 'Co-commentator'));
  const spans = [];
  const line = h('span', { class: 'txt' });
  for (const m of text.matchAll(/\S+/g)) {
    const el = h('span', { class: `w ${revealAll ? 'on' : ''}` }, m[0]);
    spans.push({ start: m.index, el });
    line.appendChild(el); line.appendChild(document.createTextNode(' '));
  }
  bar.appendChild(line);
  return spans;
}

function feedLine(f) {
  const cls = f.type === 'goal' ? 'goal' : f.type === 'yellow' ? 'card-y' : f.type === 'red' || f.type === 'second_yellow' ? 'card-r' : f.type === 'analyst' ? 'analyst' : '';
  return h('div', { class: cls }, h('span', { class: 'min' }, f.display ? `${f.display}'` : ''), f.text);
}

function updateScorers(app) {
  if (!M.el) return;
  const g = app.game;
  const fmt = (side) => M.sim.scorers.filter((s) => s.side === side).map((s) => `${surname(g.player(s.pid).name)} ${s.minute}'${s.kind === 'penalty' ? ' (p)' : ''}`).join(', ');
  const reds = (side) => M.sim.teams[side].sentOff.map((pid) => `🟥 ${surname(g.player(pid).name)}`).join(' ');
  M.el.scorersH.textContent = [fmt('home'), reds('home')].filter(Boolean).join('  ');
  M.el.scorersA.textContent = [fmt('away'), reds('away')].filter(Boolean).join('  ');
}

function updateStats(app) {
  if (!M.el) return;
  const s = M.sim.summary();
  const H = M.sim.teams.home.club, A = M.sim.teams.away.club;
  const row = (lbl, a, b) => {
    const tot = (+a || 0) + (+b || 0) || 1;
    return h('div', {}, h('div', { class: 'stat-row' }, h('span', {}, a), h('span', { class: 'lbl' }, lbl), h('span', { style: { textAlign: 'right' } }, b)),
      h('div', { class: 'stat-bar' }, h('i', { style: { width: `${(a / tot) * 100}%`, background: H.colors[0] === '#FFFFFF' ? H.colors[1] : H.colors[0] } }), h('i', { style: { width: `${(b / tot) * 100}%`, background: A.colors[0] === '#FFFFFF' ? A.colors[1] : A.colors[0] } })));
  };
  M.el.stats.innerHTML = '';
  M.el.stats.append(row('Possession %', s.home.possession, s.away.possession), row('Shots', s.home.shots, s.away.shots), row('On target', s.home.onTarget, s.away.onTarget),
    row('xG', s.home.xg, s.away.xg), row('Corners', s.home.corners, s.away.corners), row('Fouls', s.home.fouls, s.away.fouls), row('Yellow cards', s.home.yellows, s.away.yellows), row('Red cards', s.home.reds, s.away.reds));
  const T = M.sim.teams[M.userSide];
  M.el.ratings.innerHTML = '';
  M.el.ratings.appendChild(h('table', { class: 'cm' }, h('tbody', {}, T.onPitch.map((x) => {
    const p = app.game.player(x.pid);
    const r = T.ratings[x.pid];
    return h('tr', {}, h('td', { class: 'yellow' }, T.tactic.slots[x.slotIdx].pos), h('td', {}, surname(p.name), T.yellows[x.pid] ? ' 🟨' : ''), h('td', { class: `num ${T.cond[x.pid] < 70 ? 'red' : T.cond[x.pid] < 82 ? 'orange' : ''}` }, `${Math.round(T.cond[x.pid])}%`), h('td', { class: `num ${r >= 7.5 ? 'green' : r < 6 ? 'red' : ''}` }, r.toFixed(1)));
  }))));
}

// Radar: home attacks left → right. Players drift between With-Ball / Without-Ball zones.
function drawRadar(app) {
  if (!M || M.phase !== 'live' || !M.el?.canvas?.isConnected) return;
  const c = M.el.canvas, ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.fillStyle = '#16682f'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 10; i++) { if (i % 2) { ctx.fillStyle = '#187234'; ctx.fillRect((i * W) / 10, 0, W / 10, H); } }
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, W - 12, H - 12);
  ctx.beginPath(); ctx.moveTo(W / 2, 6); ctx.lineTo(W / 2, H - 6); ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2, H / 2, H * 0.13, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeRect(6, H * 0.22, W * 0.155, H * 0.56); ctx.strokeRect(W - 6 - W * 0.155, H * 0.22, W * 0.155, H * 0.56);
  ctx.strokeRect(6, H * 0.37, W * 0.05, H * 0.26); ctx.strokeRect(W - 6 - W * 0.05, H * 0.37, W * 0.05, H * 0.26);
  // Ball smoothing
  M.ball.x += (M.ballTarget.x - M.ball.x) * 0.12;
  M.ball.y += (M.ballTarget.y - M.ball.y) * 0.12;
  const t = performance.now() / 1000;
  for (const side of ['home', 'away']) {
    const T = M.sim.teams[side];
    const club = T.club;
    const withBall = M.poss === side;
    for (const x of T.onPitch) {
      const s = T.tactic.slots[x.slotIdx];
      const zone = withBall ? s.wib : s.wob;
      let depth = s.pos === 'GK' ? 0.03 : (s.y * 0.45 + ((zone.r + 0.5) / 5) * 0.55);
      let width = s.pos === 'GK' ? 0.5 : (s.x * 0.5 + ((zone.c + 0.5) / 5) * 0.5);
      // drift toward ball
      const bx = side === 'home' ? M.ball.x : 1 - M.ball.x, by = side === 'home' ? M.ball.y : 1 - M.ball.y;
      if (s.pos !== 'GK') { depth += (bx - depth) * 0.18; width += (by - width) * 0.12; }
      depth += Math.sin(t * 0.9 + x.slotIdx) * 0.006; width += Math.cos(t * 0.7 + x.slotIdx * 2) * 0.008;
      const px = side === 'home' ? depth : 1 - depth, py = side === 'home' ? width : 1 - width;
      const cx = 6 + px * (W - 12), cy = 6 + py * (H - 12);
      ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fillStyle = s.pos === 'GK' ? '#222' : club.colors[0]; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = club.colors[1]; ctx.stroke();
      if (side === M.userSide) { ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Tahoma'; ctx.textAlign = 'center'; ctx.fillText(surname(app.game.player(x.pid).name).slice(0, 10), cx, cy - 12); }
    }
  }
  const bx = 6 + M.ball.x * (W - 12), by = 6 + M.ball.y * (H - 12);
  ctx.beginPath(); ctx.arc(bx, by, 5.5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke();
  requestAnimationFrame(() => drawRadar(app));
}

// ---------------- POST-MATCH ----------------
function finishMatch(app) {
  const g = app.game;
  app.audio.cancel();
  app.crowd.setIntensity(0.15);
  M.summary = M.sim.summary();
  M.teams = { home: M.sim.teams.home.club, away: M.sim.teams.away.club };
  M.ratings = { home: M.sim.teams.home.ratings, away: M.sim.teams.away.ratings };
  g.completeUserMatch(M.sim);
  if (M.savedLineup) { g.user.tactic.lineup = M.savedLineup.lineup; g.user.tactic.subs = M.savedLineup.subs; }
  app.autosave();
  M.phase = 'post';
  app.render();
}

function postMatch(app) {
  const g = app.game, s = M.summary, H = M.teams.home, A = M.teams.away;
  app.showBar(false);
  const all = [...Object.entries(M.ratings.home), ...Object.entries(M.ratings.away)].sort((a, b) => b[1] - a[1]);
  const motm = g.player(all[0]?.[0]);
  const rt = (side) => h('table', { class: 'cm' }, h('tbody', {}, Object.entries(M.ratings[side]).sort((a, b) => b[1] - a[1]).map(([pid, r]) => {
    const p = g.player(pid);
    return h('tr', { class: 'click', onclick: () => app.go('player', { id: pid }) }, h('td', {}, p?.name || '?'), h('td', { class: `num ${r >= 7.5 ? 'green' : r < 6 ? 'red' : ''}` }, h('b', {}, r.toFixed(1))));
  })));
  const line = (lbl, a, b) => h('tr', {}, h('td', { class: 'num' }, h('b', {}, a)), h('td', { style: { textAlign: 'center' }, class: 'muted' }, lbl), h('td', {}, h('b', {}, b)));
  const goals = (side) => s.scorers.filter((x) => x.side === side).map((x) => `${surname(g.player(x.pid)?.name || '')} ${x.minute}'`).join(', ');
  return h('div', {},
    h('div', { class: 'scoreboard' }, h('div', {}, h('div', { class: 'team home', style: teamStyle(H) }, H.name), h('div', { class: 'scorers', style: { textAlign: 'right' } }, goals('home'))), h('div', {}, h('div', { class: 'score' }, `${s.score[0]} - ${s.score[1]}`), h('div', { class: 'clock' }, 'FULL TIME')), h('div', {}, h('div', { class: 'team', style: teamStyle(A) }, A.name), h('div', { class: 'scorers' }, goals('away')))),
    motm ? h('div', { style: { textAlign: 'center', marginBottom: '10px', fontSize: '15px' } }, 'Man of the Match: ', h('b', { class: 'yellow' }, `${motm.name} (${all[0][1].toFixed(1)})`)) : null,
    h('div', { class: 'grid3' }, panel(H.name, rt('home'), { bodyStyle: { padding: 0 } }),
      panel('Statistics', h('table', { class: 'cm' }, h('tbody', {}, line('Possession', `${s.home.possession}%`, `${s.away.possession}%`), line('Shots', s.home.shots, s.away.shots), line('On target', s.home.onTarget, s.away.onTarget), line('xG', s.home.xg, s.away.xg), line('Corners', s.home.corners, s.away.corners), line('Fouls', s.home.fouls, s.away.fouls), line('Yellows', s.home.yellows, s.away.yellows), line('Reds', s.home.reds, s.away.reds)))),
      panel(A.name, rt('away'), { bodyStyle: { padding: 0 } })),
    h('div', { style: { textAlign: 'center' } }, h('button', { class: 'btn primary', style: { fontSize: '15px', padding: '8px 26px' }, onclick: () => { M = null; app.go('inbox', { open: g.s.inbox[0]?.id }, false); } }, 'Continue')));
}
