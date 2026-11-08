---
name: animate
description: Draws an episode in code - writes scene.ts (every shot, on the style's components) and sound.ts (synthesized sound effects on word times), renders preview stills at the middle of every shot, and has the look-checker agent judge them against the style's DESIGN.md until they pass. Use from /make after the voice and timeline exist, or when asked to animate, redraw or fix how an episode looks.
---

# animate

Input: an episode (folder name or slug) with `script.txt`, `words.json` and `timeline.json`. Read the style's
`DESIGN.md`, `MAKE.md` ("Animate" and "Look check") and `components/README.md` if there is one, then the example
episode's `scene.ts` and `sound.ts` in `styles/<style>/examples/` line by line: copy its structure.

## How a scene works
- `scene.ts` default-exports a scene (`defineScene` from `core/scene.ts`, or the style's shell like `inkEpisode`,
  `paintedEpisode`, `knifeEpisode`). It runs in headless Chrome on a 1080x1920 canvas; `render(c, rt)` draws one frame
  and must be pure: everything from `rt.t`, `rt.f`, `rt.shot` and the words, no state carried between frames.
- `rt.shot` is the current storyboard shot with `start`/`end` in seconds; `rt.local` is seconds into the shot;
  `rt.tl.words` are the voiced words with times. Time every beat from a word (`wordT`, `wordAt`, `f.word`), never from
  fixed seconds.
- Fonts are listed in the scene (`fonts: [{ family, url: '/styles/<style>/fonts/<file>.ttf' }]`).
- Every piece of on-screen text is pushed to `rt.text` (the style shells do this) so QA can check sizes and the
  platform's safe zones.
- `sound.ts` default-exports `defineSound(tl => cues)` or exports `cues`; instruments are in `core/audio/cues.ts`.
  Keep it under the voice: small touches on actions, one accent on the payoff.

## Loop
1. Write `scene.ts` and `sound.ts` (episode code imports the engine as `../../../../core/...` and the style as
   `../../components/...`).
2. `npm run studio -- stills <ep> --preview --at <a mid-sentence time in every shot>`. A bundling or runtime error is
   printed; fix it first.
3. Hand the stills (the paths it printed) and the episode folder to the **look-checker agent**
   (`.claude/agents/look-checker.md`) in a fresh subagent. It opens every still, compares against `DESIGN.md` and
   `MAKE.md`'s look check and the storyboard, and returns pass/fail per shot with the exact problem.
4. Fix what it names, re-render only those stills (`--at` with those times), and check again. Up to 4 rounds; if a
   shot still fails, simplify the drawing rather than adding to it.
5. Look at frame 1 yourself (`--at 0`): finished, readable, already moving, the hook visible.

Then hand back to `/finish`.
