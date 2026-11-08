# Make: Flat Grain

The style-specific build recipe the `/write`, `/animate` and `/finish` skills follow. Copy the structure of the
example in `examples/` (script, episode.json, scene.ts, sound.ts). Components: `ink.ts` (grain tiles, curves, pens,
stipple), `people.ts` (the bust: skin, hair, top, mouth, eyes), `stage.ts` (timing helpers, captions, bubbles, tags,
day cards, iris wipes, phone, cup, lamp), `street.ts` (the inks and a night street).

## Write
- **script.txt**: first line `# One take: voiced whole, never cut. Rows are sentences for QA only.` Then 70-90 words in
  5 sentences: hook, moment, answer, proof, flip (`FORMAT.md` 3). Row 1 is the hook verbatim, the last row the flip.
  Start sentences with "And", "So", "Because". No delivery notes.
- **episode.json**: hook, onScreenHook, hookMechanic (one of the five in `FORMAT.md`), visualHook, caption (one
  lowercase question), sendTo, hashtags (2), `"endCard": false`.
- No storyboard.json: the timeline is built from word indexes after the voice (below).

## Timeline (after the voice)
`npx tsx styles/flat-grain/components/timeline.ts <episode> <tail> '[["s01",0,"what we see"],...]'`: 8-12 shots, each
with the index of its first word in `words.json`; tail 2-3 s for the silent reveal.

## Animate
- `scene.ts` imports `said from './words.json'` and times everything with `wordAt(said)` (`at('because')`), never
  fixed seconds. A shot table keyed by `rt.shot.id`.
- The thread object is on screen in every shot and changes. Each scene grows out of the last (a wipe from the thread
  object, or one shape turning into the next).
- The recurring "you": black hair, green jumper, crimson skin. People animate on twos, boil at 6/s, poses from `rt.t` only.
- Frame 1 is finished. Captions from `makeCaptions(said, lines, key, <hook word count>)` in the dark band; push every
  text box to `boxes` and return them in `rt.text` so QA checks them.
- Fonts line: `fonts: [{ family: 'Inter', url: '/styles/flat-grain/fonts/Inter.ttf', weight: '100 900' }]`.
- **sound.ts** exports `cues` (an array) on word times, like the example's: a soft pad, plucks on key words, a whoosh on
  each wipe, a thump on the gag, one bell on the answer.

## Look check
Flat inks, grain on colour only, hard-edged shadows, big black masses, long necks; frame 1 stops a thumb; the story
reads with the sound off; every scene visibly connects to the one before. Then the drawing checks in `FORMAT.md`.

## QA notes
Warnings about the hook ending just after 2.8 s, pace, and one long final shot (the silent reveal) are fine.
