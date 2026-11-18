// Game state: calendar, inbox, transfers, contracts, finances, training, board, season rollover.
import { RNG, clamp } from '../core/rng.js';
import { LEAGUES, CLUBS, TRANSFER_WINDOWS, GAME_START_DATE, SEASON_LABEL } from '../data/leagues.js';
import { buildWorld, leagueById, createPlayer, setNextId, getNextId } from '../data/generator.js';
import { NAME_POOLS, LEAGUE_NAT_MIX } from '../data/names.js';
import { generateLeagueFixtures, computeTable, addDays, dayOfWeek, daysBetween } from './fixtures.js';
import { MatchSimulator } from './match.js';
import { autoPick, validateLineup } from './tactics.js';
import { valueFromAbility, wageFromAbility, clubTargetCA, TECHNICAL, MENTAL, PHYSICAL, GOALKEEPING } from './attributes.js';
import { surname } from './commentary.js';

export const fmtMoney = (v) => {
  const s = v < 0 ? '-' : '';
  v = Math.abs(v);
  if (v >= 1e6) return `${s}€${(v / 1e6).toFixed(v >= 1e8 ? 0 : 1)}M`;
  if (v >= 1e3) return `${s}€${Math.round(v / 1e3)}K`;
  return `${s}€${Math.round(v)}`;
};
export const fmtDate = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

const SQUAD_STATUS = ['Key Player', 'First Team', 'Rotation', 'Backup', 'Youngster'];
const TRAINING_AREAS = {
  fitness: ['stamina', 'pace', 'acceleration', 'strength', 'agility', 'balance', 'jumping'],
  tactics: ['decisions', 'anticipation', 'teamwork', 'workRate', 'marking'],
  ballControl: ['technique', 'dribbling', 'passing', 'flair'],
  shooting: ['finishing', 'longShots', 'penalties', 'setPieces'],
  attacking: ['offTheBall', 'crossing', 'creativity', 'heading'],
  defending: ['tackling', 'marking', 'heading', 'bravery'],
};
export const TRAINING_LABELS = { fitness: 'Fitness', tactics: 'Tactics', ballControl: 'Ball Control', shooting: 'Shooting', attacking: 'Attacking', defending: 'Defending' };

export class Game {
  constructor(state) {
    this.s = state;
    this.rng = new RNG((state.seed + daysBetween(GAME_START_DATE, state.date) * 7919) >>> 0);
    this._tableCache = {};
    setNextId(state.nextId);
  }

  static newGame({ managerName, clubId, hydrated = null, seed = (Date.now() & 0x7fffffff) }) {
    const rng = new RNG(seed);
    const world = buildWorld(rng, hydrated);
    const fixtures = [];
    let id = 1;
    for (const lg of LEAGUES) { const fx = generateLeagueFixtures(lg, CLUBS[lg.id].map((c) => c.id), rng, id); id += fx.length; fixtures.push(...fx); }
    fixtures.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    const state = {
      version: 1, seed, date: GAME_START_DATE, season: SEASON_LABEL, seasonYear: 2026, userClubId: clubId, managerName,
      clubs: world.clubs, players: world.players, nextId: world.nextId, fixtures, inbox: [], offers: [], scheduled: [],
      training: { fitness: 2, tactics: 2, ballControl: 2, shooting: 2, attacking: 2, defending: 2 },
      board: { confidence: 60, expectation: null }, pendingMatch: null, lastMatch: null, meta: world.meta, sacked: false, nextMsgId: 1, nextOfferId: 1,
      history: [],
    };
    const g = new Game(state);
    g.welcome();
    return g;
  }

  // ---------- accessors ----------
  get date() { return this.s.date; }
  get user() { return this.s.clubs[this.s.userClubId]; }
  club(id) { return this.s.clubs[id]; }
  player(id) { return this.s.players[id]; }
  league(id) { return leagueById(id); }
  squad(clubId) { return this.club(clubId).playerIds.map((id) => this.s.players[id]).filter(Boolean); }
  unread() { return this.s.inbox.filter((m) => !m.read).length; }
  inWindow(date = this.s.date) { return TRANSFER_WINDOWS.some(([a, b]) => date >= shiftYear(a, this.s.seasonYear - 2026) && date <= shiftYear(b, this.s.seasonYear - 2026)); }
  table(leagueId) {
    const key = leagueId + ':' + this.s.fixtures.filter((f) => f.played && f.league === leagueId).length;
    if (!this._tableCache[key]) this._tableCache[key] = computeTable(this.s.fixtures, leagueId, CLUBS[leagueId].map((c) => c.id));
    return this._tableCache[key];
  }
  clubFixtures(clubId) { return this.s.fixtures.filter((f) => f.home === clubId || f.away === clubId); }
  nextFixture(clubId = this.s.userClubId) { return this.s.fixtures.find((f) => !f.played && (f.home === clubId || f.away === clubId)); }
  position(clubId) { const c = this.club(clubId); return this.table(c.league).findIndex((r) => r.club === clubId) + 1; }

  msg(subject, body, opts = {}) {
    const m = { id: this.s.nextMsgId++, date: this.s.date, from: opts.from || 'Assistant Manager', subject, body, type: opts.type || 'info', read: false, actions: opts.actions || [], data: opts.data || null };
    this.s.inbox.unshift(m);
    if (this.s.inbox.length > 250) this.s.inbox.length = 250;
    this._newMessages = (this._newMessages || 0) + 1;
    return m;
  }

  welcome() {
    const c = this.user, lg = this.league(c.league);
    const rank = CLUBS[c.league].slice().sort((a, b) => b.rep - a.rep).findIndex((x) => x.id === c.id) + 1;
    const n = CLUBS[c.league].length;
    const exp = rank <= 1 ? 'win the league title' : rank <= 3 ? 'finish in the top three' : rank <= 6 ? 'qualify for Europe' : rank <= Math.ceil(n * 0.6) ? 'finish in mid-table' : 'avoid relegation';
    this.s.board.expectation = { text: exp, target: rank <= 1 ? 1 : rank <= 3 ? 3 : rank <= 6 ? 6 : rank <= Math.ceil(n * 0.6) ? Math.ceil(n * 0.6) : n - 3 };
    this.msg(`Welcome to ${c.name}`, `The board of ${c.name} welcome ${this.s.managerName} as the new manager.\n\nYou take charge for the ${this.s.season} ${lg.name} season. Your transfer budget is ${fmtMoney(c.finances.transferBudget)} and the weekly wage budget is ${fmtMoney(c.finances.wageBudget)}.\n\nThe board expect you to ${exp}.`, { from: 'Chairman', type: 'board' });
    this.msg('Transfer window open', `The summer transfer window is open until ${fmtDate(shiftYear('2026-09-01', this.s.seasonYear - 2026))}. Use Player Search to find targets, then make an offer from the player's profile.`, { from: 'Director of Football' });
    const nf = this.nextFixture();
    if (nf) this.msg('Season schedule', `Our first ${lg.name} match is ${nf.home === c.id ? 'at home to' : 'away at'} ${this.club(nf.home === c.id ? nf.away : nf.home).name} on ${fmtDate(nf.date)}.`, { from: 'Club Secretary' });
  }

  // ---------- time ----------
  /** Advance until something needs the manager. Returns { status: 'match'|'news'|'day'|'seasonEnd'|'sacked' } */
  continue() {
    if (this.s.sacked) return { status: 'sacked' };
    if (this.s.pendingMatch) return { status: 'match', fixture: this.s.fixtures.find((f) => f.id === this.s.pendingMatch) };
    this._newMessages = 0;
    for (let i = 0; i < 14; i++) {
      const res = this.advanceDay();
      if (res.status !== 'day') return res;
      if (this._newMessages > 0) return { status: 'news' };
    }
    return { status: 'day' };
  }

  advanceDay() {
    const s = this.s;
    s.date = addDays(s.date, 1);
    const d = s.date;
    // Season rollover on 1 July
    if (d.slice(5) === '07-01' && Number(d.slice(0, 4)) > s.seasonYear) { this.newSeason(); }
    this.dailyRecovery();
    if (dayOfWeek(d) === 1) { this.weeklyWages(); this.weeklyTraining(); }
    if (d.slice(8) === '01') this.monthly();
    this.resolveOffers();
    if (s.scoutQueue?.length) { for (const x of s.scoutQueue.filter((q) => q.date <= d)) this.deliverScout(x.playerId); s.scoutQueue = s.scoutQueue.filter((q) => q.date > d); }
    if (this.inWindow()) this.aiMarket();
    this.windowNotices();
    // Matches today
    const today = s.fixtures.filter((f) => f.date === d && !f.played);
    let userFx = null;
    for (const f of today) {
      if (f.home === s.userClubId || f.away === s.userClubId) { userFx = f; continue; }
      this.playAI(f);
    }
    this.checkSeasonEnd();
    if (s.sacked) return { status: 'sacked' };
    if (userFx) { s.pendingMatch = userFx.id; return { status: 'match', fixture: userFx }; }
    return { status: 'day' };
  }

  dailyRecovery() {
    for (const p of Object.values(this.s.players)) {
      if (p.injury) {
        p.injury.days--;
        if (p.injury.days <= 0) {
          if (p.clubId === this.s.userClubId) this.msg(`${p.name} back in training`, `${p.name} has recovered from his ${p.injury.type.toLowerCase()} and is available for selection.`, { from: 'Physio', type: 'injury', data: { playerId: p.id } });
          p.injury = null;
        }
      }
      const fitI = p.clubId === this.s.userClubId ? this.s.training.fitness : 2;
      if (p.condition < 100) p.condition = clamp(p.condition + 5.5 + p.attrs.naturalFitness * 0.25 - (fitI - 2) * 0.6, 0, 100);
    }
  }

  weeklyWages() {
    for (const c of Object.values(this.s.clubs)) {
      const wages = this.squad(c.id).reduce((s, p) => s + p.wage, 0);
      this.ledger(c, -wages, 'wages', 'Player wages');
      const lg = this.league(c.league);
      this.ledger(c, Math.round((c.rep / 100) ** 3 * lg.tvPerMatch * 0.9), 'sponsorship', 'Sponsorship & merchandise');
    }
  }

  ledger(club, amount, type, desc) {
    const f = club.finances;
    f.balance += amount;
    const bucket = amount >= 0 ? f.seasonIncome : f.seasonExpense;
    bucket[type] = (bucket[type] || 0) + Math.abs(amount);
    if (club.id === this.s.userClubId) { f.ledger.unshift({ date: this.s.date, amount, type, desc }); if (f.ledger.length > 120) f.ledger.length = 120; }
  }

  weeklyTraining() {
    const s = this.s;
    for (const p of Object.values(s.players)) {
      const tr = p.clubId === s.userClubId ? s.training : null;
      const intensity = tr ? Object.values(tr).reduce((a, b) => a + b, 0) / 6 : 2;
      const det = p.attrs.determination;
      const ageF = p.age <= 19 ? 1.15 : p.age <= 21 ? 1 : p.age <= 24 ? 0.7 : p.age <= 27 ? 0.3 : p.age <= 30 ? 0 : p.age <= 32 ? -0.35 : -0.8;
      const gap = p.pa - p.ca;
      let delta = 0;
      if (ageF > 0 && gap > 0) delta = gap * 0.0065 * ageF * (0.55 + det / 22) * (0.55 + intensity / 4.5) * (p.stats.apps > 0 ? 1.15 : 1);
      if (ageF < 0) delta = ageF * 0.22 * (1.2 - p.attrs.naturalFitness / 25);
      delta += this.rng.normal(0, 0.08);
      if (Math.abs(delta) < 0.01) continue;
      p.ca = clamp(p.ca + delta, 1, Math.max(p.pa, p.ca));
      // Distribute attribute change by training focus
      const areas = tr || { fitness: 2, tactics: 2, ballControl: 2, shooting: 2, attacking: 2, defending: 2 };
      const totalW = Object.values(areas).reduce((a, b) => a + b, 0) || 1;
      for (const [area, w] of Object.entries(areas)) {
        if (!w) continue;
        const share = (delta * 0.11 * 6 * (w / totalW)) / TRAINING_AREAS[area].length;
        for (const a of TRAINING_AREAS[area]) {
          const decay = ageF < 0 && ['pace', 'acceleration', 'stamina', 'agility'].includes(a) ? 1.6 : 1;
          p.attrs[a] = clamp(Math.round((p.attrs[a] + share * decay * 3) * 100) / 100, 1, 20);
        }
      }
      // Training injury risk for very high intensity
      if (tr && intensity > 3 && !p.injury && this.rng.chance(0.004 * (intensity - 2) * (p.attrs.injuryProneness / 10))) {
        p.injury = { type: 'Training Knock', days: this.rng.int(3, 12) };
        this.msg(`${p.name} injured in training`, `${p.name} picked up a knock in training and will be out for around ${p.injury.days} days. The intensity of our schedule is high.`, { from: 'Physio', type: 'injury', data: { playerId: p.id } });
      }
    }
    // revalue weekly
    for (const p of Object.values(s.players)) { const lg = this.league(this.club(p.clubId)?.league || 'eng1'); p.value = valueFromAbility(p.ca, p.pa, p.age, lg.valueFactor); }
  }

  monthly() {
    // Installments
    const due = this.s.scheduled.filter((x) => x.date <= this.s.date);
    for (const x of due) {
      const payer = this.club(x.payer), payee = this.club(x.payee);
      this.ledger(payer, -x.amount, 'transfers', x.desc); this.ledger(payee, x.amount, 'transfers', x.desc);
    }
    this.s.scheduled = this.s.scheduled.filter((x) => x.date > this.s.date);
    // Board confidence update
    const exp = this.s.board.expectation;
    const pos = this.position(this.s.userClubId);
    const played = this.clubFixtures(this.s.userClubId).filter((f) => f.played).length;
    if (played >= 4 && exp) {
      const diff = exp.target - pos;
      this.s.board.confidence = clamp(this.s.board.confidence + diff * 1.5 + (this.user.finances.balance < 0 ? -4 : 1), 0, 100);
      if (this.s.board.confidence < 8) {
        this.s.sacked = true;
        this.msg('You have been sacked', `The board of ${this.user.name} have lost confidence in your ability to ${exp.text}. Your contract has been terminated with immediate effect.`, { from: 'Chairman', type: 'board' });
      } else if (this.s.board.confidence < 25) {
        this.msg('Board concern', `The board are concerned with the team's position (${ordinal(pos)}). They expect you to ${exp.text}. Results must improve.`, { from: 'Chairman', type: 'board' });
      }
    }
  }

  windowNotices() {
    const y = this.s.seasonYear - 2026;
    const d = this.s.date;
    if (d === shiftYear('2026-08-25', y)) this.msg('Transfer deadline approaching', 'The summer window closes on 1 September. Any deals must be completed before then.', { from: 'Director of Football' });
    if (d === shiftYear('2026-09-02', y)) this.msg('Transfer window closed', 'The summer transfer window is now closed. It reopens on 2 January.', { from: 'Director of Football' });
    if (d === shiftYear('2027-01-02', y)) this.msg('January window open', 'The winter transfer window is now open until 2 February.', { from: 'Director of Football' });
  }

  // ---------- matches ----------
  prepareTactic(clubId) {
    const c = this.club(clubId);
    if (clubId !== this.s.userClubId) autoPick(c, this.s.players, c.tactic);
    else validateLineup(c, this.s.players, c.tactic);
    return c.tactic;
  }

  createSim(fx, withText = true) {
    const hc = this.club(fx.home), ac = this.club(fx.away);
    this.prepareTactic(fx.home); this.prepareTactic(fx.away);
    // AI adjusts mentality vs opponent strength
    for (const [c, o] of [[hc, ac], [ac, hc]]) {
      if (c.id === this.s.userClubId) continue;
      const diff = c.rep - o.rep + (c === hc ? 4 : 0);
      c.tactic.instructions.mentality = diff > 12 ? 3 : diff < -15 ? 1 : 2;
    }
    const userSide = fx.home === this.s.userClubId ? 'home' : fx.away === this.s.userClubId ? 'away' : null;
    return new MatchSimulator({
      players: this.s.players, homeClub: hc, awayClub: ac,
      homeTactic: userSide === 'home' ? hc.tactic : structuredClone(hc.tactic),
      awayTactic: userSide === 'away' ? ac.tactic : structuredClone(ac.tactic),
      rng: this.rng, withText, userSide, fixture: fx,
    });
  }

  playAI(fx) {
    const sim = this.createSim(fx, false);
    sim.runToEnd();
    this.applyResult(fx, sim);
  }

  applyResult(fx, sim) {
    const s = sim.summary();
    fx.played = true; fx.hg = s.score[0]; fx.ag = s.score[1];
    fx.stats = { home: s.home, away: s.away };
    fx.scorers = s.scorers.map((x) => ({ side: x.side, name: this.player(x.pid)?.name, minute: x.minute, kind: x.kind }));
    const lg = this.league(this.club(fx.home).league);
    for (const side of ['home', 'away']) {
      const clubId = side === 'home' ? fx.home : fx.away;
      const club = this.club(clubId);
      const appeared = new Set(s.appeared[side]);
      const gf = side === 'home' ? fx.hg : fx.ag, ga = side === 'home' ? fx.ag : fx.hg;
      for (const p of this.squad(clubId)) {
        if (p.suspension > 0 && !appeared.has(p.id)) p.suspension--;
        if (appeared.has(p.id)) {
          p.stats.apps++;
          const r = s.ratings[side][p.id];
          if (r) { p.stats.ratingSum += r; p.stats.rated++; }
          p.condition = clamp(Math.round(s.cond[side][p.id] ?? p.condition), 0, 100);
          if (ga === 0 && (p.positions[0] === 'GK' || p.positions[0].startsWith('D'))) p.stats.cleanSheets++;
          p.morale = clamp(p.morale + (gf > ga ? 0.4 : gf < ga ? -0.4 : 0) + ((r || 6.5) - 6.6) * 0.3, 1, 10);
        } else {
          p.morale = clamp(p.morale - (p.squadStatus === 'Key Player' || p.squadStatus === 'First Team' ? 0.15 : 0.02) + (gf > ga ? 0.1 : 0), 1, 10);
        }
      }
      // Gate + TV
      if (side === 'home') {
        const fill = clamp(0.55 + club.rep / 230 + (this.position(clubId) <= 4 ? 0.05 : 0), 0.4, 1);
        this.ledger(club, Math.round(club.capacity * fill * lg.ticket), 'gate', `Gate receipts v ${this.club(fx.away).short}`);
      }
      this.ledger(club, lg.tvPerMatch, 'tv', 'TV & broadcasting');
    }
    for (const g of s.scorers) {
      const p = this.player(g.pid); if (p) p.stats.goals++;
      if (g.assist) { const a = this.player(g.assist); if (a) a.stats.assists++; }
    }
    for (const c of s.cards) {
      const p = this.player(c.pid); if (!p) continue;
      if (c.color === 'yellow') { p.stats.yellows++; p.yellowAccum = (p.yellowAccum || 0) + 1; if (p.yellowAccum >= 5) { p.yellowAccum = 0; p.suspension = (p.suspension || 0) + 1; if (p.clubId === this.s.userClubId) this.msg(`${p.name} suspended`, `${p.name} has picked up five bookings and will miss the next match.`, { from: 'Club Secretary', type: 'discipline' }); } }
    }
    const reds = new Set(s.cards.filter((c) => c.color === 'red').map((c) => c.pid));
    for (const pid of reds) { const p = this.player(pid); p.stats.reds++; const ban = this.rng.int(1, 3); p.suspension = (p.suspension || 0) + ban; if (p.clubId === this.s.userClubId) this.msg(`${p.name} suspended`, `${p.name} has been suspended for ${ban} match${ban > 1 ? 'es' : ''} following his sending off.`, { from: 'Club Secretary', type: 'discipline' }); }
    for (const inj of s.injuries) {
      const p = this.player(inj.pid); if (!p) continue;
      p.injury = { type: inj.type, days: inj.days };
      if (p.clubId === this.s.userClubId) this.msg(`${p.name} injured`, `${p.name} suffered a ${inj.type.toLowerCase()} and is expected to be out for ${inj.days < 7 ? 'a few days' : inj.days < 21 ? `${Math.round(inj.days / 7)} week(s)` : `around ${Math.round(inj.days / 30)} month(s)`}.`, { from: 'Physio', type: 'injury', data: { playerId: p.id } });
    }
    this._tableCache = {};
  }

  completeUserMatch(sim) {
    const fx = this.s.fixtures.find((f) => f.id === this.s.pendingMatch);
    if (!fx) return;
    this.applyResult(fx, sim);
    this.s.pendingMatch = null;
    const s = sim.summary();
    const isHome = fx.home === this.s.userClubId;
    const gf = isHome ? fx.hg : fx.ag, ga = isHome ? fx.ag : fx.hg;
    const opp = this.club(isHome ? fx.away : fx.home);
    this.s.board.confidence = clamp(this.s.board.confidence + (gf > ga ? 2 : gf < ga ? -2.5 : 0) + (opp.rep - this.user.rep) / 20 * (gf >= ga ? 1 : 0), 0, 100);
    const scorers = s.scorers.filter((x) => x.side === (isHome ? 'home' : 'away')).map((x) => `${surname(this.player(x.pid).name)} ${x.minute}'`).join(', ');
    this.s.lastMatch = { fixtureId: fx.id, summary: { score: s.score, home: s.home, away: s.away } };
    this.msg(`${this.club(fx.home).name} ${fx.hg} - ${fx.ag} ${this.club(fx.away).name}`, `${gf > ga ? 'Victory' : gf < ga ? 'Defeat' : 'A draw'} ${isHome ? 'at home to' : 'away at'} ${opp.name}.${scorers ? `\nScorers: ${scorers}.` : ''}\nWe are now ${ordinal(this.position(this.s.userClubId))} in the ${this.league(this.user.league).name}.`, { from: 'Match Report', type: 'result', data: { fixtureId: fx.id } });
  }

  // ---------- transfers ----------
  askingPrice(p) {
    const c = this.club(p.clubId);
    const sq = this.squad(c.id).sort((a, b) => b.ca - a.ca);
    const rank = sq.findIndex((x) => x.id === p.id);
    const importance = rank < 5 ? 1.55 : rank < 11 ? 1.3 : rank < 18 ? 1.1 : 0.9;
    const yearsLeft = Math.max(0, Number(p.contractEnd.slice(0, 4)) - Number(this.s.date.slice(0, 4)));
    const contractF = yearsLeft <= 0 ? 0.55 : yearsLeft === 1 ? 0.8 : 1;
    const listed = p.transferListed ? 0.8 : 1;
    return Math.round(p.value * importance * contractF * listed / 50000) * 50000 || 50000;
  }

  canBuy(playerId) {
    const p = this.player(playerId);
    if (!p) return 'Unknown player';
    if (p.clubId === this.s.userClubId) return 'He is already your player';
    if (!this.inWindow()) return 'The transfer window is closed';
    if (this.s.offers.some((o) => o.playerId === playerId && o.status === 'pending')) return 'You already have an offer pending for this player';
    return null;
  }

  makeOffer({ playerId, fee, installments = 0, sellOn = 0, viaReleaseClause = false }) {
    const err = this.canBuy(playerId);
    if (err) return { error: err };
    const p = this.player(playerId);
    const upfront = installments ? Math.round(fee * 0.4) : fee;
    if (upfront > this.user.finances.transferBudget) return { error: `The upfront fee (${fmtMoney(upfront)}) exceeds your transfer budget (${fmtMoney(this.user.finances.transferBudget)}).` };
    const o = { id: this.s.nextOfferId++, kind: 'buy', playerId, seller: p.clubId, buyer: this.s.userClubId, fee, installments, sellOn, status: 'pending', created: this.s.date, resolveDate: viaReleaseClause ? this.s.date : addDays(this.s.date, 1), viaReleaseClause };
    this.s.offers.push(o);
    if (viaReleaseClause) { o.status = 'accepted'; this.offerAcceptedMsg(o); }
    return { offer: o };
  }

  resolveOffers() {
    for (const o of this.s.offers) {
      if (o.status !== 'pending' || o.resolveDate > this.s.date) continue;
      const p = this.player(o.playerId);
      if (!p || p.clubId !== o.seller) { o.status = 'void'; continue; }
      if (o.kind === 'buy') {
        const ask = this.askingPrice(p);
        const effective = o.fee * (1 - 0.025 * (o.installments / 12)) + (o.sellOn / 100) * p.value * 0.35;
        const sellerClub = this.club(o.seller);
        if (effective >= ask) { o.status = 'accepted'; this.offerAcceptedMsg(o); }
        else if (effective >= ask * 0.72) {
          o.status = 'countered'; o.counter = Math.round(ask * 1.02 / 50000) * 50000;
          this.msg(`Counter offer for ${p.name}`, `${sellerClub.name} have rejected your offer of ${fmtMoney(o.fee)} for ${p.name} but would accept ${fmtMoney(o.counter)}${o.installments ? ` (installments over ${o.installments} months)` : ''}.`, { from: sellerClub.name, type: 'transfer', actions: [{ label: `Accept ${fmtMoney(o.counter)}`, action: 'acceptCounter', data: { offerId: o.id } }, { label: 'Make new offer', action: 'openOffer', data: { playerId: p.id } }], data: { playerId: p.id } });
        } else {
          o.status = 'rejected';
          this.msg(`Offer rejected for ${p.name}`, `${sellerClub.name} have rejected your offer of ${fmtMoney(o.fee)} for ${p.name}. They consider him worth considerably more.`, { from: sellerClub.name, type: 'transfer', actions: [{ label: 'Make new offer', action: 'openOffer', data: { playerId: p.id } }], data: { playerId: p.id } });
        }
      }
    }
  }

  offerAcceptedMsg(o) {
    const p = this.player(o.playerId), seller = this.club(o.seller);
    this.msg(`Offer accepted for ${p.name}`, `${seller.name} have accepted your offer of ${fmtMoney(o.fee)} for ${p.name}. You may now discuss personal terms with the player.`, { from: seller.name, type: 'transfer', actions: [{ label: 'Negotiate contract', action: 'openContract', data: { offerId: o.id } }], data: { playerId: p.id } });
  }

  acceptCounter(offerId) {
    const o = this.s.offers.find((x) => x.id === offerId);
    if (!o || o.status !== 'countered') return { error: 'Offer no longer valid' };
    const upfront = o.installments ? Math.round(o.counter * 0.4) : o.counter;
    if (upfront > this.user.finances.transferBudget) return { error: 'Not enough transfer budget for the counter offer.' };
    o.fee = o.counter; o.status = 'accepted';
    this.offerAcceptedMsg(o);
    return { ok: true };
  }

  playerDemands(p, buyerClubId = this.s.userClubId, status = 'First Team') {
    const buyer = this.club(buyerClubId), lg = this.league(buyer.league);
    const base = wageFromAbility(p.ca, lg.valueFactor);
    const repF = clamp(1 + (this.club(p.clubId).rep - buyer.rep) / 60, 0.8, 1.6);
    const statusF = { 'Key Player': 1.15, 'First Team': 1, Rotation: 0.85, Backup: 0.7, Youngster: 0.6 }[status] ?? 1;
    const wage = Math.max(p.wage * 1.08, base * repF * statusF);
    return { wage: Math.round(wage / 100) * 100, signOn: Math.round(wage * 8 / 1000) * 1000, years: p.age > 30 ? 2 : p.age > 27 ? 3 : 4 };
  }

  expectedStatus(p, buyerClubId = this.s.userClubId) {
    const sq = this.squad(buyerClubId).sort((a, b) => b.ca - a.ca);
    const rank = sq.filter((x) => x.ca > p.ca).length;
    return p.age <= 19 && rank > 12 ? 'Youngster' : rank < 3 ? 'Key Player' : rank < 12 ? 'First Team' : rank < 18 ? 'Rotation' : 'Backup';
  }

  /** Personal terms. terms = { wage, signOn, years, status, releaseClause } */
  proposeContract(offerId, terms) {
    const o = this.s.offers.find((x) => x.id === offerId);
    if (!o || o.status !== 'accepted') return { error: 'This deal is no longer available.' };
    const p = this.player(o.playerId);
    const want = this.playerDemands(p, o.buyer, terms.status);
    const exp = this.expectedStatus(p, o.buyer);
    const statusRank = (s) => SQUAD_STATUS.indexOf(s);
    if (statusRank(terms.status) > statusRank(exp) + 1) return { accepted: false, reason: `${surname(p.name)} expects to be a ${exp.toLowerCase()} at the club.`, demand: want };
    const value = terms.wage + terms.signOn / (52 * terms.years) * 0.9;
    const rcPenalty = terms.releaseClause && terms.releaseClause < p.value * 1.2 ? 0 : terms.releaseClause ? 0 : 0.03; // players like having a release clause
    if (value < want.wage * (0.96 + rcPenalty)) return { accepted: false, reason: `${surname(p.name)}'s agent says the offer falls short. He wants around ${fmtMoney(want.wage)} a week.`, demand: want };
    if (terms.years > 5 || (p.age >= 32 && terms.years < 1)) return { accepted: false, reason: 'He is not happy with the contract length.', demand: want };
    const wageRoom = this.user.finances.wageBudget - this.squad(o.buyer).reduce((s, x) => s + x.wage, 0);
    if (o.buyer === this.s.userClubId && terms.wage > wageRoom + 1) return { accepted: false, reason: `The board will not sanction this — it exceeds the remaining wage budget (${fmtMoney(Math.max(0, wageRoom))}/wk).`, demand: want };
    this.completeTransfer(o, terms);
    return { accepted: true };
  }

  completeTransfer(o, terms) {
    const p = this.player(o.playerId);
    const seller = this.club(o.seller), buyer = this.club(o.buyer);
    const upfront = o.installments ? Math.round(o.fee * 0.4) : o.fee;
    this.ledger(buyer, -upfront, 'transfers', `Signed ${p.name}`);
    this.ledger(seller, upfront, 'transfers', `Sold ${p.name}`);
    buyer.finances.transferBudget -= upfront;
    seller.finances.transferBudget += Math.round(upfront * 0.6);
    if (o.installments) {
      const n = Math.max(1, Math.round(o.installments / 3)); // quarterly
      const each = Math.round((o.fee - upfront) / n);
      for (let i = 1; i <= n; i++) this.s.scheduled.push({ date: addDays(this.s.date, 90 * i), payer: buyer.id, payee: seller.id, amount: each, desc: `Installment for ${p.name}` });
      if (buyer.id === this.s.userClubId) buyer.finances.transferBudget -= (o.fee - upfront);
    }
    if (p.sellOn && p.sellOn.pct > 0 && p.sellOn.clubId !== buyer.id) {
      const owed = Math.round(o.fee * p.sellOn.pct / 100);
      const club = this.club(p.sellOn.clubId);
      if (club) { this.ledger(seller, -owed, 'transfers', `Sell-on clause (${p.name})`); this.ledger(club, owed, 'transfers', `Sell-on clause (${p.name})`); }
    }
    seller.playerIds = seller.playerIds.filter((id) => id !== p.id);
    buyer.playerIds.push(p.id);
    p.clubId = buyer.id;
    p.wage = terms.wage; p.squadStatus = terms.status; p.releaseClause = terms.releaseClause || null;
    p.contractEnd = `${Number(this.s.date.slice(0, 4)) + terms.years + (this.s.date.slice(5) > '06-30' ? 1 : 0)}-06-30`;
    p.sellOn = o.sellOn ? { clubId: seller.id, pct: o.sellOn } : null;
    p.transferListed = false;
    p.history.push({ date: this.s.date, from: seller.name, to: buyer.name, fee: o.fee });
    if (terms.signOn) this.ledger(buyer, -terms.signOn, 'transfers', `Signing-on fee (${p.name})`);
    o.status = 'complete';
    this.prepareTactic(seller.id);
    if (buyer.id === this.s.userClubId) this.msg(`${p.name} signs`, `${p.name} has completed his ${fmtMoney(o.fee)} move from ${seller.name}, signing a ${terms.years}-year contract worth ${fmtMoney(terms.wage)} a week.`, { from: 'Director of Football', type: 'transfer', data: { playerId: p.id } });
    if (seller.id === this.s.userClubId) this.msg(`${p.name} sold`, `${p.name} has joined ${buyer.name} for ${fmtMoney(o.fee)}.`, { from: 'Director of Football', type: 'transfer' });
    this._tableCache = {};
  }

  // AI market: AI-to-AI deals and bids for the user's players.
  aiMarket() {
    const s = this.s, r = this.rng;
    const clubs = Object.values(s.clubs).filter((c) => c.id !== s.userClubId);
    // Bid for user's players
    const userSquad = this.squad(s.userClubId);
    if (userSquad.length > 16 && r.chance(0.035 + userSquad.filter((p) => p.transferListed).length * 0.03)) {
      const target = r.weighted(userSquad, (p) => (p.transferListed ? 6 : 1) * Math.pow(p.ca, 2) / 1000);
      const buyers = clubs.filter((c) => c.finances.transferBudget > target.value * 0.8 && clubTargetCA(c.rep) <= target.ca + 18 && clubTargetCA(c.rep) >= target.ca - 20);
      if (buyers.length && !s.offers.some((o) => o.playerId === target.id && o.status === 'pending')) {
        const b = r.pick(buyers);
        const fee = Math.round(target.value * r.range(0.8, 1.3) / 50000) * 50000;
        const o = { id: s.nextOfferId++, kind: 'sell', playerId: target.id, seller: s.userClubId, buyer: b.id, fee, installments: 0, sellOn: 0, status: 'pending', created: s.date, resolveDate: '9999-01-01', maxFee: Math.round(fee * r.range(1.05, 1.35) / 50000) * 50000 };
        s.offers.push(o);
        this.msg(`Offer for ${target.name}`, `${b.name} have made an offer of ${fmtMoney(fee)} for ${target.name} (value ${fmtMoney(target.value)}).`, { from: b.name, type: 'transfer', actions: [{ label: 'Accept', action: 'acceptBid', data: { offerId: o.id } }, { label: `Counter (${fmtMoney(Math.round(fee * 1.25 / 50000) * 50000)})`, action: 'counterBid', data: { offerId: o.id } }, { label: 'Reject', action: 'rejectBid', data: { offerId: o.id } }], data: { playerId: target.id } });
      }
    }
    // AI-to-AI deals
    if (r.chance(0.35)) {
      const buyer = r.pick(clubs);
      const tgt = clubTargetCA(buyer.rep);
      const cands = Object.values(s.players).filter((p) => p.clubId !== buyer.id && p.clubId !== s.userClubId && p.ca >= tgt - 4 && p.ca <= tgt + 14 && p.value <= buyer.finances.transferBudget * 0.7 && this.club(p.clubId).rep <= buyer.rep + 3 && !p.injury);
      if (cands.length) {
        const p = r.pick(cands);
        const fee = Math.round(this.askingPrice(p) * r.range(0.95, 1.15) / 50000) * 50000;
        const terms = { ...this.playerDemands(p, buyer.id), status: this.expectedStatus(p, buyer.id), releaseClause: null };
        const o = { id: s.nextOfferId++, kind: 'ai', playerId: p.id, seller: p.clubId, buyer: buyer.id, fee, installments: 0, sellOn: 0, status: 'accepted' };
        this.completeTransfer(o, terms);
        // keep squad sizes sane: sell weakest if > 30
        if (buyer.playerIds.length > 30) { const weakest = this.squad(buyer.id).sort((a, b) => a.ca - b.ca)[0]; weakest.transferListed = true; }
        if (fee >= 15_000_000) this.msg(`${p.name} joins ${buyer.name}`, `${p.name} has completed a ${fmtMoney(fee)} transfer from ${o.sellerName || this.club(o.seller).name} to ${buyer.name}.`, { from: 'Transfer News', type: 'news', data: { playerId: p.id } });
      }
    }
  }

  acceptBid(offerId) {
    const o = this.s.offers.find((x) => x.id === offerId);
    if (!o || o.status !== 'pending') return { error: 'Offer no longer valid' };
    if (!this.inWindow()) return { error: 'The transfer window has closed.' };
    const p = this.player(o.playerId);
    if (this.squad(this.s.userClubId).length <= 16) return { error: 'You cannot sell — the squad would be too small.' };
    o.status = 'accepted';
    this.completeTransfer(o, { ...this.playerDemands(p, o.buyer), status: this.expectedStatus(p, o.buyer), releaseClause: null });
    return { ok: true };
  }
  counterBid(offerId) {
    const o = this.s.offers.find((x) => x.id === offerId);
    if (!o || o.status !== 'pending') return { error: 'Offer no longer valid' };
    const want = Math.round(o.fee * 1.25 / 50000) * 50000;
    const p = this.player(o.playerId);
    if (want <= o.maxFee) {
      o.fee = want;
      this.msg(`${this.club(o.buyer).name} agree to counter`, `${this.club(o.buyer).name} have agreed to pay ${fmtMoney(want)} for ${p.name}.`, { from: this.club(o.buyer).name, type: 'transfer', actions: [{ label: 'Accept deal', action: 'acceptBid', data: { offerId: o.id } }, { label: 'Reject', action: 'rejectBid', data: { offerId: o.id } }], data: { playerId: p.id } });
    } else {
      o.status = 'rejected';
      this.msg(`${this.club(o.buyer).name} pull out`, `${this.club(o.buyer).name} are not willing to pay ${fmtMoney(want)} for ${p.name} and have ended their interest.`, { from: this.club(o.buyer).name, type: 'transfer' });
    }
    return { ok: true };
  }
  rejectBid(offerId) { const o = this.s.offers.find((x) => x.id === offerId); if (o) o.status = 'rejected'; return { ok: true }; }

  requestScout(playerId) {
    this.s.scoutQueue = this.s.scoutQueue || [];
    if (!this.s.scoutQueue.some((x) => x.playerId === playerId)) this.s.scoutQueue.push({ playerId, date: addDays(this.s.date, this.rng.int(1, 3)) });
    return { ok: true };
  }

  deliverScout(playerId) {
    const p = this.player(playerId);
    if (!p) return;
    const c = this.club(p.clubId);
    const stars = (v) => '★'.repeat(clamp(Math.round(v / 40), 1, 5)) + '☆'.repeat(5 - clamp(Math.round(v / 40), 1, 5));
    const userAvg = this.squad(this.s.userClubId).sort((a, b) => b.ca - a.ca).slice(0, 11).reduce((s, x) => s + x.ca, 0) / 11;
    const verdict = p.ca > userAvg + 8 ? 'would walk into our first team' : p.ca > userAvg - 5 ? 'would be a solid squad addition' : p.pa > userAvg + 10 ? 'is one for the future' : 'is not good enough for us at present';
    this.msg(`Scout report: ${p.name}`, `${p.name} (${p.age}, ${c.name})\nCurrent ability: ${stars(p.ca)}   Potential: ${stars(p.pa)}\nValue: ${fmtMoney(p.value)} — the club would want about ${fmtMoney(this.askingPrice(p))}.\nWage: ${fmtMoney(p.wage)}/wk, contract until ${p.contractEnd.slice(0, 4)}.\n\nVerdict: he ${verdict}.`, { from: 'Chief Scout', type: 'scout', data: { playerId }, actions: [{ label: 'View player', action: 'viewPlayer', data: { playerId } }] });
  }

  toggleTransferList(playerId) { const p = this.player(playerId); p.transferListed = !p.transferListed; return p.transferListed; }

  // ---------- season ----------
  checkSeasonEnd() {
    const s = this.s;
    if (s.seasonComplete) return;
    if (s.fixtures.every((f) => f.played)) {
      s.seasonComplete = true;
      const lg = this.league(this.user.league);
      const lines = [];
      for (const L of LEAGUES) {
        const t = this.table(L.id);
        const champ = this.club(t[0].club);
        t.forEach((row, i) => { const c = this.club(row.club); this.ledger(c, Math.round(L.prizeTop * Math.pow(0.86, i)), 'prize', `${L.name} prize money (${ordinal(i + 1)})`); });
        lines.push(`${L.name}: ${champ.name}`);
      }
      const pos = this.position(s.userClubId);
      const exp = s.board.expectation;
      const met = pos <= exp.target;
      s.board.confidence = clamp(s.board.confidence + (met ? 20 : -25), 0, 100);
      s.history.push({ season: s.season, club: this.user.name, league: lg.name, position: pos });
      this.msg('Season review', `The ${s.season} season is over. We finished ${ordinal(pos)} in the ${lg.name}.\n\nThe board ${met ? 'are delighted — you met their expectation to' : 'are disappointed — you failed to'} ${exp.text}.\n\nChampions:\n${lines.join('\n')}`, { from: 'Chairman', type: 'board' });
      if (s.board.confidence < 10) { s.sacked = true; this.msg('You have been sacked', 'Following a disappointing season the board have decided to relieve you of your duties.', { from: 'Chairman', type: 'board' }); }
    }
  }

  newSeason() {
    const s = this.s, r = this.rng;
    s.seasonYear += 1;
    s.season = `${s.seasonYear}/${String((s.seasonYear + 1) % 100).padStart(2, '0')}`;
    s.seasonComplete = false;
    const yearOff = s.seasonYear - 2026;
    // Aging, contracts, retirements
    for (const p of Object.values(s.players)) {
      p.age++;
      p.stats = { apps: 0, goals: 0, assists: 0, ratingSum: 0, rated: 0, yellows: 0, reds: 0, cleanSheets: 0 };
      p.yellowAccum = 0;
    }
    for (const c of Object.values(s.clubs)) {
      c.finances.seasonIncome = {}; c.finances.seasonExpense = {};
      const lg = this.league(c.league);
      for (const p of this.squad(c.id)) {
        const expired = p.contractEnd <= s.date;
        const retire = p.age >= 35 && r.chance(0.35 + (p.age - 35) * 0.2);
        if (retire || (expired && c.id !== s.userClubId && r.chance(0.25))) {
          c.playerIds = c.playerIds.filter((id) => id !== p.id);
          delete s.players[p.id];
          continue;
        }
        if (expired) {
          if (c.id === s.userClubId) {
            c.playerIds = c.playerIds.filter((id) => id !== p.id);
            delete s.players[p.id];
            this.msg(`${p.name} leaves on a free`, `${p.name}'s contract has expired and he has left the club.`, { from: 'Director of Football' });
          } else { p.contractEnd = `${s.seasonYear + r.int(1, 3)}-06-30`; p.wage = Math.round(p.wage * 1.08); }
        }
      }
      // Youth intake to maintain squad size
      while (c.playerIds.length < 24) {
        const nat = r.weighted(LEAGUE_NAT_MIX[c.league], (m) => m[1])[0];
        const pool = NAME_POOLS[nat] || NAME_POOLS.ENG;
        const pos = r.pick(['GK', 'DC', 'DR', 'DL', 'MC', 'DMC', 'AMR', 'AML', 'FC', 'FC']);
        const ca = clamp(Math.round(clubTargetCA(c.rep) - 32 + r.normal(0, 8)), 25, 160);
        const p = createPlayer(r, { name: `${r.pick(pool.first)} ${r.pick(pool.last)}`, nat, age: r.int(16, 18), positions: [pos], ca, pa: clamp(ca + 20 + Math.abs(r.normal(20, 14)), ca, 200), clubId: c.id, leagueId: c.league });
        p.squadStatus = 'Youngster';
        s.players[p.id] = p; c.playerIds.push(p.id);
        if (c.id === s.userClubId) this.msg(`Youth intake: ${p.name}`, `${p.name} (${p.age}, ${pos}) has been promoted from the academy.`, { from: 'Youth Coach', data: { playerId: p.id }, actions: [{ label: 'View player', action: 'viewPlayer', data: { playerId: p.id } }] });
      }
      const budget = Math.round(1_000_000 * Math.exp((c.rep - 40) / 11) * (c.league === 'svn1' ? 0.6 : 1));
      c.finances.transferBudget = Math.max(c.finances.transferBudget, budget);
      c.finances.wageBudget = Math.round(this.squad(c.id).reduce((a, p) => a + p.wage, 0) * 1.12);
    }
    s.nextId = this.peekNextId();
    // Fixtures for the new season (same divisions)
    const fixtures = [];
    let id = 1;
    for (const lg of LEAGUES) {
      const shifted = { ...lg, start: shiftYear(lg.start, yearOff), end: shiftYear(lg.end, yearOff), breaks: lg.breaks.map(([a, b]) => [shiftYear(a, yearOff), shiftYear(b, yearOff)]) };
      const fx = generateLeagueFixtures(shifted, CLUBS[lg.id].map((c) => c.id), r, id); id += fx.length; fixtures.push(...fx);
    }
    fixtures.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    s.fixtures = fixtures;
    s.offers = s.offers.filter((o) => o.status === 'pending' && o.kind === 'buy');
    this._tableCache = {};
    this.welcome();
  }

  peekNextId() { return getNextId(); }

  handleAction(action, data) {
    switch (action) {
      case 'acceptCounter': return this.acceptCounter(data.offerId);
      case 'acceptBid': return this.acceptBid(data.offerId);
      case 'counterBid': return this.counterBid(data.offerId);
      case 'rejectBid': return this.rejectBid(data.offerId);
      default: return { ui: action, data };
    }
  }

  serialize() { this.s.nextId = this.peekNextId(); return this.s; }
}

export function shiftYear(iso, n) { return n ? `${Number(iso.slice(0, 4)) + n}${iso.slice(4)}` : iso; }
export function ordinal(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
export { SQUAD_STATUS, TECHNICAL, MENTAL, PHYSICAL, GOALKEEPING };
