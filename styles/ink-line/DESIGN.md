# Design: Ink Line

The ink-line look, chosen 2026-10-18 for the old pack `brain-did-that` (direction B), revived for storytelling
**without characters**. No other pack may reuse its palette, line or type.

## The idea in one line
A single brush-pen line on bone paper draws the world of the story. **Cobalt is the only colour, and it only ever
means what's going on inside the narrator**: what they think, want, hide or realise.

## Palette (`components/palette.ts`)
| Token | Hex | Role |
|---|---|---|
| paper | `#F2EEE4` | the ground, always textured paper, never a flat fill |
| ink | `#151515` | every outline, the world, other people's words |
| soft | `#B9B2A3` | things fading, old, unsent or lost |
| cobalt | `#2741E0` | the narrator's own thoughts and words |
| cobaltWash | `rgba(39,65,224,0.14)` | highlighter behind cobalt things, "inside me" areas |

No other colours, no gradients except the paper's mottling, no black fills larger than a dot.

## No characters
Never draw a face, a figure, a stick person or a mascot. People appear only as **what they leave behind**: a
message bubble, handwriting, a name on a screen, a mug, keys on a hook, a coat sleeve or a hand entering from the
frame edge at most. The objects are the cast.

## Texture and line
- Paper baked once (`paper.ts`); grain multiplied at 0.08, cycled on 2s. Lines boil every 2 frames.
- Everything is drawn with `ink()` (`ink.ts`): tapered, swelling, wobbling. Hero outlines 12-14 px, secondary
  7-9 px, detail 4-6 px. Lines **draw on** when they enter (6-12 frames, ease out); they are never cut in.
- Fills: only `cobaltWash`. Shapes are open lines.

## Type (`type.ts`)
| Use | Font |
|---|---|
| Captions and titles | **Instrument Serif** 400, 100-120 px, lowercase; the narrator's own words in cobalt |
| Handwriting, messages, notes | **Kalam** 700, 54-64 px; ink for others, cobalt for the narrator |

Text writes on left to right (0.25-0.4 s), timed to its spoken word.

## Composition and motion (9:16)
- Picture fills y 150-1250; captions in the caption band below (`caption.ts`), the picture fading into paper above it.
- Camera locked. Transitions are motivated by the line: a line that keeps going becomes the next object, a zoom
  through a shape into the next shot, a scale change (whole object -> one detail -> whole room of objects).
- `ease.out` for entries, `ease.back` for landings, holds of 6+ frames after a landing.

## Sound (`sound.ts`)
Sparse, D-major-ish: pencil scratch on every write-on, a soft pluck on reveals, a paper rustle on scale changes, a
low bell on the turn, one beat of silence before the payoff. Nothing busy under the voice.
