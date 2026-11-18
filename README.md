# Touchline Manager 26/27

A **Blind Dragon Studios** game. A fast, classic football management game for the **2026/27 season**, inspired by the speed, layout and mechanics of *Championship Manager: Season 01/02*. It adds full-window stadium backgrounds fetched online and live spoken dual commentary.

> Unofficial fan project. Not affiliated with Sports Interactive, Eidos/Square Enix, any league or any club.

**Play online:** https://bmkoscak.github.io/touchline-manager/

## Quick start

```bash
npm install
npm run dev          # opens http://localhost:5173
```

Node 18+ is required. `npm run build && npm run preview` serves the production build. Every push to `main` rebuilds and publishes the game to GitHub Pages (`.github/workflows/deploy.yml` → `gh-pages` branch).

## What's in the box

| Area | Details |
|---|---|
| **Leagues (2026/27)** | **26 divisions, 403 clubs.** England tiers 1–6 (Premier League, Championship, League One, League Two, National League, National League North/South); Scottish Premiership, Championship, League One, League Two; Cymru Premier; NIFL Premiership; League of Ireland Premier & First Division; La Liga, Serie A, Bundesliga, Ligue 1, Prva Liga Telemach; MLS (East/West), USL Championship (East/West) and the Canadian Premier League. Promotion and relegation run between connected divisions (incl. the National League North/South split). Calendar-year leagues (Ireland, USL, CPL) run Feb–Oct and roll over on 1 January; careers there start in January 2027. Top-flight club lists include confirmed 2026/27 promotions (e.g. Coventry, Hull, Ipswich, Racing, Deportivo, Málaga, Venezia, Frosinone, Monza, Schalke, Elversberg, Paderborn, Troyes, Le Mans, Brinje Grosuplje, Nafta 1903). PrvaLiga uses its real four-round, 36-match format. |
| **Attributes** | Classic 1–20 schema in three columns: Technical (12), Mental (10), Physical (9), plus a goalkeeping set. |
| **Tactics** | 4-4-2, 4-1-3-2, 4-3-3, 3-5-2, 4-2-3-1, 5-3-2. Drag-and-drop selection, **With Ball / Without Ball 5×5 grid** per player, attacking runs. Team instructions: mentality, passing, tackling, pressing, offside trap, counter attack, men behind ball. Set-piece takers and captain. |
| **Match engine** | Minute-by-minute simulation where wib-wob shape, instructions, fatigue, familiarity, morale and cards all feed in. Tuned per match to about 2.5 goals, 28 shots, 21 fouls, 3 yellows, 0.3 penalties and ~42% home wins. Five subs in three windows; in-match tactics and subs. |
| **Commentary** | Flashing CM-style team-coloured bar, synced **word-by-word** with speech. Lead play-by-play voice (rate 1.05×–1.35× and pitch driven by `excitement 1..10`) plus a colour analyst for cards, subs, tactical changes, injuries, half-time and full-time summaries. |
| **Audio** | `CommentaryAudioEngine`: Web Speech (zero config) or **ElevenLabs** neural voices (timestamped audio for exact word sync, Flash model, memory + IndexedDB phrase cache, automatic fallback). Synthesised stadium ambience: midfield murmur, final-third roar, goal eruption, "ooh"s and whistles. The crowd is **ducked by -8 dB** whenever a commentator speaks. |
| **Backgrounds** | `BackgroundService` picks the image by screen: club/squad → home stadium; match → host stadium; player → portrait over the stadium; tables → competition imagery. Cached in IndexedDB plus memory, so repeat visits are instant. Dark glass overlay `rgba(8,14,26,0.72)` with optional scanlines and vignette. |
| **Management** | Instant inbox with actionable messages; transfer bids with fee, installments and sell-on %; contracts with squad status, wage, signing-on fee, length and release clause; AI bids for your players; AI-to-AI transfers; scouting; shortlist; transfer list; finances (gate, TV, sponsorship, wages, prize money, installments); training schedule driving development; board confidence (you can be sacked); multi-season rollover with ageing, retirements and youth intake. |

## Controls

| Key | Action |
|---|---|
| `Space` | Continue, or skip to the next event during a match |
| `1`–`9` | Sidebar screens (News, Squad, Tactics, Training, Fixtures, Table, Search, Finances, Settings) |
| `P` | Pause / resume the match |
| `Esc` | Back |
| `Ctrl+S` | Save |

The top bar holds Match Speed (1×–20×), Commentary Frequency (Key Highlights / Extended / Full 90), the voice toggle and crowd volume. The game autosaves after every Continue. Saves live in IndexedDB.

## Live roster updates

```bash
npm run hydrate                    # all six leagues
npm run hydrate -- --league svn1   # one league: eng1 esp1 ita1 ger1 fra1 svn1
npm run hydrate -- --merge         # keep previously hydrated clubs that fail this run
THESPORTSDB_KEY=xxxx npm run hydrate   # use a TheSportsDB premium key
```

`scripts/hydrate_db.js` writes `public/data/hydrated.json`. Start a **new** game afterwards; the start screen shows whether live rosters are loaded.

- **Wikidata SPARQL** (CC0) is the default squad source. It reads current "member of sports team" statements with no end date, and gives names, birth dates, positions and nationality.
- **TheSportsDB** provides team ids, stadiums, capacities and managers. The free key (`123`) limits name searches and doesn't expose full squads, so with a premium key the script uses TheSportsDB squads (including transfer-fee text, parsed into values) first.
- Players are mapped into the 1–20 engine by `src/engine/attributes.js`: positions are normalised, ability comes from market value (where known), age and club level, and attributes are generated from role weightings.

**Seed data caveat:** the seed database reflects best-known squads as of mid-2026, so some summer-2026 transfers may be missing. Unknown managers show as "—". Squad gaps are filled with generated players, marked `generated` in Squad → Contracts. Run the hydrator for current rosters.

## Voices

Settings → Commentary voice:

- **Web Speech**: works out of the box. Choose separate lead and co-commentator voices. The best voices are usually the "Natural"/"Online" ones in Edge, or Google voices in Chrome.
- **ElevenLabs**: paste your API key, click *Load my ElevenLabs voices*, and pick two voices. The key is stored only in your browser's localStorage and sent only to `api.elevenlabs.io`.
- **Adding a provider** (OpenAI TTS, local Piper/Kokoro…): implement `{ name, available, speak(text, {speaker, excitement, volume}, {onWord, onStart}) → Promise, prepare?(text), cancel() }` in `src/audio/providers/` and register it in `CommentaryAudioEngine`.

## Backgrounds

Images are resolved in this order: TheSportsDB (by team id from the hydrator, or by name with a premium key), then Wikipedia PageImages / Wikimedia Commons (`pithumbsize=1920`), then Unsplash (optional access key), then a procedural pitch gradient in club colours. Image credits appear in the bottom-right corner. You can clear the cache in Settings.

## Project layout

```
src/
  core/        rng, event bus, IndexedDB + settings storage
  data/        leagues.js (2026/27 clubs), seedPlayers.js, names.js, generator.js
  engine/      attributes.js (1–20 schema & value mapping), tactics.js (formations, wib-wob),
               match.js (simulator), commentary.js (lead + analyst lines), fixtures.js, game.js
  audio/       CommentaryAudioEngine.js, CrowdAmbience.js, providers/{WebSpeech,ElevenLabs}Provider.js
  services/    BackgroundService.js
  ui/          app.js (shell, nav, keys), dom.js, screens/*.js
scripts/       hydrate_db.js, sim_test.js, game_test.js, transfer_test.js
public/data/   hydrated.json (generated)
```

## Tests

```bash
npm run test:sim                      # simulate every 2026/27 league season, print realism stats
node scripts/game_test.js olimpija    # full career season incl. rollover into 2027/28
node scripts/transfer_test.js         # offer → counter → contract → completion
```

## Known limitations / next steps

- Domestic leagues only: no cups or European competitions yet, though the Champions League background hook is ready.
- No promotion/relegation between tiers yet; the same clubs return each season.
- No loans or contract renewals for your own players. Expiring players leave in the summer.

## Copyright

© 2026 Blind Dragon Studios. All rights reserved. See [LICENSE](LICENSE).
