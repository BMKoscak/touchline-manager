// Settings: voice providers (Web Speech / ElevenLabs), backgrounds, overlay, caches, saves.
import { h, panel, toast } from '../dom.js';
import { idb } from '../../core/storage.js';

export function render(app) {
  const s = app.settings;
  const set = (k) => (e) => { app.setSetting(k, e.target.type === 'checkbox' ? e.target.checked : e.target.value); };
  const web = app.audio.providers.webspeech;
  const eleven = app.audio.providers.elevenlabs;
  const webVoices = web.listVoices();
  const voiceSel = (key, list) => h('select', { class: 'input', onchange: set(key) }, h('option', { value: '' }, 'Automatic'), list.map((v) => h('option', { value: v.id, selected: s[key] === v.id }, v.label)));
  const elevenBox = h('div', { style: { display: 'grid', gap: '6px' } });
  const drawEleven = (voices = null) => {
    elevenBox.innerHTML = '';
    elevenBox.append(
      h('label', { class: 'field' }, 'ElevenLabs API key (stored only in this browser)', h('input', { class: 'input', type: 'password', value: s.elevenKey, placeholder: 'xi-api-key', onchange: set('elevenKey') })),
      h('label', { class: 'field' }, 'Model', h('select', { class: 'input', onchange: set('elevenModel') }, ['eleven_flash_v2_5', 'eleven_turbo_v2_5', 'eleven_multilingual_v2'].map((m) => h('option', { selected: s.elevenModel === m }, m)))),
      voices ? h('label', { class: 'field' }, 'Lead commentator voice', voiceSel('elevenLeadVoice', voices)) : null,
      voices ? h('label', { class: 'field' }, 'Co-commentator voice', voiceSel('elevenAnalystVoice', voices)) : null,
      h('button', { class: 'btn small', onclick: async () => { try { app.setSetting('elevenKey', s.elevenKey); const v = await eleven.listVoices(); drawEleven(v); toast(`${v.length} voices loaded`); } catch (e) { toast(e.message, true); } } }, 'Load my ElevenLabs voices'));
  };
  drawEleven();
  const test = (speaker) => {
    app.crowd.resume();
    const text = speaker === 'lead' ? 'And he is clean through... he shoots... GOAL! What a finish!' : 'Clinical. You simply cannot give a player of that quality that much space.';
    app.audio.speak({ speaker, text, excitement: speaker === 'lead' ? 9 : 4 });
  };
  return h('div', {},
    h('div', { class: 'screen-title' }, h('h1', {}, 'Settings')),
    h('div', { class: 'grid2' },
      panel('Commentary voice', h('div', { style: { display: 'grid', gap: '8px' } },
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: s.voice, onchange: set('voice') }), 'Spoken commentary'),
        h('label', { class: 'field' }, 'Voice provider', h('select', { class: 'input', onchange: (e) => { set('ttsProvider')(e); app.refresh(); } },
          h('option', { value: 'webspeech', selected: s.ttsProvider === 'webspeech' }, 'Web Speech (built in, no key)'),
          h('option', { value: 'elevenlabs', selected: s.ttsProvider === 'elevenlabs' }, 'ElevenLabs neural voices'))),
        s.ttsProvider === 'elevenlabs' ? elevenBox : h('div', { style: { display: 'grid', gap: '6px' } },
          h('label', { class: 'field' }, 'Lead commentator voice', voiceSel('webLeadVoice', webVoices)),
          h('label', { class: 'field' }, 'Co-commentator voice', voiceSel('webAnalystVoice', webVoices)),
          !webVoices.length ? h('div', { class: 'orange' }, 'No English voices detected yet. Some browsers load them after the first interaction — reopen this screen.') : null),
        h('label', { class: 'field' }, 'Voice volume', h('input', { type: 'range', min: 0, max: 100, value: Math.round(s.voiceVolume * 100), onchange: (e) => app.setSetting('voiceVolume', e.target.value / 100) })),
        h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => test('lead') }, 'Test lead'), h('button', { class: 'btn', onclick: () => test('analyst') }, 'Test co-commentator'), h('button', { class: 'btn', onclick: () => { app.crowd.resume(); app.crowd.goal(true); app.crowd.whistle('long'); } }, 'Test crowd')),
        app.audio.lastError ? h('div', { class: 'orange' }, `Last TTS error: ${app.audio.lastError}`) : null)),
      h('div', {},
        panel('Display & backgrounds', h('div', { style: { display: 'grid', gap: '6px' } },
          h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: s.fetchBackgrounds, onchange: set('fetchBackgrounds') }), 'Fetch stadium/competition backgrounds online'),
          h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: s.fetchPhotos, onchange: set('fetchPhotos') }), 'Fetch player photos (TheSportsDB)'),
          h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: s.scanlines, onchange: set('scanlines') }), 'Scanlines'),
          h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: s.vignette, onchange: set('vignette') }), 'Vignette'),
          h('label', { class: 'field' }, 'TheSportsDB key (optional — free key 123 is used otherwise)', h('input', { class: 'input', type: 'password', value: s.thesportsdbKey, onchange: set('thesportsdbKey') })),
          h('label', { class: 'field' }, 'Unsplash access key (optional fallback)', h('input', { class: 'input', type: 'password', value: s.unsplashKey, onchange: set('unsplashKey') })),
          h('button', { class: 'btn small', onclick: async () => { await app.bg.clearCache(); await idb.clear('tts').catch(() => {}); toast('Image and voice caches cleared'); } }, 'Clear image & voice cache'))),
        panel('Match', h('div', { style: { display: 'grid', gap: '6px' } },
          h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: s.autoSubs, onchange: set('autoSubs') }), 'Assistant makes my substitutions'))),
        app.game ? panel('Game', h('div', { class: 'row' },
          h('button', { class: 'btn', onclick: () => app.saveGame('slot1', true) }, 'Save game'),
          h('button', { class: 'btn danger', onclick: async () => { await app.saveGame('autosave'); app.game = null; app.setTheme(null); app.go('start', {}, false); } }, 'Quit to title'))) : null)));
}
