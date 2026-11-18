// CM 01/02-style 1–20 attribute schema and mapping utilities.
// Pure module (no DOM) — shared by the game and scripts/hydrate_db.js.
import { clamp } from '../core/rng.js';

export const TECHNICAL = ['crossing', 'dribbling', 'finishing', 'heading', 'longShots', 'marking', 'offTheBall', 'passing', 'penalties', 'setPieces', 'tackling', 'technique'];
export const MENTAL = ['aggression', 'anticipation', 'bravery', 'creativity', 'decisions', 'determination', 'flair', 'influence', 'teamwork', 'workRate'];
export const PHYSICAL = ['acceleration', 'agility', 'balance', 'injuryProneness', 'jumping', 'naturalFitness', 'pace', 'stamina', 'strength'];
export const GOALKEEPING = ['handling', 'reflexes', 'oneOnOnes', 'aerialAbility', 'commandOfArea', 'kicking'];

export const ATTR_LABEL = {
  crossing: 'Crossing', dribbling: 'Dribbling', finishing: 'Finishing', heading: 'Heading', longShots: 'Long Shots', marking: 'Marking',
  offTheBall: 'Off the Ball', passing: 'Passing', penalties: 'Penalties', setPieces: 'Set Pieces', tackling: 'Tackling', technique: 'Technique',
  aggression: 'Aggression', anticipation: 'Anticipation', bravery: 'Bravery', creativity: 'Creativity', decisions: 'Decisions',
  determination: 'Determination', flair: 'Flair', influence: 'Influence', teamwork: 'Teamwork', workRate: 'Work Rate',
  acceleration: 'Acceleration', agility: 'Agility', balance: 'Balance', injuryProneness: 'Injury Proneness', jumping: 'Jumping',
  naturalFitness: 'Natural Fitness', pace: 'Pace', stamina: 'Stamina', strength: 'Strength',
  handling: 'Handling', reflexes: 'Reflexes', oneOnOnes: 'One on Ones', aerialAbility: 'Aerial Ability', commandOfArea: 'Command of Area', kicking: 'Kicking',
};

export const POSITIONS = ['GK', 'DR', 'DC', 'DL', 'DMC', 'MR', 'MC', 'ML', 'AMR', 'AMC', 'AML', 'FC'];

// Role importance weights (0..1) per attribute, used both for generation and position rating.
const W = {
  GK: { handling: 1, reflexes: 1, oneOnOnes: .9, aerialAbility: .8, commandOfArea: .7, kicking: .5, anticipation: .7, decisions: .7, agility: .8, jumping: .6, bravery: .6, passing: .25, technique: .25 },
  DC: { marking: 1, tackling: 1, heading: .9, anticipation: .85, strength: .8, jumping: .8, bravery: .7, decisions: .7, pace: .5, passing: .35, teamwork: .5, balance: .4, technique: .25, aggression: .5 },
  DW: { tackling: .9, marking: .85, pace: .85, crossing: .7, stamina: .8, acceleration: .75, anticipation: .6, workRate: .7, passing: .5, dribbling: .45, teamwork: .6, technique: .45, offTheBall: .35 },
  DMC: { tackling: .9, marking: .7, passing: .8, anticipation: .85, decisions: .85, teamwork: .8, workRate: .8, stamina: .7, strength: .6, technique: .55, aggression: .5, creativity: .35 },
  MC: { passing: 1, technique: .8, decisions: .85, creativity: .7, teamwork: .8, workRate: .75, stamina: .75, anticipation: .65, tackling: .5, longShots: .5, dribbling: .45, offTheBall: .5, balance: .45 },
  MW: { crossing: .9, dribbling: .85, pace: .85, acceleration: .8, technique: .75, stamina: .75, workRate: .65, passing: .65, offTheBall: .6, flair: .5, agility: .55, creativity: .45 },
  AMC: { creativity: 1, passing: .9, technique: .95, dribbling: .8, flair: .8, decisions: .8, offTheBall: .75, longShots: .65, finishing: .6, anticipation: .6, agility: .6, balance: .5 },
  AMW: { dribbling: 1, pace: .9, acceleration: .9, technique: .85, flair: .8, crossing: .7, offTheBall: .75, finishing: .65, agility: .75, creativity: .6, balance: .55, passing: .5 },
  FC: { finishing: 1, offTheBall: .95, anticipation: .8, heading: .65, technique: .7, pace: .7, acceleration: .7, strength: .55, dribbling: .6, decisions: .65, balance: .55, jumping: .5, flair: .5 },
};

export function roleOf(pos) {
  switch (pos) {
    case 'GK': return 'GK';
    case 'DC': return 'DC';
    case 'DR': case 'DL': return 'DW';
    case 'DMC': return 'DMC';
    case 'MC': return 'MC';
    case 'MR': case 'ML': return 'MW';
    case 'AMC': return 'AMC';
    case 'AMR': case 'AML': return 'AMW';
    case 'FC': return 'FC';
    default: return 'MC';
  }
}

// Map arbitrary position strings (e.g. "Centre-Back", "Left Winger", "D C") to our codes.
export function normalizePosition(raw) {
  const s = String(raw || '').toLowerCase();
  if (/goal|keeper|^gk/.test(s)) return ['GK'];
  if (/left.?back|left wing.?back|^dl|d l/.test(s)) return ['DL'];
  if (/right.?back|right wing.?back|^dr|d r/.test(s)) return ['DR'];
  if (/centre.?back|center.?back|central def|defender|^dc|d c/.test(s)) return ['DC'];
  if (/defensive mid|holding|^dm/.test(s)) return ['DMC'];
  if (/left mid/.test(s)) return ['ML', 'AML'];
  if (/right mid/.test(s)) return ['MR', 'AMR'];
  if (/attacking mid|^am|playmaker|number 10/.test(s)) return ['AMC'];
  if (/left wing|left forward/.test(s)) return ['AML'];
  if (/right wing|right forward/.test(s)) return ['AMR'];
  if (/wing/.test(s)) return ['AMR', 'AML'];
  if (/centre.?forward|center.?forward|striker|forward|attacker|^f/.test(s)) return ['FC'];
  if (/mid/.test(s)) return ['MC'];
  return ['MC'];
}

const ALL_OUTFIELD = [...TECHNICAL, ...MENTAL, ...PHYSICAL];
const NEUTRAL_MENTAL = ['aggression', 'bravery', 'determination', 'influence', 'flair'];

// Generate a full attribute set from ability (1..200) and positions.
export function generateAttributes(ca, positions, rng, opts = {}) {
  const primary = positions[0] || 'MC';
  const role = roleOf(primary);
  const w = { ...W[role] };
  // Blend secondary positions lightly.
  for (const p of positions.slice(1)) {
    for (const [k, v] of Object.entries(W[roleOf(p)])) w[k] = Math.max(w[k] || 0, v * 0.7);
  }
  const L = Math.pow(clamp(ca, 1, 200) / 200, 0.8);
  const attrs = {};
  const isGK = role === 'GK';
  for (const a of ALL_OUTFIELD) {
    let wt = w[a] ?? (isGK ? 0.05 : 0.2);
    if (NEUTRAL_MENTAL.includes(a)) wt = Math.max(wt, 0.35 + rng.float() * 0.4);
    let val = 2 + 18 * L * (0.42 + 0.58 * wt) + rng.normal(0, 1.6);
    if (isGK && TECHNICAL.includes(a) && !['passing', 'technique'].includes(a)) val = Math.min(val, 2 + rng.float() * 6);
    attrs[a] = val;
  }
  // Physical specials
  attrs.injuryProneness = clamp(rng.normal(7, 3.5), 1, 19);
  attrs.naturalFitness = clamp(attrs.naturalFitness + rng.normal(0, 2), 1, 20);
  if (opts.age && opts.age >= 31) {
    const decay = (opts.age - 30) * 0.9;
    attrs.pace -= decay; attrs.acceleration -= decay; attrs.agility -= decay * 0.6; attrs.stamina -= decay * 0.5;
    attrs.decisions += decay * 0.4; attrs.anticipation += decay * 0.4; attrs.influence += decay * 0.5;
  }
  if (isGK) {
    for (const g of GOALKEEPING) attrs[g] = 2 + 18 * L * (0.42 + 0.58 * (w[g] ?? 0.5)) + rng.normal(0, 1.5);
  } else {
    for (const g of GOALKEEPING) attrs[g] = 1 + rng.float() * 3;
  }
  for (const k of Object.keys(attrs)) attrs[k] = round1(clamp(attrs[k], 1, 20));
  return attrs;
}

const round1 = (v) => Math.round(v * 10) / 10;
export const shown = (v) => clamp(Math.round(v), 1, 20);

// Positional familiarity: 1.0 natural, ~0.85 adjacent, otherwise lower.
const ADJ = {
  GK: [], DC: ['DMC', 'DR', 'DL'], DR: ['DC', 'MR', 'DL'], DL: ['DC', 'ML', 'DR'], DMC: ['MC', 'DC'], MC: ['DMC', 'AMC', 'MR', 'ML'],
  MR: ['AMR', 'DR', 'MC', 'ML'], ML: ['AML', 'DL', 'MC', 'MR'], AMC: ['MC', 'FC', 'AMR', 'AML'], AMR: ['MR', 'AML', 'FC', 'AMC'],
  AML: ['ML', 'AMR', 'FC', 'AMC'], FC: ['AMC', 'AMR', 'AML'],
};
export function familiarity(player, slotPos) {
  if (player.positions.includes(slotPos)) return 1;
  if (slotPos === 'GK' || player.positions.includes('GK')) return 0.25;
  if (player.positions.some((p) => ADJ[slotPos]?.includes(p))) return 0.86;
  return 0.65;
}

// Role rating (1..20) for a player in a given slot.
export function roleRating(player, slotPos) {
  const w = W[roleOf(slotPos)];
  let s = 0, t = 0;
  for (const [a, wt] of Object.entries(w)) { s += (player.attrs[a] ?? 10) * wt; t += wt; }
  return (s / t) * familiarity(player, slotPos);
}

// Estimate CA from attributes (keeps CA consistent after training changes).
export function estimateCA(player) {
  const r = roleRating({ ...player, positions: player.positions }, player.positions[0]);
  // invert the generation curve: attr ≈ 2 + 18*L*(0.42+0.58*wt), avg wt ≈ .72 → factor .8376
  const L = clamp((r - 2) / (18 * 0.84), 0.01, 1);
  return clamp(Math.round(200 * Math.pow(L, 1 / 0.8)), 1, 200);
}

const ageFactor = (age) => (age <= 20 ? 1.35 : age <= 23 ? 1.25 : age <= 27 ? 1.0 : age <= 29 ? 0.8 : age <= 31 ? 0.55 : age <= 33 ? 0.32 : 0.15);

export function valueFromAbility(ca, pa, age, leagueValueFactor = 1) {
  const base = Math.exp((ca - 100) / 17.5) * 1_000_000;
  const potBonus = age <= 23 ? 1 + Math.max(0, pa - ca) / 45 : 1;
  const v = base * ageFactor(age) * potBonus * leagueValueFactor;
  return roundMoney(clamp(v, 10_000, 250_000_000));
}

export function abilityFromValue(valueEUR, age, leagueValueFactor = 1) {
  const v = Math.max(10_000, valueEUR) / (ageFactor(age) * leagueValueFactor);
  return clamp(Math.round(100 + 17.5 * Math.log(v / 1_000_000)), 35, 195);
}

export function wageFromAbility(ca, leagueValueFactor = 1) {
  const w = Math.exp((ca - 100) / 22) * 9_000 * leagueValueFactor;
  return roundMoney(clamp(w, 400, 600_000));
}

export function roundMoney(v) {
  if (v >= 10_000_000) return Math.round(v / 500_000) * 500_000;
  if (v >= 1_000_000) return Math.round(v / 50_000) * 50_000;
  if (v >= 100_000) return Math.round(v / 5_000) * 5_000;
  if (v >= 10_000) return Math.round(v / 500) * 500;
  return Math.round(v / 50) * 50;
}

// Club-level squad ability target (average first XI CA) from reputation.
export const clubTargetCA = (rep) => clamp(30 + rep * 1.52, 40, 185);

// Position display string in CM style, e.g. "D/WB RL", "AM RLC", "F C".
export function positionString(positions) {
  const groups = { GK: [], D: [], DM: [], M: [], AM: [], F: [] };
  for (const p of positions) {
    if (p === 'GK') groups.GK.push('');
    else if (p.startsWith('D') && p !== 'DMC') groups.D.push(p[1]);
    else if (p === 'DMC') groups.DM.push('C');
    else if (p.startsWith('AM')) groups.AM.push(p[2]);
    else if (p.startsWith('M')) groups.M.push(p[1]);
    else if (p === 'FC') groups.F.push('C');
  }
  const order = (arr) => ['R', 'L', 'C'].filter((x) => arr.includes(x)).join('');
  const parts = [];
  if (groups.GK.length) parts.push('GK');
  if (groups.D.length) parts.push('D ' + order(groups.D));
  if (groups.DM.length) parts.push('DM');
  if (groups.M.length) parts.push('M ' + order(groups.M));
  if (groups.AM.length) parts.push('AM ' + order(groups.AM));
  if (groups.F.length) parts.push('F C');
  return parts.join(', ');
}
