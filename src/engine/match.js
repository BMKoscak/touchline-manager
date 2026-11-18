// Minute-by-minute match engine. One engine drives both the live (user) match and AI quick-sims.
import { clamp } from '../core/rng.js';
import { familiarity } from './attributes.js';
import { shapeAnalysis } from './tactics.js';
import { describeEvent } from './commentary.js';

const avg = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 10);
const isDef = (pos) => ['DR', 'DC', 'DL'].includes(pos);
const isMid = (pos) => ['DMC', 'MC', 'MR', 'ML', 'AMC'].includes(pos);
const isAtt = (pos) => ['FC', 'AMR', 'AML', 'AMC'].includes(pos);

export const LEVEL = { KEY: 1, EXTENDED: 2, FULL: 3 };

export class MatchSimulator {
  /**
   * @param {object} o { players, homeClub, awayClub, homeTactic, awayTactic, rng, withText, userSide, leagueStrength, fixture }
   */
  constructor(o) {
    this.players = o.players;
    this.rng = o.rng;
    this.withText = o.withText !== false;
    this.userSide = o.userSide || null; // 'home' | 'away' | null
    this.fixture = o.fixture || null;
    this.minute = 0;
    this.half = 1;
    this.stoppage = [this.rng.int(1, 3), this.rng.int(2, 6)];
    this.finished = false;
    this.events = [];
    this.score = [0, 0];
    this.momentum = 0; // -1 (away) .. +1 (home)
    this.teams = {
      home: this._team(o.homeClub, o.homeTactic, 'home'),
      away: this._team(o.awayClub, o.awayTactic, 'away'),
    };
    this.refresh('home'); this.refresh('away');
    this.scorers = [];
    this.injuries = [];
    this.cards = [];
  }

  _team(club, tactic, side) {
    const onPitch = tactic.slots.map((slot, i) => ({ slotIdx: i, pid: tactic.lineup[i] })).filter((x) => x.pid);
    const cond = {};
    for (const x of onPitch) cond[x.pid] = this.players[x.pid].condition;
    for (const pid of tactic.subs) cond[pid] = this.players[pid]?.condition ?? 100;
    const ratings = {};
    for (const x of onPitch) ratings[x.pid] = 6.2;
    return {
      side, club, tactic, onPitch, bench: tactic.subs.slice(), subsUsed: 0, subWindows: 0, lastSubMinute: -10, sentOff: [],
      cond, ratings, appeared: new Set(onPitch.map((x) => x.pid)), yellows: {},
      stats: { poss: 0, shots: 0, onTarget: 0, corners: 0, fouls: 0, yellows: 0, reds: 0, offsides: 0, xg: 0, saves: 0 },
      goalsFor: [], profile: null,
    };
  }

  other(side) { return side === 'home' ? 'away' : 'home'; }
  p(pid) { return this.players[pid]; }

  // Recompute team strength profile (after subs, cards, tactic changes, fatigue).
  refresh(side) {
    const t = this.teams[side];
    const ins = t.tactic.instructions;
    const shape = shapeAnalysis(t.tactic);
    const eff = (x, attrs) => {
      const pl = this.p(x.pid);
      const slot = t.tactic.slots[x.slotIdx];
      const fam = familiarity(pl, slot.pos);
      const c = t.cond[x.pid] ?? 100;
      const morale = 0.94 + (pl.morale || 7) * 0.01;
      return avg(attrs.map((a) => pl.attrs[a] ?? 10)) * fam * (0.72 + 0.28 * c / 100) * morale;
    };
    const slotPos = (x) => t.tactic.slots[x.slotIdx].pos;
    const gkX = t.onPitch.find((x) => slotPos(x) === 'GK');
    const gk = gkX ? eff(gkX, ['handling', 'reflexes', 'oneOnOnes', 'aerialAbility', 'commandOfArea', 'anticipation']) : 4;
    const defs = t.onPitch.filter((x) => isDef(slotPos(x)) || slotPos(x) === 'DMC');
    const mids = t.onPitch.filter((x) => isMid(slotPos(x)) || ['MR', 'ML'].includes(slotPos(x)));
    const atts = t.onPitch.filter((x) => isAtt(slotPos(x)));
    let defense = avg(defs.map((x) => eff(x, ['tackling', 'marking', 'anticipation', 'heading', 'strength', 'pace', 'decisions', 'bravery'])));
    let control = avg(mids.map((x) => eff(x, ['passing', 'technique', 'decisions', 'teamwork', 'workRate', 'creativity', 'stamina', 'anticipation'])));
    let attack = avg(atts.map((x) => eff(x, ['finishing', 'offTheBall', 'dribbling', 'pace', 'technique', 'decisions', 'flair', 'acceleration'])));
    const aerial = avg(t.onPitch.map((x) => eff(x, ['heading', 'jumping', 'strength'])));
    // Numbers on the pitch
    const missing = 11 - t.onPitch.length;
    const numF = Math.pow(0.88, missing);
    // Tactical modifiers
    const m = ins.mentality; // 0..4
    const attM = [0.84, 0.92, 1, 1.08, 1.17][m];
    const defM = [1.14, 1.07, 1, 0.94, 0.86][m];
    let ctrlM = ins.passing === 'short' ? 1.05 : ins.passing === 'direct' ? 0.95 : 1;
    const shapeAtt = 1 + 0.035 * (shape.attackersWithBall - 4) + 0.02 * (shape.width - 3) + 0.01 * shape.runs;
    const shapeDef = 1 + 0.03 * (shape.defendersWithoutBall - 5) - (shape.flankCoverL ? 0 : 0.04) - (shape.flankCoverR ? 0 : 0.04);
    const mbb = ins.menBehindBall ? [0.92, 1.08] : [1, 1];
    const press = ins.pressing ? 1.04 : 1;
    t.profile = {
      gk, aerial,
      attack: attack * attM * shapeAtt * mbb[0] * numF,
      defense: defense * defM * shapeDef * mbb[1] * numF * (ins.offsideTrap ? 1.03 : 1),
      control: control * ctrlM * press * numF,
      shape, ins,
      directness: ins.passing === 'direct' ? 1.25 : ins.passing === 'short' ? 0.85 : 1,
      chanceQuality: ins.passing === 'short' ? 1.1 : ins.passing === 'direct' ? 0.9 : 1,
      foulRate: (ins.tackling === 'hard' ? 1.45 : ins.tackling === 'easy' ? 0.7 : 1) * (ins.pressing ? 1.15 : 1),
      winBall: (ins.tackling === 'hard' ? 1.06 : ins.tackling === 'easy' ? 0.95 : 1) * (ins.pressing ? 1.06 : 1),
    };
  }

  displayMinute() {
    if (this.half === 1 && this.minute > 45) return `45+${this.minute - 45}`;
    if (this.half === 2 && this.minute > 90) return `90+${this.minute - 90}`;
    return String(this.minute);
  }

  // Weighted pick of a player on the pitch by role weights and attribute.
  pickPlayer(side, weightFn) {
    const t = this.teams[side];
    const xs = t.onPitch.map((x) => ({ x, pl: this.p(x.pid), pos: t.tactic.slots[x.slotIdx].pos }));
    return this.rng.weighted(xs, ({ pl, pos }) => weightFn(pl, pos)).x.pid;
  }
  shooter(side, kind) {
    return this.pickPlayer(side, (pl, pos) => {
      const roleW = pos === 'FC' ? 3.4 : pos.startsWith('AM') ? 2.1 : ['MC', 'MR', 'ML'].includes(pos) ? 1.0 : pos === 'DMC' ? 0.5 : pos === 'GK' ? 0 : 0.35;
      const a = kind === 'header' ? pl.attrs.heading + pl.attrs.jumping : kind === 'long' ? pl.attrs.longShots * 2 : pl.attrs.finishing + pl.attrs.offTheBall;
      return roleW * Math.pow(a, 1.6);
    });
  }
  creator(side, kind, exclude) {
    return this.pickPlayer(side, (pl, pos) => {
      if (pl.id === exclude || pos === 'GK') return 0;
      const a = kind === 'cross' ? pl.attrs.crossing * (['MR', 'ML', 'AMR', 'AML', 'DR', 'DL'].includes(pos) ? 2 : 0.4)
        : kind === 'through' ? pl.attrs.passing + pl.attrs.creativity : pl.attrs.passing + pl.attrs.technique;
      return Math.pow(a, 1.5);
    });
  }
  defender(side) {
    return this.pickPlayer(side, (pl, pos) => (isDef(pos) ? 3 : pos === 'DMC' ? 2.5 : isMid(pos) ? 1 : pos === 'GK' ? 0 : 0.4) * (pl.attrs.tackling + pl.attrs.marking));
  }
  gkOf(side) {
    const t = this.teams[side];
    return t.onPitch.find((x) => t.tactic.slots[x.slotIdx].pos === 'GK')?.pid || t.onPitch[0]?.pid;
  }
  rate(side, pid, delta) { const r = this.teams[side].ratings; if (pid in r) r[pid] = clamp(r[pid] + delta, 1, 10); }

  emit(ev) {
    ev.minute = this.minute; ev.display = this.displayMinute(); ev.score = this.score.slice(); ev.half = this.half;
    const frame = ev.frame || ev.team;
    if (frame) {
      const flip = frame === 'away';
      if (ev.ball) ev.ball = { x: flip ? 1 - ev.ball.x : ev.ball.x, y: flip ? 1 - ev.ball.y : ev.ball.y };
    }
    if (this.withText) Object.assign(ev, describeEvent(ev, this));
    this.events.push(ev);
    return ev;
  }

  ballFor(zone) {
    const r = this.rng;
    const x = zone === 'def' ? r.range(0.1, 0.35) : zone === 'mid' ? r.range(0.35, 0.65) : zone === 'final' ? r.range(0.68, 0.84) : zone === 'box' ? r.range(0.86, 0.96) : 1;
    return { x, y: zone === 'box' ? r.range(0.32, 0.68) : r.range(0.1, 0.9) };
  }

  // Advance one minute; returns events produced.
  step() {
    if (this.finished) return [];
    const out = [];
    const start = this.events.length;
    if (this.minute === 0 && this.half === 1) {
      this.emit({ type: 'kickoff', team: 'home', level: LEVEL.KEY, excitement: 4, ball: { x: 0.5, y: 0.5 } });
    }
    this.minute++;
    const H = this.teams.home.profile, A = this.teams.away.profile;
    // Possession share
    let shareH = Math.pow(H.control, 1.3) / (Math.pow(H.control, 1.3) + Math.pow(A.control, 1.3));
    shareH = clamp(shareH + 0.03 + (H.ins.passing === 'short' ? 0.03 : 0) - (A.ins.passing === 'short' ? 0.03 : 0), 0.3, 0.7);
    const side = this.rng.chance(shareH) ? 'home' : 'away';
    const opp = this.other(side);
    this.teams[side].stats.poss++;
    this.phase(side, opp);
    // Fatigue
    for (const s of ['home', 'away']) {
      const t = this.teams[s];
      const mult = (t.profile.ins.pressing ? 1.25 : 1) * (1 + 0.05 * (t.profile.ins.mentality - 2));
      for (const x of t.onPitch) {
        const pl = this.p(x.pid);
        t.cond[x.pid] = clamp(t.cond[x.pid] - (0.1 + (20 - pl.attrs.stamina) * 0.009) * mult, 20, 100);
      }
    }
    if (this.minute % 5 === 0) { this.refresh('home'); this.refresh('away'); }
    // Injuries
    if (this.rng.chance(0.0045)) this.injury(this.rng.chance(0.5) ? 'home' : 'away');
    // AI substitutions
    if (this.half === 2 && this.minute >= 58) for (const s of ['home', 'away']) if (s !== this.userSide || this.autoSubsUser) this.aiSubs(s);
    // Momentum
    this.momentum = this.momentum * 0.9 + (side === 'home' ? 0.1 : -0.1);
    // Half / full time
    if (this.half === 1 && this.minute >= 45 + this.stoppage[0]) {
      this.half = 2;
      this.emit({ type: 'halftime', level: LEVEL.KEY, excitement: 3, ball: { x: 0.5, y: 0.5 } });
      this.minute = 45;
      for (const s of ['home', 'away']) { const t = this.teams[s]; for (const x of t.onPitch) t.cond[x.pid] = clamp(t.cond[x.pid] + 6, 0, 100); this.refresh(s); }
      this.emit({ type: 'kickoff2', team: 'away', level: LEVEL.EXTENDED, excitement: 3, ball: { x: 0.5, y: 0.5 } });
    } else if (this.half === 2 && this.minute >= 90 + this.stoppage[1]) {
      this.finish();
    }
    for (let i = start; i < this.events.length; i++) out.push(this.events[i]);
    return out;
  }

  phase(side, opp) {
    const r = this.rng, T = this.teams[side], D = this.teams[opp];
    const at = T.profile, df = D.profile;
    // Fouls happen regardless of zone
    const foulP = 0.22 * df.foulRate * (1 + (avg(D.onPitch.map((x) => this.p(x.pid).attrs.aggression)) - 10) * 0.03);
    if (r.chance(foulP * 0.95)) { this.foul(opp, side, r.chance(0.28) ? 'final' : 'mid'); return; }

    const attackP = 0.8 * (at.ins.counter ? 0.96 : 1);
    if (!r.chance(attackP)) {
      const ballHolder = this.creator(side, 'pass');
      this.emit({ type: 'buildup', team: side, player: ballHolder, level: LEVEL.FULL, excitement: 2, ball: this.ballFor(r.chance(0.5) ? 'def' : 'mid') });
      return;
    }
    const adv = (at.attack * 0.6 + at.control * 0.4) / (df.defense * df.winBall);
    let pProg = clamp(0.56 * Math.pow(adv, 1.05) * at.directness ** 0.3, 0.16, 0.8);
    if (!r.chance(pProg)) {
      // Turnover in midfield or final third
      if (df.ins.offsideTrap && r.chance(0.16) || r.chance(0.05)) {
        const pl = this.shooter(side, 'normal');
        if (df.ins.offsideTrap && r.chance(0.09 * (avg(T.onPitch.map((x) => this.p(x.pid).attrs.pace)) / 12))) {
          // Trap beaten — through on goal
          this.emit({ type: 'trap_beaten', team: side, player: pl, level: LEVEL.EXTENDED, excitement: 8, ball: this.ballFor('box') });
          this.shot(side, opp, pl, 'through', this.creator(side, 'through', pl));
          return;
        }
        T.stats.offsides++;
        this.emit({ type: 'offside', team: side, player: pl, level: LEVEL.EXTENDED, excitement: 3, ball: this.ballFor('final') });
        return;
      }
      const tackler = this.defender(opp);
      this.rate(opp, tackler, 0.03);
      this.emit({ type: 'tackle', team: opp, frame: side, player: tackler, level: LEVEL.FULL, excitement: 3, ball: this.ballFor('mid') });
      if (df.ins.counter && r.chance(0.13)) this.counter(opp, side);
      return;
    }
    // In the final third
    const kinds = [
      ['cross', (at.shape.width + 1) * avg(T.onPitch.map((x) => this.p(x.pid).attrs.crossing)) * (at.ins.passing === 'direct' ? 1.2 : 1)],
      ['through', avg(T.onPitch.map((x) => this.p(x.pid).attrs.passing + this.p(x.pid).attrs.creativity)) * 0.55 * (1 + at.shape.runs * 0.05)],
      ['dribble', avg(T.onPitch.map((x) => this.p(x.pid).attrs.dribbling + this.p(x.pid).attrs.flair)) * 0.45],
      ['long', avg(T.onPitch.map((x) => this.p(x.pid).attrs.longShots)) * 0.6],
    ];
    const kind = r.weighted(kinds, (k) => k[1])[0];
    const creator = this.creator(side, kind === 'cross' ? 'cross' : kind === 'through' ? 'through' : 'pass');
    this.emit({ type: 'attack', team: side, player: creator, kind, level: LEVEL.FULL, excitement: 4, ball: this.ballFor('final') });
    const pShot = clamp(0.64 * Math.pow(adv, 0.45), 0.34, 0.86);
    if (!r.chance(pShot)) {
      const def = this.defender(opp);
      this.rate(opp, def, 0.05);
      const corner = r.chance(kind === 'cross' ? 0.42 : 0.24);
      this.emit({ type: 'clearance', team: opp, frame: side, player: def, level: LEVEL.FULL, excitement: 4, ball: this.ballFor('box') });
      if (corner) this.corner(side, opp);
      return;
    }
    const shooter = kind === 'long' ? this.shooter(side, 'long') : kind === 'cross' ? this.shooter(side, 'header') : this.shooter(side, 'normal');
    this.shot(side, opp, shooter, kind === 'cross' ? 'header' : kind, shooter === creator ? null : creator);
  }

  counter(side, opp) {
    const runner = this.shooter(side, 'normal');
    this.emit({ type: 'counter', team: side, player: runner, level: LEVEL.EXTENDED, excitement: 6, ball: this.ballFor('final') });
    if (this.rng.chance(0.55)) this.shot(side, opp, runner, 'counter', this.creator(side, 'through', runner));
  }

  corner(side, opp) {
    const T = this.teams[side];
    T.stats.corners++;
    const taker = T.tactic.cornerTaker && T.onPitch.some((x) => x.pid === T.tactic.cornerTaker) ? T.tactic.cornerTaker : this.creator(side, 'cross');
    this.emit({ type: 'corner', team: side, player: taker, level: LEVEL.EXTENDED, excitement: 5, ball: { x: 0.99, y: this.rng.chance(0.5) ? 0.02 : 0.98 } });
    const aerialEdge = this.teams[side].profile.aerial / this.teams[opp].profile.aerial;
    if (this.rng.chance(0.3 * aerialEdge)) this.shot(side, opp, this.shooter(side, 'header'), 'header', taker);
  }

  foul(byTeam, onTeam, zone) {
    const r = this.rng, D = this.teams[byTeam];
    const offender = this.pickPlayer(byTeam, (pl, pos) => (pos === 'GK' ? 0.05 : 1) * (pl.attrs.aggression + (20 - pl.attrs.tackling) * 0.5));
    const victim = this.pickPlayer(onTeam, (pl, pos) => (pos === 'GK' ? 0.02 : 1) * (pl.attrs.dribbling + pl.attrs.flair));
    D.stats.fouls++;
    this.rate(byTeam, offender, -0.05);
    const inBox = zone === 'final' && r.chance(0.055);
    this.emit({ type: inBox ? 'foul_box' : 'foul', team: byTeam, frame: onTeam, player: offender, player2: victim, level: inBox ? LEVEL.KEY : LEVEL.EXTENDED, excitement: inBox ? 8 : 3, ball: this.ballFor(zone === 'final' ? (inBox ? 'box' : 'final') : 'mid') });
    // Cards
    const hard = D.profile.ins.tackling === 'hard';
    const pYellow = (inBox ? 0.3 : 0.13) * (hard ? 1.35 : D.profile.ins.tackling === 'easy' ? 0.6 : 1) * (0.7 + this.p(offender).attrs.aggression / 30);
    if (r.chance(0.0045 * (hard ? 1.6 : 1))) this.card(byTeam, offender, 'red');
    else if (r.chance(pYellow)) this.card(byTeam, offender, 'yellow');
    if (inBox) { this.penalty(onTeam, byTeam); return; }
    if (zone === 'final' && r.chance(0.55)) {
      const T = this.teams[onTeam];
      const taker = T.tactic.freeKickTaker && T.onPitch.some((x) => x.pid === T.tactic.freeKickTaker) ? T.tactic.freeKickTaker : this.creator(onTeam, 'pass');
      if (r.chance(0.42)) {
        this.emit({ type: 'freekick', team: onTeam, player: taker, direct: true, level: LEVEL.EXTENDED, excitement: 6, ball: this.ballFor('final') });
        this.shot(onTeam, byTeam, taker, 'freekick', null);
      } else {
        this.emit({ type: 'freekick', team: onTeam, player: taker, direct: false, level: LEVEL.EXTENDED, excitement: 5, ball: this.ballFor('final') });
        if (r.chance(0.28)) this.shot(onTeam, byTeam, this.shooter(onTeam, 'header'), 'header', taker);
      }
    }
  }

  card(side, pid, color) {
    const T = this.teams[side];
    if (!T.onPitch.some((x) => x.pid === pid)) return;
    if (color === 'yellow') {
      T.yellows[pid] = (T.yellows[pid] || 0) + 1;
      T.stats.yellows++;
      this.rate(side, pid, -0.3);
      this.cards.push({ side, pid, color: 'yellow', minute: this.minute });
      if (T.yellows[pid] >= 2) {
        this.emit({ type: 'second_yellow', team: side, player: pid, level: LEVEL.KEY, excitement: 8, ball: null });
        this.sendOff(side, pid);
        return;
      }
      this.emit({ type: 'yellow', team: side, player: pid, level: LEVEL.KEY, excitement: 5, ball: null });
    } else {
      this.emit({ type: 'red', team: side, player: pid, level: LEVEL.KEY, excitement: 9, ball: null });
      this.sendOff(side, pid);
    }
  }
  sendOff(side, pid) {
    const T = this.teams[side];
    T.stats.reds++;
    this.rate(side, pid, -1.2);
    this.cards.push({ side, pid, color: 'red', minute: this.minute });
    T.onPitch = T.onPitch.filter((x) => x.pid !== pid);
    T.sentOff.push(pid);
    // If GK sent off, move an outfielder into goal (AI) — keeps engine robust.
    if (!T.onPitch.some((x) => T.tactic.slots[x.slotIdx].pos === 'GK')) {
      const gkSlot = T.tactic.slots.findIndex((s) => s.pos === 'GK');
      const benchGk = T.bench.find((id) => this.p(id).positions.includes('GK'));
      if (benchGk && T.subsUsed < 5) {
        const out = T.onPitch.filter((x) => T.tactic.slots[x.slotIdx].pos === 'FC').pop() || T.onPitch[T.onPitch.length - 1];
        if (out) { T.onPitch = T.onPitch.filter((x) => x !== out); this._doSub(side, out.pid, benchGk, gkSlot, 'tactical'); }
      } else if (T.onPitch.length) {
        T.onPitch[T.onPitch.length - 1].slotIdx = gkSlot;
      }
    }
    this.refresh(side);
  }

  penalty(side, opp) {
    const T = this.teams[side];
    const taker = T.tactic.penaltyTaker && T.onPitch.some((x) => x.pid === T.tactic.penaltyTaker) ? T.tactic.penaltyTaker
      : this.pickPlayer(side, (pl) => Math.pow(pl.attrs.penalties, 2));
    this.emit({ type: 'penalty_award', team: side, player: taker, level: LEVEL.KEY, excitement: 9, ball: { x: 0.885, y: 0.5 } });
    const gk = this.gkOf(opp);
    const pl = this.p(taker), g = this.p(gk);
    const pScore = clamp(0.76 + (pl.attrs.penalties - 12) * 0.015 - ((g?.attrs.reflexes ?? 10) - 12) * 0.008 + (pl.attrs.decisions - 10) * 0.004, 0.55, 0.92);
    T.stats.shots++; T.stats.xg += 0.76;
    if (this.rng.chance(pScore)) { T.stats.onTarget++; this.goal(side, opp, taker, null, 'penalty'); }
    else if (this.rng.chance(0.65)) {
      T.stats.onTarget++; this.teams[opp].stats.saves++;
      this.rate(opp, gk, 0.8); this.rate(side, taker, -0.6);
      this.emit({ type: 'penalty_save', team: opp, frame: side, player: gk, player2: taker, level: LEVEL.KEY, excitement: 10, ball: { x: 0.99, y: 0.5 } });
    } else {
      this.rate(side, taker, -0.7);
      this.emit({ type: 'penalty_miss', team: side, player: taker, level: LEVEL.KEY, excitement: 9, ball: { x: 1, y: 0.4 } });
    }
  }

  shot(side, opp, shooter, kind, assister) {
    const r = this.rng, T = this.teams[side], O = this.teams[opp];
    const pl = this.p(shooter);
    const gk = this.gkOf(opp), g = this.p(gk);
    const baseQ = { header: 0.078, through: 0.22, counter: 0.19, dribble: 0.125, long: 0.03, freekick: 0.055, normal: 0.1 }[kind] ?? 0.1;
    const skill = kind === 'header' ? (pl.attrs.heading * 0.7 + pl.attrs.jumping * 0.3) : kind === 'long' ? pl.attrs.longShots : kind === 'freekick' ? pl.attrs.setPieces : (pl.attrs.finishing * 0.75 + pl.attrs.decisions * 0.15 + pl.attrs.technique * 0.1);
    const keeper = g ? (g.attrs.reflexes * 0.4 + g.attrs.handling * 0.25 + g.attrs.oneOnOnes * 0.2 + g.attrs.aerialAbility * 0.15) : 5;
    const cond = (T.cond[shooter] ?? 100) / 100;
    let q = baseQ * T.profile.chanceQuality * Math.pow(skill / 12, 1.0) / Math.pow(keeper / 12, 0.85) * (0.8 + 0.2 * cond);
    q = clamp(q, 0.01, 0.6);
    T.stats.shots++; T.stats.xg += q;
    const big = q > 0.2;
    const shotEv = { type: 'shot', team: side, player: shooter, player2: assister, kind, big, level: big ? LEVEL.KEY : LEVEL.EXTENDED, excitement: big ? 8 : 6, ball: this.ballFor(kind === 'long' || kind === 'freekick' ? 'final' : 'box') };
    this.emit(shotEv);
    if (r.chance(q)) { T.stats.onTarget++; this.goal(side, opp, shooter, assister, kind); return; }
    const pOnTarget = clamp(0.3 + (skill - 10) * 0.018, 0.18, 0.55);
    if (r.chance(0.035)) { this.emit({ type: 'woodwork', team: side, player: shooter, level: LEVEL.KEY, excitement: 9, ball: { x: 1, y: r.chance(.5) ? .44 : .56 } }); this.rate(side, shooter, 0.1); return; }
    if (r.chance(pOnTarget)) {
      T.stats.onTarget++; O.stats.saves++;
      this.rate(opp, gk, big ? 0.45 : 0.2); this.rate(side, shooter, 0.05);
      this.emit({ type: 'save', team: opp, frame: side, player: gk, player2: shooter, big, level: big ? LEVEL.KEY : LEVEL.EXTENDED, excitement: big ? 8 : 6, ball: { x: 0.98, y: r.range(0.4, 0.6) } });
      if (r.chance(0.32)) this.corner(side, opp);
      return;
    }
    if (r.chance(0.3)) {
      const blocker = this.defender(opp);
      this.rate(opp, blocker, 0.08);
      this.emit({ type: 'block', team: opp, frame: side, player: blocker, player2: shooter, level: LEVEL.EXTENDED, excitement: 5, ball: this.ballFor('box') });
      if (r.chance(0.4)) this.corner(side, opp);
      return;
    }
    this.rate(side, shooter, big ? -0.25 : -0.05);
    this.emit({ type: 'miss', team: side, player: shooter, big, level: big ? LEVEL.KEY : LEVEL.EXTENDED, excitement: big ? 8 : 5, ball: { x: 1, y: r.chance(.5) ? r.range(.25, .4) : r.range(.6, .75) } });
  }

  goal(side, opp, scorer, assister, kind) {
    const idx = side === 'home' ? 0 : 1;
    this.score[idx]++;
    this.teams[side].goalsFor.push({ pid: scorer, assist: assister, minute: this.displayMinute(), kind });
    this.scorers.push({ side, pid: scorer, assist: assister, minute: this.displayMinute(), kind });
    this.rate(side, scorer, 1.0);
    if (assister) this.rate(side, assister, 0.55);
    const gk = this.gkOf(opp);
    this.rate(opp, gk, -0.35);
    this.teams[opp].onPitch.forEach((x) => { if (isDef(this.teams[opp].tactic.slots[x.slotIdx].pos)) this.rate(opp, x.pid, -0.12); });
    this.momentum = side === 'home' ? 1 : -1;
    this.emit({ type: 'goal', team: side, player: scorer, player2: assister, kind, level: LEVEL.KEY, excitement: 10, ball: { x: 1, y: 0.5 } });
  }

  injury(side) {
    const T = this.teams[side];
    if (!T.onPitch.length) return;
    const pid = this.pickPlayer(side, (pl) => pl.attrs.injuryProneness);
    const days = this.rng.chance(0.6) ? this.rng.int(3, 14) : this.rng.chance(0.75) ? this.rng.int(15, 45) : this.rng.int(46, 140);
    const type = this.rng.pick(days < 10 ? ['Bruised Ankle', 'Dead Leg', 'Twisted Knee', 'Tight Hamstring'] : days < 40 ? ['Hamstring Strain', 'Calf Strain', 'Groin Strain', 'Sprained Ankle'] : ['Torn Hamstring', 'Knee Ligament Damage', 'Broken Metatarsal', 'Torn Thigh Muscle']);
    this.injuries.push({ side, pid, days, type });
    this.emit({ type: 'injury', team: side, player: pid, injury: type, days, level: LEVEL.KEY, excitement: 4, ball: null });
    // Replace if possible
    const x = T.onPitch.find((o) => o.pid === pid);
    const pos = T.tactic.slots[x.slotIdx].pos;
    const best = this.bestBench(side, pos);
    if (best && T.subsUsed < 5) this.substitute(side, pid, best, 'injury');
    else { T.cond[pid] = Math.min(T.cond[pid], 35); this.refresh(side); }
  }

  bestBench(side, pos) {
    const T = this.teams[side];
    const cands = T.bench.filter((id) => !T.appeared.has(id));
    if (!cands.length) return null;
    return cands.map((id) => this.p(id)).sort((a, b) => familiarity(b, pos) * b.ca - familiarity(a, pos) * a.ca)[0].id;
  }

  substitute(side, outPid, inPid, reason = 'tactical') {
    const T = this.teams[side];
    const x = T.onPitch.find((o) => o.pid === outPid);
    if (!x || T.subsUsed >= 5 || T.appeared.has(inPid) || !T.bench.includes(inPid)) return false;
    T.onPitch = T.onPitch.filter((o) => o !== x);
    this._doSub(side, outPid, inPid, x.slotIdx, reason);
    return true;
  }
  _doSub(side, outPid, inPid, slotIdx, reason) {
    const T = this.teams[side];
    T.onPitch.push({ slotIdx, pid: inPid });
    T.appeared.add(inPid);
    T.bench = T.bench.filter((id) => id !== inPid);
    T.subsUsed++;
    if (this.minute - T.lastSubMinute > 1) T.subWindows++;
    T.lastSubMinute = this.minute;
    T.ratings[inPid] = 6.2;
    T.cond[inPid] = T.cond[inPid] ?? this.p(inPid).condition;
    T.tactic.lineup[slotIdx] = inPid;
    this.emit({ type: 'sub', team: side, player: inPid, player2: outPid, reason, level: LEVEL.KEY, excitement: 3, ball: null });
    this.refresh(side);
  }

  aiSubs(side) {
    const T = this.teams[side];
    if (T.subsUsed >= 5 || T.subWindows >= 3 && this.minute - T.lastSubMinute > 1) return;
    if (!this.rng.chance(0.09)) return;
    const diff = side === 'home' ? this.score[0] - this.score[1] : this.score[1] - this.score[0];
    const cands = T.onPitch.filter((x) => T.tactic.slots[x.slotIdx].pos !== 'GK')
      .map((x) => ({ x, need: (100 - T.cond[x.pid]) / 10 + (6.6 - T.ratings[x.pid]) * 2 + (diff < 0 && isDef(T.tactic.slots[x.slotIdx].pos) ? 1 : 0) }))
      .sort((a, b) => b.need - a.need);
    const tgt = cands[0];
    if (!tgt || tgt.need < 2.2) return;
    const pos = T.tactic.slots[tgt.x.slotIdx].pos;
    const wantPos = diff < 0 && this.minute > 70 && isDef(pos) ? 'FC' : pos;
    const inn = this.bestBench(side, wantPos);
    if (inn) this.substitute(side, tgt.x.pid, inn, 'tactical');
  }

  // Called by UI when the user changes tactics mid-match.
  tacticChanged(side) {
    this.refresh(side);
    this.emit({ type: 'tactic', team: side, level: LEVEL.KEY, excitement: 3, ball: null });
  }

  finish() {
    this.finished = true;
    const [h, a] = this.score;
    for (const s of ['home', 'away']) {
      const T = this.teams[s];
      const gf = s === 'home' ? h : a, ga = s === 'home' ? a : h;
      for (const pid of Object.keys(T.ratings)) {
        let r = T.ratings[pid] + (gf > ga ? 0.3 : gf < ga ? -0.25 : 0);
        const pos = this.p(pid).positions[0];
        if (ga === 0 && (pos === 'GK' || isDef(pos))) r += 0.5;
        T.ratings[pid] = Math.round(clamp(r, 3, 10) * 10) / 10;
      }
    }
    this.emit({ type: 'fulltime', level: LEVEL.KEY, excitement: 5, ball: { x: 0.5, y: 0.5 } });
  }

  // Simulate to completion (AI matches).
  runToEnd() { while (!this.finished) this.step(); return this; }

  summary() {
    const ps = (s) => {
      const T = this.teams[s];
      const tot = this.teams.home.stats.poss + this.teams.away.stats.poss || 1;
      return { ...T.stats, possession: Math.round((T.stats.poss / tot) * 100), xg: Math.round(T.stats.xg * 100) / 100 };
    };
    return { score: this.score.slice(), home: ps('home'), away: ps('away'), scorers: this.scorers, injuries: this.injuries, cards: this.cards,
      ratings: { home: this.teams.home.ratings, away: this.teams.away.ratings }, cond: { home: this.teams.home.cond, away: this.teams.away.cond },
      appeared: { home: [...this.teams.home.appeared], away: [...this.teams.away.appeared] } };
  }
}
