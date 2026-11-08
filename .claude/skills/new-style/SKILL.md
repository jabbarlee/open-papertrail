---
name: new-style
description: Creates a new visual style for the engine from the user's description or reference images - a styles/<id>/ folder with pack.json, FORMAT.md, DESIGN.md, VOICE.md, MAKE.md, components and fonts - then proves it with a look test and one short example episode. Use when the user wants their own look, format or series ("make a new style", "I want videos that look like this").
---

# new-style

Look at how the four shipped styles are built before designing a fifth: `styles/ink-line/` is the smallest (brush
line on paper), `styles/painted/` the most layered (painted sets, inked characters, a painted overlay).

## 1. Brief
Get, in at most two questions: what the videos are about (the format: who speaks, how long, what an episode is) and
how they look (references, adjectives, palette). If the user shared images, describe the rules that make that look
what it is (shapes, line, colour count, light, texture, type) and confirm them. Be honest about the limit: everything
is drawn in code on a canvas, so flat, graphic, painterly and textured looks work well; photoreal or detailed
painted illustration doesn't. Say so before building.

## 2. The folder
`styles/<id>/` with:
- `pack.json`: copy one and change `id`, `name`, `video` lengths, `voice` (a voice from `voices/`, `cut`, a Kokoro
  stand-in), `pace`, `tail`, `cutLeadSeconds`, `hashtags`.
- `FORMAT.md`: the story rules (idea, hook, structure, length, script, dead zones), in the shape of the others.
- `DESIGN.md`: the look as rules a stranger could follow, with the palette as hex values.
- `VOICE.md`, `MAKE.md` (the build recipe: write, animate, look check), `components/` (an episode shell that draws
  background, captions and finish on every frame, plus drawing helpers), `fonts/` (OFL fonts only, added to `FONTS.md`).

## 3. Look test
`styles/<id>/look/test/` with a `scene.ts` and a hand-written `timeline.json` (one or two shots, a few words), then
`npm run studio -- stills styles/<id>/look/test --at 0.5,2`. Show the user; iterate until they like it.

## 4. Prove it
Make one short episode with `/make <id>`, then copy its folder to `styles/<id>/examples/<slug>/` (sources only, plus
the MP4 into `examples/`) so `/make` has a reference to copy from.
