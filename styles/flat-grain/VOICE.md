# Voice: Flat Grain

**`fern`** (Qwen, `voices/fern.wav`): a woman in her early thirties, warm low alto, unhurried, like telling a close
friend something true. Temperature 1.0. Without the voice server, Kokoro `af_bella` speaks.

- One uninterrupted take of the whole script, never cut (`"cut": "never"`): `npm run studio -- voice <episode>`.
  It tries 3 takes and keeps the clearest; it needs 95% of the words heard.
- Natural speed, about 3.5 words a second. Scripts under ~30 s so Whisper can check the whole take.
- Numbers as words ("twenty nineteen"). No tags, no delivery notes; the take carries the rhythm.
- Another voice: set `"voice": { "voiceId": "milo" }` in the episode's `episode.json` (see `voices/README.md`).
