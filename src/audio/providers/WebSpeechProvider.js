// Zero-config TTS using the browser's Web Speech API. No API keys needed.
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export class WebSpeechProvider {
  constructor() {
    this.name = 'webspeech';
    this.available = typeof window !== 'undefined' && 'speechSynthesis' in window;
    this.voices = [];
    this.prefs = { lead: '', analyst: '' };
    if (this.available) {
      const load = () => { this.voices = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)); };
      load();
      speechSynthesis.addEventListener?.('voiceschanged', load);
    }
  }

  listVoices() { return this.voices.map((v) => ({ id: v.name, label: `${v.name} (${v.lang})` })); }
  setPreferredVoices(lead, analyst) { this.prefs = { lead, analyst }; }

  pickVoice(speaker) {
    const vs = this.voices;
    if (!vs.length) return null;
    const pref = this.prefs[speaker];
    if (pref) { const v = vs.find((x) => x.name === pref); if (v) return v; }
    const score = (v) => (/GB/i.test(v.lang) ? 3 : 0) + (/natural|neural|online|google/i.test(v.name) ? 2 : 0) + (/male|daniel|george|ryan|arthur|guy/i.test(v.name) ? 1 : 0);
    const ranked = vs.slice().sort((a, b) => score(b) - score(a));
    if (speaker === 'lead') return ranked[0];
    // Analyst: a clearly different voice (different name, ideally different accent)
    const lead = this.pickVoice('lead');
    return ranked.find((v) => v.name !== lead?.name && v.lang !== lead?.lang) || ranked.find((v) => v.name !== lead?.name) || ranked[0];
  }

  /**
   * Speak a line. cb.onWord(charIndex) is called as words are spoken (boundary events, with a timing fallback).
   */
  speak(text, { speaker = 'lead', excitement = 5, volume = 1 } = {}, cb = {}) {
    return new Promise((resolve) => {
      if (!this.available || !text) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      const v = this.pickVoice(speaker);
      if (v) u.voice = v;
      if (speaker === 'lead') {
        u.rate = clamp(1.05 + (excitement / 10) * 0.3, 1.05, 1.35); // 1.05x–1.35x in box scrambles
        u.pitch = clamp(0.95 + (excitement - 4) * 0.045, 0.85, 1.3);
      } else {
        u.rate = 1.02; u.pitch = v === this.pickVoice('lead') ? 0.78 : 0.95;
      }
      u.volume = volume;
      // Fallback word timing (some voices never fire boundary events)
      const words = [...text.matchAll(/\S+/g)].map((m) => m.index);
      const msPerChar = 1000 / (14.5 * u.rate);
      let gotBoundary = false;
      const timers = [];
      const startFallback = () => {
        words.forEach((idx) => timers.push(setTimeout(() => { if (!gotBoundary) cb.onWord?.(idx); }, idx * msPerChar)));
      };
      let done = false;
      const finish = () => { if (done) return; done = true; timers.forEach(clearTimeout); clearTimeout(safety); cb.onWord?.(text.length); resolve(); };
      u.onstart = () => { cb.onStart?.(); startFallback(); };
      u.onboundary = (e) => { if (e.name === 'word' || e.name === undefined) { gotBoundary = true; cb.onWord?.(e.charIndex); } };
      u.onend = finish; u.onerror = finish;
      const safety = setTimeout(finish, 1500 + text.length * msPerChar * 1.6);
      speechSynthesis.speak(u);
    });
  }

  cancel() { if (this.available) speechSynthesis.cancel(); }
}
