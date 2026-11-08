# Make: Knife Paint

The style-specific build recipe the `/write`, `/animate` and `/finish` skills follow. Copy the structure of the
example in `examples/` (script, storyboard, scene.ts, sound.ts, sources.json). Components: `components/README.md`.

## Write
- **script.txt**: third-person narrator, 110-130 words, one sentence group per row, short sentences, line 1 = the hook,
  last line = the button. `{pause=0.25}`-`{pause=0.6}`, longest before the loop and the button. Numbers spelled out.
- **sources.json**: every fact in the script with its source, checked on the web (`FORMAT.md` has the shape). A claim
  you can't confirm is reworded or cut. Nothing unverified ships.
- **storyboard.json**: 12-15 shots, `words` = the exact script words, in order, every word once; `draw`, `moves`,
  `change`. A new picture every line; s01 shows line 1's object big and already moving.
- **episode.json**: title, hook, hookMechanic (`shocking-number`, `mystery` or `reversal`), visualHook, sendTo,
  caption (one lowercase line), 2-3 hashtags, `"endCard": false`.

## Animate
- `export default knifeEpisode({ s01(f) {...} })` from `components/studio.ts`. Backdrops `backdrop(name)` (add a
  palette to `SETS` in `sets.ts` for a new place), figures `lady`/`man` + `drawFig` with poses, props from
  `props.ts` or new painted sprites in the episode file.
- **Every shot moves**: walk-ins (`walk`), gestures on the key word (`arm`), looks (`head`), `idle` always; falling,
  pouring, blooming, unrolling, sparkles. Time beats with `f.word('word', fallback)`.
- Necks stay slim (the shared head handles it); never paint a figure as one rigid sprite.
- **sound.ts**: subtle. Soft filtered room tones per place, small low touches for actions (settle, swish, soft thud,
  bloop, shimmer). No hats, no kicks.

## Look check
Each still reads in one glance; everything looks painted (no bare vector fill, no gradient, no glow); nothing pierces
or overlaps wrongly; figures are in profile and on-model; the caption sits clear on its cream smear.

## Speed
Knife paint is heavy to render (a few minutes on a laptop for 45 s). Check stills first; render once.
