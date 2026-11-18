// Dual-commentator text generation: Lead (play-by-play) + Analyst (colour/co-commentator).
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function surname(name) {
  if (!name) return 'him';
  const parts = name.split(' ');
  if (parts.length === 1) return name;
  const particles = ['de', 'van', 'da', 'di', 'del', 'le', 'la', 'dos', 'von'];
  const i = parts.findIndex((p, idx) => idx > 0 && particles.includes(p.toLowerCase()));
  return i > 0 ? parts.slice(i).join(' ') : parts[parts.length - 1];
}

const T = {
  kickoff: ['And we are under way here at {stadium}!', '{home} get us started. Here we go!', 'The referee blows, and {home} against {away} is under way.'],
  kickoff2: ['The second half is under way.', '{away} restart the game for the second half.'],
  buildup: ['{p} brings it forward for {team}.', '{team} keep the ball, {p} looking for a pass.', '{p} plays it short and simple.', 'Patient stuff from {team}, through {p}.', '{p} switches play across the pitch.'],
  attack: {
    cross: ['{p} gets down the flank, looking to cross...', '{p} shapes to whip one in...', 'Space out wide for {p}...'],
    through: ['{p} looks for the through ball...', '{p} threads one forward!', 'Lovely vision from {p}...'],
    dribble: ['{p} drives at the defence...', '{p} jinks past one, then another...', '{p} on the ball, running at them!'],
    long: ['{p} sets himself from distance...', 'Room for {team} 25 yards out...'],
  },
  tackle: ['Good tackle from {p}.', '{p} reads it and wins the ball.', 'Intercepted by {p}.', '{p} steps in to break it up.'],
  clearance: ['{p} heads it clear!', 'Cleared by {p}.', '{p} gets a vital touch to clear the danger.', 'Hacked away by {p}!'],
  shot: {
    normal: ['{p} shoots!', '{p} has a go!', '{p} pulls the trigger!'],
    big: ['{p} is clean through!', 'Huge chance for {p}!', '{p} with only the keeper to beat!'],
    header: ['{p} rises to meet it!', 'Header from {p}!', '{p} gets his head on it!'],
    long: ['{p} tries his luck from range!', '{p} lets fly from distance!'],
    freekick: ['{p} curls the free kick...', '{p} steps up... strikes it!'],
    counter: ['{team} break at pace — {p} shoots!', 'Counter attack! {p} goes for goal!'],
  },
  goal: ['GOAL! {p} scores for {team}!', 'GOAL!!! {p}! What a finish!', 'It\'s in! {p} finds the net! {score}.', 'GOAL! {p} makes it {score}!', 'GOAAAL! {p} sends {stadiumCrowd} wild!'],
  goal_header: ['GOAL! {p} powers the header home!', 'GOAL! A towering header from {p}!'],
  goal_long: ['GOAL! An absolute screamer from {p}!', 'GOAL! {p} from long range — unstoppable!'],
  goal_freekick: ['GOAL! {p} curls the free kick into the top corner!'],
  goal_penalty: ['GOAL! {p} converts the penalty. {score}.', 'Penalty scored! {p} sends the keeper the wrong way!'],
  save: ['Saved by {p}!', '{p} gets down well to save.', 'Great stop from {p}!', '{p} tips it round the post!'],
  save_big: ['What a save from {p}!', 'Incredible! {p} denies {p2}!', '{p} with a world-class stop!'],
  miss: ['Wide of the post.', '{p} drags it wide.', 'Over the bar from {p}.', '{p} fires off target.'],
  miss_big: ['{p} has missed a sitter!', 'How has {p} missed that?!', 'Unbelievable — {p} puts it wide from close range!'],
  block: ['Blocked by {p}!', '{p} throws himself in the way!', 'Deflected away by {p}.'],
  woodwork: ['Off the woodwork! {p} so close!', '{p} hits the post!', 'Crashes against the bar from {p}!'],
  corner: ['Corner to {team}. {p} to take.', '{p} swings in the corner...', 'Corner kick, {team}.'],
  freekick: ['Free kick to {team} in a dangerous position.', '{p} stands over this free kick.'],
  foul: ['Foul by {p} on {p2}.', '{p} brings down {p2}.', 'The referee blows — {p} fouled {p2}.'],
  foul_box: ['PENALTY! {p} brings down {p2} in the box!', 'Penalty to {opp}! {p} clips {p2}!'],
  yellow: ['{p} is booked.', 'Yellow card for {p}.', 'The referee goes to his pocket — yellow for {p}.'],
  second_yellow: ['Second yellow for {p} — he is off!', '{p} sees red after a second booking!'],
  red: ['RED CARD! {p} is sent off!', 'Straight red for {p}!'],
  offside: ['{p} is flagged offside.', 'Offside against {p}.', 'The flag goes up — {p} strayed offside.'],
  trap_beaten: ['The offside trap is beaten! {p} is through!'],
  counter: ['{team} break at speed, {p} leading the charge!', 'Counter attack from {team}!'],
  penalty_award: ['{p} steps up to take the penalty...', '{p} places the ball on the spot...'],
  penalty_save: ['SAVED! {p} keeps out the penalty from {p2}!'],
  penalty_miss: ['{p} misses the penalty! Over the bar!', 'Penalty missed! {p} puts it wide!'],
  injury: ['{p} is down and needs treatment.', 'Concern for {team} — {p} looks injured.'],
  sub: ['Substitution for {team}: {p} on, {p2} off.', '{team} make a change — {p} replaces {p2}.'],
  tactic: ['{team} reshape tactically.'],
  halftime: ['The referee blows for half-time. {home} {hs}, {away} {as}.', 'Half-time here: {home} {hs} - {as} {away}.'],
  fulltime: ['Full time! {home} {hs}, {away} {as}.', 'And that is that. Final score: {home} {hs} - {as} {away}.'],
};

const A = {
  goal: ['Clinical. That is exactly what you want from a {pos}.', 'The movement there was superb — the defence switched off.', 'You simply cannot give a player of that quality that much space.', 'That changes the whole complexion of this game.'],
  goal_late: ['That could be decisive this late on.', 'Heartbreak for {opp} — so late in the game.'],
  yellow: ['He had to take one for the team there.', 'Reckless. He will need to be careful now.', 'A clever foul, but a deserved booking.'],
  red: ['That is a huge moment. Ten men for the rest of this one.', 'Inexcusable — he has let his team-mates down.'],
  sub: ['Fresh legs — {p2} had run himself into the ground, rated {r2}.', 'Interesting change. Expect {team} to shift their shape slightly.', 'I like that. {p} can stretch this defence.'],
  sub_injury: ['A real blow. {p2} is an important player for them.'],
  tactic: ['{team} have changed things — {mentality} now, passing {passing}.', 'A tactical tweak there, looks like a {formation} now.'],
  injury: ['That looks like a {injury}. Could be a few weeks out, I fear.', 'He has been playing through a lot of knocks this season.'],
  penalty_save: ['Brilliant goalkeeping — he read that all the way.'],
  woodwork: ['Inches away! The goalkeeper was beaten all ends up.'],
  miss_big: ['He will be having nightmares about that one.', 'Honestly, my grandmother scores that.'],
  halftime: ['{leader} have edged it — {poss}% possession, {shots} shots to {oshots}. {mom} has been the standout, a {rating} for me.', 'Tight first half. {mom} has looked the most dangerous player on the pitch.'],
  fulltime: ['{result} Man of the match has to be {mom} — a {rating}.', '{result} {mom} was the difference today, a {rating} out of ten.'],
};

function fill(s, ctx) {
  return s.replace(/\{(\w+)\}/g, (_, k) => (ctx[k] !== undefined ? ctx[k] : ''));
}

export function describeEvent(ev, sim) {
  const side = ev.team;
  const club = side ? sim.teams[side].club : null;
  const oppClub = side ? sim.teams[sim.other(side)].club : null;
  const pl = ev.player ? sim.p(ev.player) : null;
  const pl2 = ev.player2 ? sim.p(ev.player2) : null;
  const H = sim.teams.home.club, Aw = sim.teams.away.club;
  const [hs, as] = sim.score;
  const ctx = {
    p: pl ? surname(pl.name) : '', p2: pl2 ? surname(pl2.name) : '', team: club?.name || '', opp: oppClub?.name || '',
    home: H.name, away: Aw.name, hs, as, score: `${hs}-${as}`, stadium: H.stadium, stadiumCrowd: side === 'home' ? 'the home crowd' : 'the away end',
    pos: pl ? positionNoun(pl.positions[0]) : 'player', injury: (ev.injury || '').toLowerCase(),
  };
  let key = ev.type;
  let lead;
  if (ev.type === 'attack') lead = pick(T.attack[ev.kind] || T.attack.through);
  else if (ev.type === 'shot') lead = pick(ev.big && ev.kind !== 'header' ? T.shot.big : T.shot[ev.kind] || T.shot.normal);
  else if (ev.type === 'goal') lead = pick(T[`goal_${ev.kind}`] || T.goal);
  else if (ev.type === 'save' && ev.big) lead = pick(T.save_big);
  else if (ev.type === 'miss' && ev.big) lead = pick(T.miss_big);
  else lead = pick(T[key] || ['']);
  const text = fill(lead, ctx);

  let analyst = null;
  const r = Math.random();
  const T2 = side ? sim.teams[side] : null;
  if (ev.type === 'goal' && r < 0.55) analyst = fill(pick(sim.minute > 84 ? A.goal_late : A.goal), ctx);
  else if (ev.type === 'yellow' && r < 0.45) analyst = fill(pick(A.yellow), ctx);
  else if (ev.type === 'red' || ev.type === 'second_yellow') analyst = fill(pick(A.red), ctx);
  else if (ev.type === 'sub') {
    const r2 = T2?.ratings[ev.player2];
    analyst = fill(pick(ev.reason === 'injury' ? A.sub_injury : A.sub), { ...ctx, r2: r2 ? r2.toFixed(1) : '6.0' });
  } else if (ev.type === 'tactic') {
    const ins = T2.tactic.instructions;
    analyst = fill(pick(A.tactic), { ...ctx, mentality: ['very defensive', 'cautious', 'balanced', 'attacking', 'all-out attack'][ins.mentality], passing: ins.passing, formation: T2.tactic.formation });
  } else if (ev.type === 'injury' && r < 0.7) analyst = fill(pick(A.injury), ctx);
  else if (ev.type === 'penalty_save') analyst = fill(pick(A.penalty_save), ctx);
  else if (ev.type === 'woodwork' && r < 0.5) analyst = fill(pick(A.woodwork), ctx);
  else if (ev.type === 'miss' && ev.big && r < 0.5) analyst = fill(pick(A.miss_big), ctx);
  else if (ev.type === 'halftime' || ev.type === 'fulltime') analyst = summaryLine(ev.type, sim);
  return { text, analyst };
}

function positionNoun(pos) {
  if (pos === 'FC') return 'striker';
  if (pos?.startsWith('AM')) return pos === 'AMC' ? 'number ten' : 'winger';
  if (pos?.startsWith('D')) return pos === 'DMC' ? 'holding midfielder' : 'defender';
  if (pos === 'GK') return 'goalkeeper';
  return 'midfielder';
}

function summaryLine(kind, sim) {
  const s = sim.summary();
  const all = [...Object.entries(s.ratings.home).map(([id, r]) => ({ id, r })), ...Object.entries(s.ratings.away).map(([id, r]) => ({ id, r }))].sort((a, b) => b.r - a.r);
  const mom = all[0] ? surname(sim.p(all[0].id).name) : 'nobody';
  const rating = all[0] ? all[0].r.toFixed(1) : '7.0';
  const leaderSide = s.home.possession >= 50 ? 'home' : 'away';
  const leader = sim.teams[leaderSide].club.name;
  const [hs, as] = s.score;
  const H = sim.teams.home.club.name, Aw = sim.teams.away.club.name;
  const result = hs > as ? `A deserved win for ${H}.` : hs < as ? `${Aw} take the points on the road.` : 'Honours even in the end.';
  return fill(pick(A[kind]), { leader, poss: s[leaderSide].possession, shots: s[leaderSide].shots, oshots: s[leaderSide === 'home' ? 'away' : 'home'].shots, mom, rating, result });
}
