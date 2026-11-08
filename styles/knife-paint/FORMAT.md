# Format: Knife Paint

Narrated explainers, 40-50 s, in the look of an acrylic palette-knife painting. Look: `DESIGN.md`. Voice: `VOICE.md`.
Components: `components/README.md`. Worked example: `examples/`.

## The idea
One **true chain of events** from history, science or culture that starts with a specific, checkable, surprising fact
and ends somewhere the viewer would never guess. The bar: *a purple that cost 12,000 snails a gram → an 18-year-old's
failed malaria cure turns purple → a queen wears it → the dye company that followed sells aspirin → "He was trying to
make a medicine. Forty-three years later, his mistake did."*

- **Line 1 is the hook**: a specific fact about something on screen, with a number, a name or an object, said plainly
  and understood in one hearing. Never a question, never "did you know", never "you won't believe".
- Every line sells the next. Short sentences (aim ≤ 12 words), a new picture every line.
- **A fresh loop around 60-70%** ("But the colour was just the start.") before the first one feels finished.
- **The button recasts the start** in one dry line. Never a moral, never "and that's why…", never sweet.
- **End on something the viewer owns or uses today** (a pill, a drink, a colour in their clothes), not in a museum.
- **True.** Every fact is checkable; round only where the source rounds. `sources.json` lists each claim with its
  source before you export.
- 110-130 words; the narrator says everything.

## Dead zones
Death, war and atrocity as the hook; disease close-ups; politics and religion today; conspiracy; "scientists hate
this"; listicles; anything the components can't paint (screens full of text, crowds in motion, vehicles chasing,
maps with many labels).

## Buildable
3-6 places, each a backdrop palette; up to ~6 named figures across the episode (profile, elongated, flat skin); one
hero prop that carries the turn (a flask). Every shot has motion: a walk-in, a gesture, something falling, pouring,
blooming, unrolling.

## sources.json
```json
[{ "claim": "Perkin was 18", "verdict": "confirmed", "authors": "Garfield, S.", "year": 2000,
   "title": "Mauve", "outlet": "Faber & Faber", "url": "https://…", "note": "" }]
```
`verdict` is `confirmed`, `reworded` (the script now says what the source says) or `killed` (the claim is gone).
