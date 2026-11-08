# Design: Knife Paint

An acrylic palette-knife painting on canvas, photographed: knifed walls with the primed ground breaking through in
dotted islands, a horizontal floor band, flat elongated figures in profile (flat skin, black hair, one fine line for
the eye), clothes in knife-painted folds and bands.

- Everything is painted with `components/paint.ts` passes: no flat vector fills left bare, no gradients, no glow.
- Moving things are their own sprites, so the paint moves with them. The wall never moves; the canvas weave and the
  light falloff go over the whole frame last (`studio.ts` finish).
- Figures: ~10 heads tall, profile facing right, deadpan. Hands are simple blobs.
- Captions: the narrator's line in Instrument Serif italic, dark plum-black on a cream knife smear, top-left, first
  baseline at y 290 (below the platform's top tabs, `core/platform.ts`).
- Motion on 12 drawings/s; camera slow pushes and a punch on reveals.
