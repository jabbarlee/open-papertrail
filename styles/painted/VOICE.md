# Voice: Painted

**`basil`** (Qwen, `voices/basil.wav`): an older man, slightly gravelly, deadpan, soft-spoken English accent,
narrating an ordinary person's day like a nature documentary. Temperature 0.9. Without the voice server, Kokoro
`bm_lewis` speaks. The lead never speaks.

- `npm run studio -- voice <episode>`: the whole script in one take (3 tries, clearest kept), re-timed per line.
- **Script:** one short third-person sentence per line, `{pause=…}` after a beat that needs to land (0.3-0.7 s).
  Spell numbers out ("eight fourteen").
- Whisper writes "café" as "cafe" and may report it missed; it's spoken. Check any other miss.
- **Cut to the voice:** in `scene.ts` time beats from the words (`wordT(rt, 'floor', fallback)`), never fixed
  seconds, so a re-voice lines up on its own.
