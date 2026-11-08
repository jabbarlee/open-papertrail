# Make: Painted

The style-specific build recipe the `/write`, `/animate` and `/finish` skills follow. Copy the structure of the
example in `examples/` (script, storyboard, scene.ts, sound.ts). Components: `components/README.md`.

## Write
- **script.txt**: the narrator, third person, 55-75 words, one short sentence per line (≤ 12 words). Line 1 = the
  hook, last line = the payoff. `{pause=0.3}`-`{pause=0.7}` after beats that need to land, the longest before the turn
  and before the payoff. Numbers spelled out. The lead never speaks.
- **storyboard.json**: 10-12 shots `s01`…; each spoken shot's `words` = the exact script words it covers, in order,
  every word once; plus `draw`, `moves`, `change`. Last shot: `"words": ""`, `"seconds": 1.8` (a wordless button
  that loops). Grammar: hook frame → wide of the place → inserts on the hero prop → reaction close-ups → the turn →
  the button. **s01 shows line 1's fact big and readable (the hero prop ≥ 35% of the frame width, the lead in shot),
  already moving (snap zoom).**
- **episode.json**: title, hook, hookMechanic (`mystery`, `deadpan-reveal`, `absurd-premise` or `mid-action`),
  visualHook, sendTo, caption (one lowercase line + one emoji), hashtags (2), `"endCard": false`.

## Animate
- `export default paintedEpisode({ s01(c, t, rt) {...}, ... })` from `components/episode.ts`.
- Sets are painted layer functions cached with `L('key', fn)` (`paintRect`, `paintPoly`, `brushLine`, signs, floors);
  see the example's sets. Each place gets one painted gag in the dressing.
- Characters: `ottoAt / ottoHeadAt / maeAt / salAt / catAt / dexAt`. A new character is a function following
  `cast/mae.ts` (rules in `DESIGN.md`), or use `/new-character` to design one with a sheet.
- Props: `paperCup`, `notebookPaper`, `drawProp` (`components/props.ts`), or a new prop drawn the same way.
- **Every beat is timed from the words**: `wordT(rt, 'floor', fallback)`. Never fixed seconds.
- Camera per shot with `cam(c, t, rt, [moves], draw)`: hook `snap`, wides `push`, a `punch` on a realisation,
  `shake` on an impact.
- Text inside the art (signs, cups) stays within x 60-910 and above y 1520. The narrator subtitle is automatic.
- **sound.ts**: like the example's (`components/sfx.ts`): room tone, foley for every touch timed from words, one small
  sting on the payoff.

## Look check
The hook frame reads in one glance; every prop and sign is readable; the cast are on-model (oval eyes, dot pupils, no
nose, flat fills) and not cropped through the face; nothing floats or overlaps wrongly; the subtitle doesn't sit on a
busy area; the painted overlay is on (it's what makes it look painted).
