# Voice: Knife Paint

**`archer`** (Qwen, `voices/archer.wav`): a man in his fifties, deep and measured, a calm documentary narrator who finds
history quietly amazing. Temperature 0.9, dry on the last line. Without the voice server, Kokoro `am_michael` speaks.
`rue` (a brisk science presenter) is a good alternative.

- `npm run studio -- voice <episode>`. These scripts run 40-50 s and the Whisper check hears 30 s at a time, so the
  script is voiced in pieces of up to 60 words (`"pieceWords": 60`), each the best of 3 takes.
- Numbers spelled out in `script.txt` ("twelve thousand"). Misses on hyphenated words ("eighteen-year-old") are fine.
