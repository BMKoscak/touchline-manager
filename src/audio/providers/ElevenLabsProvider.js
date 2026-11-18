// Optional neural TTS hook: ElevenLabs text-to-speech with character timestamps (exact word sync),
// low-latency Flash model by default, and a two-level phrase cache (memory + IndexedDB).
//
// Any other provider (OpenAI TTS, local Piper/Kokoro endpoint…) can be added by implementing the same
// interface: { name, available, speak(text, opts, cb) → Promise, prepare(text, opts) → Promise, cancel() }.
import { idb } from '../../core/storage.js';

const API = 'https://api.elevenlabs.io/v1';

function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

export class ElevenLabsProvider {
  constructor() {
    this.name = 'elevenlabs';
    this.key = ''; this.model = 'eleven_flash_v2_5'; this.voices = { lead: '', analyst: '' };
    this.mem = new Map();
    this.audio = null; this.raf = 0;
  }
  get available() { return !!this.key; }
  configure({ key, model, leadVoice, analystVoice }) {
    this.key = key || ''; this.model = model || 'eleven_flash_v2_5';
    this.voices = { lead: leadVoice || '', analyst: analystVoice || '' };
  }

  async listVoices() {
    if (!this.key) return [];
    const r = await fetch(`${API}/voices`, { headers: { 'xi-api-key': this.key } });
    if (!r.ok) throw new Error(`ElevenLabs voices: HTTP ${r.status}`);
    const j = await r.json();
    return (j.voices || []).map((v) => ({ id: v.voice_id, label: `${v.name}${v.labels?.accent ? ` (${v.labels.accent})` : ''}` }));
  }

  async ensureVoices() {
    if (this.voices.lead && this.voices.analyst) return;
    const list = await this.listVoices();
    if (!list.length) throw new Error('No ElevenLabs voices available');
    this.voices.lead ||= list[0].id;
    this.voices.analyst ||= (list[1] || list[0]).id;
  }

  settingsFor(speaker, excitement) {
    return speaker === 'lead'
      ? { stability: Math.max(0.2, 0.5 - excitement * 0.03), similarity_boost: 0.75, style: Math.min(0.8, excitement / 12), use_speaker_boost: true }
      : { stability: 0.55, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true };
  }

  async fetchClip(text, speaker, excitement) {
    await this.ensureVoices();
    const voice = this.voices[speaker] || this.voices.lead;
    const exBucket = Math.round(excitement / 3);
    const key = hash(`${voice}|${this.model}|${exBucket}|${text}`);
    if (this.mem.has(key)) return this.mem.get(key);
    const cached = await idb.get('tts', key).catch(() => null);
    if (cached) { this.mem.set(key, cached); return cached; }
    const r = await fetch(`${API}/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': this.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: this.model, voice_settings: this.settingsFor(speaker, excitement) }),
    });
    if (!r.ok) throw new Error(`ElevenLabs TTS: HTTP ${r.status}`);
    const j = await r.json();
    const clip = { audio: j.audio_base64, starts: j.alignment?.character_start_times_seconds || [] };
    this.mem.set(key, clip);
    idb.set('tts', key, clip).catch(() => {});
    return clip;
  }

  prepare(text, { speaker = 'lead', excitement = 5 } = {}) { return this.fetchClip(text, speaker, excitement).catch(() => null); }

  async speak(text, { speaker = 'lead', excitement = 5, volume = 1 } = {}, cb = {}) {
    const clip = await this.fetchClip(text, speaker, excitement);
    const bytes = Uint8Array.from(atob(clip.audio), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
    const audio = this.audio = new Audio(url);
    audio.volume = volume;
    audio.preservesPitch = true;
    audio.playbackRate = speaker === 'lead' ? Math.min(1.25, 1 + Math.max(0, excitement - 5) * 0.04) : 1;
    // Word start offsets from character alignment
    const wordStarts = [...text.matchAll(/\S+/g)].map((m) => ({ idx: m.index, t: clip.starts[m.index] ?? 0 }));
    let wi = 0;
    return new Promise((resolve) => {
      const tick = () => {
        while (wi < wordStarts.length && audio.currentTime >= wordStarts[wi].t) { cb.onWord?.(wordStarts[wi].idx); wi++; }
        if (!audio.paused && !audio.ended) this.raf = requestAnimationFrame(tick);
      };
      const done = () => { cancelAnimationFrame(this.raf); cb.onWord?.(text.length); URL.revokeObjectURL(url); resolve(); };
      audio.onplay = () => { cb.onStart?.(); tick(); };
      audio.onended = done; audio.onerror = done; audio.onpause = () => { if (audio.currentTime < audio.duration) done(); };
      audio.play().catch(done);
    });
  }

  cancel() { if (this.audio) { this.audio.pause(); this.audio = null; } cancelAnimationFrame(this.raf); }
}
