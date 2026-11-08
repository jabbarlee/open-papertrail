---
name: write
description: Turns a picked pitch or the user's own idea into an episode folder ready to voice - script.txt (the spoken lines with delivery notes), episode.json (hook, caption, hashtags) and, for most styles, storyboard.json (shots tied to the exact words) - following the style's FORMAT.md and MAKE.md. Use from /make, or when asked to write or rewrite a script.
---

# write

Input: a style and a pitch (or an idea from the user). Read `styles/<style>/FORMAT.md`, `VOICE.md` and `MAKE.md`, and
the example episode's files in `styles/<style>/examples/`. Follow `MAKE.md`'s "Write" section exactly; it holds the
word counts, line rules and storyboard shape for this style.

## Steps
1. `npm run studio -- new --style <style> --slug <slug> --title "<Title>"` creates
   `styles/<style>/episodes/<today>-<slug>/`. If the idea came from a pitch:
   `npm run studio -- gate <ep> --gate pitch --note "pitch <id>"`.
2. **script.txt**: one spoken line per row (`#` rows are comments). Delivery notes go in braces at the end of a line:
   - `{pause=0.6}` silence after the line, in seconds
   - `{say="eight fourteen"}` what the voice says when the caption should read differently ("8:14")
   - `{speaker="mia"}` a line shown on screen but never spoken (its words still get timings)
   Line 1 is the hook verbatim; the last spoken line is the payoff verbatim. Spell numbers as spoken.
3. **storyboard.json** (unless `MAKE.md` says the style doesn't use one): `{ "shots": [...] }`. Each shot:
   `id` (`s01`…), `words` (the exact script words it covers, in order, every spoken word exactly once across shots),
   `draw` (what we see), `moves` (what moves), `change` (what visibly changes on the cut into it). Wordless shots after
   the voice: `"words": ""` and `"seconds"`. Optional `title` on s01, `lead`/`hold` for cut timing.
4. **episode.json**: fill `hook`, `onScreenHook`, `hookMechanic`, `visualHook`, `caption`, `hashtags`, `sendTo`,
   `endCard` as `MAKE.md` says. Leave `gates` to the commands.
5. **sources.json**: `[]` if the script states no facts. Otherwise every claim with its checked source (shape in
   `styles/knife-paint/FORMAT.md`); search the web and confirm each one, reword or cut what you can't confirm.
6. Check it before handing it on: `npm run studio -- pace <ep> && npm run studio -- timeline <ep>` builds a timeline
   from estimated timings (it fails if the storyboard's words don't match the script). The length must sit inside
   `pack.json` `video.minSeconds`-`maxSeconds`.

## Read it aloud
Read the script from the top, literally, as a stranger hearing it once. Every sentence understood in one hearing; no
"wait, why…?"; no moral, tip or comfort line; the payoff lands with an edge. Fix it before showing anyone.
