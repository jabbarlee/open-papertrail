# Make: Ink Line

The style-specific build recipe the `/write`, `/animate` and `/finish` skills follow. Copy the structure of the
example in `examples/` (script, storyboard, scene.ts, sound.ts).

## Write
- **script.txt**: first person, 55-80 words, 6-9 lines of full natural sentences (joined with "so", "because", "and
  then"; never a chain of fragments). Line 1 = the hook, the last line = the payoff. `{pause=0.4}`-`{pause=0.6}` only
  before the payoff. Numbers and years spelled as spoken.
- **storyboard.json**: 8-10 shots `s01`…; each spoken shot's `words` = the exact script words it covers, in order,
  every word once (a line may split across shots); plus `draw`, `moves`, `change`. **s01 has `"title"`** (2-5
  lowercase words) and shows the hook's object big, already drawing on at frame 0. A new object or scale on every
  shot. The payoff gets its own shot, with `"hold": 0.4` on the shot before it. The last shot returns to s01's
  framing so the video loops.
- **episode.json**: hook, onScreenHook (the title), hookMechanic, visualHook, sendTo, caption (one lowercase line that
  invites the viewer's own answer), hashtags (2), `"endCard": false`.

## Animate
- `export default inkEpisode({ s01(c, rt) {...}, ... }, { noCaption: [...] })` from `components/episode.ts`.
- Draw only with the brush line: `ink`, `inkBox`, `inkCircle`, `wash` (`ink.ts`); screens with `phone`, `bubble`,
  `rule`, `waveform` (`screen.ts`); text with `writeOn` + `serif`/`hand` (`type.ts`). Hero outlines 12-14 px. New
  objects go in the episode file, drawn the same way (see the example's objects).
- **No characters.** People are their messages, names, handwriting or things. Cobalt only for the narrator's own words
  and acts; everyone else is ink; faded or lost things are `P.soft`.
- **Every beat is timed from the words**: `wordT(rt, 'worst', 0.3)` and `spoken(rt)`. Never fixed seconds.
- Captions are automatic, word by word. When a shot's spoken words ARE the picture (a message, a note), draw them with
  `wordLines(c, rt, lines, shotWords(rt), x, y, gap, hand(…))` and list the shot in `noCaption`.
- The picture lives in y 150-1250; text stays within x 60-900 below y 950 and never in the caption band.
- **sound.ts**: like the example's: `snd.write` on write-ons, a `snd.pluck` per shot, `snd.thump`/`rustle` on the
  break, one beat of silence then `snd.bell` under the payoff; cues on word times.

## Look check
s01 reads in one glance with its title; every word and object is readable; nothing overlaps or is cut by the caption
plate; the caption page reads as a phrase; **no character anywhere**; only ink, soft and cobalt.
