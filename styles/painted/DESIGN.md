# Design: Painted (working title)

The look of this style, for **any** environment, cast or story. The shipped lead is **Otto**
(`components/cast/otto.ts`; render his sheet with `npm run studio -- stills styles/painted/look/sheet --at 0.5`).
Read this before drawing anything in this style;
in QA, flag anything that breaks it.

**In one line:** flat, thin-inked, deadpan characters standing in front of *painted* gouache sets, with a
"photographic" collage prop when the joke needs one, all under one painted overlay. Live-action sitcom framing.
It must never look like a cartoon: no shading on characters, no gradients, no glow, no bouncy motion.

## The four layers (each made a different way, that's the look)

| Layer | Made with | Rule |
|---|---|---|
| **1. Painted set** | `paint.ts`: `paintRect / paintPoly / brushLine / shadowBlob` | Gouache: a base colour, dry-brush bristle strokes in the surface's direction (planks vertical, floors horizontal), dark grime mottling, light wear, a few scratches and specks. **No ink lines in the set.** Edges and planks are painted brush lines. Muted, earthy, slightly dirty colours. |
| **2. Inked characters + near props** | `ink.ts`: `shape / line / eyes / scribbleHair / limb / hand` | Flat fills, **zero shading**, a thin black line (`#151317`, ~5 px at 1080 wide) that's slightly rough and **boils on 2s**. Foreground set pieces that characters touch (a counter, a table edge) are also inked. |
| **3. Collage prop** | `props.ts`: `notebookPaper / pen / drawProp` | The object the joke hangs on is "real": lit crumple, rules, torn edge, ballpoint gone over 2-3 times, soft cast shadow. Next to it, a flat drawn version (the real stamp sheet, the green bill). The material clash is the gag. One per episode, not more. |
| **4. Painted overlay** | `overlay.ts`: `finish(c, f)`, **last** in every render | Soft 1.4 px bleed, canvas tooth (soft-light), a brush-stroke layer that boils every 4 frames (soft-light), warm grade `#E9D3AE`, vignette, blacks lifted to warm `#221C17`, moving grain. It's what makes the frame read as painted rather than 2D. Never skip it. |

Captions are drawn **before** the overlay so they sit in the paint.

## Characters (any new character follows these)
- **Silhouette first:** each character has 1-2 shapes that read as a black blob at thumbnail size (Otto: tall
  flopped beanie + sleeves that swallow his hands; or, say, a huge round puffer with only eyes in the hood). Check the
  silhouette before the details.
- **Faces:** big white oval eyes with small dot pupils, eyes nearly touching. **No nose. No eyebrows. No cheeks.**
  A mouth only when it's acting (`flat`, `o`, `smile`, `frown`). Expression comes from pupils, lids (`lid` 0..1) and
  the mouth. One personal mark is allowed (Otto's tired under-eye lines).
- **Skin** `#E5E2D7` off-white for everyone . Hair = black scribble with white scratch highlights.
- **Clothes:** flat, muted, one strong colour per character. Texture only as thin lines (rib knit, corduroy, quilting).
- **Proportions:** lanky and a bit awkward, ~5 heads tall for adults. Long necks are fine. Hands are simple rounded
  blobs with one line for the thumb (or hidden in sleeves).
- **Acting is deadpan:** stiff, upright, still. Eyes do the work: a side-eye, a slow look up, a 2-drawing blink. Comedy
  is in the hold.
- New characters get a sheet like Otto's (`look/sheet/scene.ts`): turnaround, 6 expressions, 3 poses, palette.

## Sets (any environment)
- Wall / floor / one foreground surface, painted. Muted earthy palette, slightly dirty. Each set gets **one painted
  gag in the dressing** (a poster, a sign, a note) written in the set's hand: "We Deliver ...eventually. ...probably."
- Deep floors in wides: characters stand in the middle band, the bottom third stays floor (empty, painted).
- Painted contact shadows under feet (`shadowBlob`), never real lighting.
- Paint every static layer once per shot and cache it (the `layer()` pattern in `components/layers.ts`, see the example episode);
  only characters and moving props are drawn per frame.

## Palette (starting points, not a cage)
Sets: terracotta `#B25F3E`, rust wainscot `#7B3E2A`, olive-brass `#7C6E3E`, dark teal grime `#3D564D`, sage-grey
floor `#A39C84`, wood `#4B3423` / `#5A3920`, greige `#A6A590`, counter cream `#D6D3C6`.
Cast: Otto beanie `#2F4E4A`, sweater `#C4943A`, cords `#4A3F38`; Mae shirt `#E2D6BC`, apron `#9A4A2E`;
clerk vest `#7A3A35`. Ink `#151317`. Skin `#E5E2D7`.

## Type
- **Captions / dialogue:** Gaegu, ~80-112 px, chalky off-white, top-left with the first baseline at y ≥ 260 (the text
  must start below the platform's top tabs at 150 px, `core/platform.ts`), appear
  on a cut or a beat, no animation. Short: "Ma'am,", "It's a stamp."
- **Painted signage:** Caveat Brush (big), Patrick Hand (small caps lines). **Ballpoint on props:** Gaegu in pen blue.

## Shots and cutting
Shot grammar: **wide** (set + everyone, deep floor) → **top-down insert** of the prop →
**over-the-shoulder reaction MCU** (foreground shoulder/hood crops one side) → **reverse CU** → payoff insert.
- **Hard cuts** between shots. No dissolves, no wipes.
- Inside a shot, `camera.ts`:
  - `locked` is the default;
  - `push` = auto zoom (slow creep, 1.0 → 1.03-1.08 over the shot) for tension or a wide that needs life;
  - `punch` = punch-in, an instant jump tighter on the same angle (1.25-1.5×), on a line or a realisation;
  - `snap` = fast zoom with overshoot (0.2-0.3 s), for a sting;
  - `drift` = a slow pan to reveal something;
  - `shake` = a short impact (a slam, a stamp, a drop).
- Every cut lands on a beat (a look, a line, an action). Shots 1.5-4 s; hold longer on the deadpan.

## Animation
- The file is 30 fps (platform rule, QA fails anything else), but motion is stepped at **12 drawings a second**
  (`onTwos(rt.local)`), the hand-animated feel; line boil every 2 frames (`S.boil`).
- Blinks are 2 drawings (`blinkAt`). Moves ease out (`outCubic`); props slide in and stop, no bounce.
- Static painted layers don't boil; the overlay's brush layer boils every 4 frames.

## Don't
Shading or highlights on characters · gradients (except the overlay's vignette) · glow, bloom, lens flare · pure
black or pure white · noses, eyebrows, blush · rubber-hose or bouncy motion · more than one collage prop per scene ·
ink lines on painted backgrounds · cartoon colour (saturated primaries) · text boxes or caption backings.
