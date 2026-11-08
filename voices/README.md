# Voices

Six original voices. Each one is a synthetic voice **designed from a written description** with Qwen3-TTS
VoiceDesign (Apache-2.0) on a Mac, so no real person's voice was recorded or cloned to make them. They are released
under **CC0 1.0**: use them for anything, commercial videos included, with no credit needed.

Each voice is `<name>.wav` (a clean ~10 s sample, 24 kHz mono) plus `<name>.txt` (exactly what the sample says). The
local voice server (`voice-server/`) clones a voice from those two files whenever you voice a script.

| Voice | Description it was designed from | Default for | Kokoro stand-in |
|---|---|---|---|
| `fern` | A woman in her early thirties, warm low alto, unhurried and conversational, like telling a close friend something true she noticed about them | flat-grain | `af_bella` |
| `jules` | A young adult in their mid twenties, light and clear, a little wry and self-aware, telling a story about their own week | ink-line | `af_sarah` |
| `archer` | A man in his fifties, deep and measured, a calm documentary narrator who finds history quietly amazing | knife-paint | `am_michael` |
| `basil` | An older man in his sixties, slightly gravelly and deadpan, narrating an ordinary person's day like a nature documentary, soft English accent | painted | `bm_lewis` |
| `rue` | A woman in her forties, crisp and bright, a brisk and curious science presenter, light Irish accent | (any) | - |
| `milo` | A man in his late twenties, easy friendly mid-range voice, casual and honest, like a friend explaining something over coffee | (any) | - |

The "Kokoro stand-in" speaks when the Qwen voice server isn't running (no setup needed, plainer delivery).

## Use another voice
For one episode, add to its `episode.json`:
```json
"voice": { "voiceId": "rue" }
```
For a whole style, change `voice.voiceId` in `styles/<style>/pack.json`.

## Make your own voice
Describe it and let Qwen design it (needs `npm run voice:setup` first; downloads the VoiceDesign model, ~4 GB, once):
```bash
voice-server/.venv/bin/python voice-server/design.py nora --describe "A woman in her seventies, warm and amused, a grandmother telling a story she has told many times"
```
It writes three takes to `voices/_candidates/nora/` and keeps take 1 as `voices/nora.wav`. Listen to all three; to keep
another one: `... design.py nora --describe "..." --keep 2`. Restart the voice server to pick it up.

You can also drop in any clean 5-20 s recording as `voices/<name>.wav` with its exact transcript in `<name>.txt`.
Only clone a voice you own or have permission to use.
