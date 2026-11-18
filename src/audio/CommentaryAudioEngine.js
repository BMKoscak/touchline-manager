// Dual-commentator broadcast engine: queues Lead + Analyst lines, picks a TTS provider,
// ducks the crowd by -8 dB while speaking, and reports word progress for banner sync.
import { WebSpeechProvider } from './providers/WebSpeechProvider.js';
import { ElevenLabsProvider } from './providers/ElevenLabsProvider.js';

export class CommentaryAudioEngine {
  constructor(crowd) {
    this.crowd = crowd;
    this.providers = { webspeech: new WebSpeechProvider(), elevenlabs: new ElevenLabsProvider() };
    this.providerName = 'webspeech';
    this.enabled = true;
    this.volume = 1;
    this.speaking = false;
    this.lastError = null;
    this._gen = 0;
  }

  configure(settings) {
    this.enabled = settings.voice;
    this.volume = settings.voiceVolume ?? 1;
    this.providers.elevenlabs.configure({ key: settings.elevenKey, model: settings.elevenModel, leadVoice: settings.elevenLeadVoice, analystVoice: settings.elevenAnalystVoice });
    this.providers.webspeech.setPreferredVoices(settings.webLeadVoice, settings.webAnalystVoice);
    this.providerName = settings.ttsProvider === 'elevenlabs' && this.providers.elevenlabs.available ? 'elevenlabs' : 'webspeech';
  }

  get provider() { return this.providers[this.providerName]; }
  get available() { return this.provider.available || this.providers.webspeech.available; }

  /** Warm the cache for an upcoming line (neural providers). */
  prefetch(line) { if (this.enabled && this.provider.prepare) this.provider.prepare(line.text, line); }

  /**
   * Speak one line. Resolves when finished (or immediately if voice disabled).
   * @param {{speaker:'lead'|'analyst', text:string, excitement:number}} line
   * @param {{onWord?:(charIndex:number)=>void, onStart?:()=>void}} cb
   */
  async speak(line, cb = {}) {
    if (!this.enabled || !line.text) return;
    const gen = ++this._gen;
    this.speaking = true;
    this.crowd?.duck(true);
    try {
      await this.provider.speak(line.text, { speaker: line.speaker, excitement: line.excitement, volume: this.volume }, cb);
    } catch (e) {
      // Neural provider failed — fall back to Web Speech for this line.
      this.lastError = e.message;
      console.warn('[TTS] falling back to Web Speech:', e.message);
      if (gen === this._gen) await this.providers.webspeech.speak(line.text, { speaker: line.speaker, excitement: line.excitement, volume: this.volume }, cb);
    } finally {
      if (gen === this._gen) { this.speaking = false; setTimeout(() => { if (!this.speaking) this.crowd?.duck(false); }, 150); }
    }
  }

  cancel() {
    this._gen++;
    Object.values(this.providers).forEach((p) => p.cancel());
    this.speaking = false;
    this.crowd?.duck(false);
  }
}
