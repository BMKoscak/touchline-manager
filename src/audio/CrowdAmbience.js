// Synthesised stadium ambience (Web Audio): murmur bed, intensity roar, goal eruption, "ooh"s, whistles.
// Automatic ducking: crowd gain drops by 8 dB whenever a commentator speaks.
const DUCK_DB = -8;
const DUCK_GAIN = Math.pow(10, DUCK_DB / 20); // ≈ 0.398

function noiseBuffer(ctx, seconds = 4, color = 'pink') {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (color === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else {
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      }
    }
  }
  return buf;
}

export class CrowdAmbience {
  constructor() { this.ctx = null; this.volume = 0.6; this.running = false; this.intensity = 0.2; }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.gain.value = this.volume;
    this.duckGain = ctx.createGain(); this.duckGain.gain.value = 1;
    this.master.connect(this.duckGain).connect(ctx.destination);
    this.sfx = ctx.createGain(); this.sfx.gain.value = 0.5; this.sfx.connect(ctx.destination); // whistles are not ducked

    const pink = noiseBuffer(ctx, 5, 'pink'), brown = noiseBuffer(ctx, 5, 'brown');
    // Murmur bed: many voices = band-passed pink noise with slow swell
    this.murmurSrc = ctx.createBufferSource(); this.murmurSrc.buffer = pink; this.murmurSrc.loop = true;
    const mf = ctx.createBiquadFilter(); mf.type = 'bandpass'; mf.frequency.value = 520; mf.Q.value = 0.55;
    const mf2 = ctx.createBiquadFilter(); mf2.type = 'lowpass'; mf2.frequency.value = 2200;
    this.murmurGain = ctx.createGain(); this.murmurGain.gain.value = 0.35;
    this.murmurSrc.connect(mf).connect(mf2).connect(this.murmurGain).connect(this.master);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07; const lfoG = ctx.createGain(); lfoG.gain.value = 0.08;
    lfo.connect(lfoG).connect(this.murmurGain.gain); lfo.start();
    // Roar layer: brighter noise, driven by intensity
    this.roarSrc = ctx.createBufferSource(); this.roarSrc.buffer = brown; this.roarSrc.loop = true;
    this.roarFilter = ctx.createBiquadFilter(); this.roarFilter.type = 'bandpass'; this.roarFilter.frequency.value = 900; this.roarFilter.Q.value = 0.7;
    this.roarGain = ctx.createGain(); this.roarGain.gain.value = 0.0;
    this.roarSrc.connect(this.roarFilter).connect(this.roarGain).connect(this.master);
    this.pink = pink;
    this.murmurSrc.start(); this.roarSrc.start();
    this.running = true;
  }

  resume() { this.init(); if (this.ctx?.state === 'suspended') this.ctx.resume(); }
  stop() { if (this.ctx) { this.ctx.close(); this.ctx = null; this.running = false; } }
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1); }

  // 0..1 — low murmur in midfield, rising roar into the final third.
  setIntensity(level) {
    if (!this.ctx) return;
    this.intensity = level;
    const t = this.ctx.currentTime;
    this.roarGain.gain.setTargetAtTime(Math.max(0, (level - 0.25) * 0.75), t, 0.35);
    this.roarFilter.frequency.setTargetAtTime(700 + level * 900, t, 0.4);
    this.murmurGain.gain.setTargetAtTime(0.28 + level * 0.15, t, 0.5);
  }

  goal(isHomeGoal = true) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const g = this.roarGain.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    const peak = isHomeGoal ? 1.4 : 0.7;
    g.linearRampToValueAtTime(peak, t + 0.35); g.setValueAtTime(peak, t + 3.5); g.linearRampToValueAtTime(0.3, t + 9);
    this.roarFilter.frequency.cancelScheduledValues(t);
    this.roarFilter.frequency.setValueAtTime(1500, t); this.roarFilter.frequency.linearRampToValueAtTime(900, t + 9);
    if (isHomeGoal) this.cheerBurst(4);
  }

  cheerBurst(seconds = 2) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = this.pink;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.9;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.9, t + 0.2); g.gain.linearRampToValueAtTime(0, t + seconds);
    src.connect(f).connect(g).connect(this.master); src.start(t); src.stop(t + seconds + 0.1);
  }

  // Near miss "ooh" — a vowel-like formant sweep.
  ooh() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = this.pink;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3;
    f.frequency.setValueAtTime(380, t); f.frequency.linearRampToValueAtTime(650, t + 0.5); f.frequency.linearRampToValueAtTime(420, t + 1.6);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1.6, t + 0.25); g.gain.linearRampToValueAtTime(0, t + 1.8);
    src.connect(f).connect(g).connect(this.master); src.start(t); src.stop(t + 2);
  }

  // Referee whistle: 'short' (foul), 'double' (card / half), 'long' (full time).
  whistle(kind = 'short') {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const blasts = kind === 'long' ? [[0, 0.25], [0.35, 0.25], [0.7, 1.1]] : kind === 'double' ? [[0, 0.22], [0.3, 0.5]] : [[0, 0.3]];
    for (const [off, dur] of blasts) {
      const t = ctx.currentTime + off;
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 2900;
      const vib = ctx.createOscillator(); vib.frequency.value = 38; const vg = ctx.createGain(); vg.gain.value = 140;
      vib.connect(vg).connect(osc.frequency);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18, t + 0.02); g.gain.setValueAtTime(0.18, t + dur - 0.05); g.gain.linearRampToValueAtTime(0, t + dur);
      osc.connect(g).connect(this.sfx); osc.start(t); vib.start(t); osc.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
    }
  }

  duck(on) {
    if (!this.ctx) return;
    this.duckGain.gain.setTargetAtTime(on ? DUCK_GAIN : 1, this.ctx.currentTime, on ? 0.08 : 0.35);
  }
}
