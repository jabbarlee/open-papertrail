---
name: new-character
description: Designs a new recurring character for the painted style (a lead to replace Otto, or a person serving them) following the style's character rules - silhouette first, oval eyes with dot pupils, no nose, flat fills, one strong colour - as a cast/<name>.ts component with a character sheet (turnaround, expressions, poses) checked by eye. Use when the user wants their own character in painted videos.
---

# new-character

Read `styles/painted/DESIGN.md` ("Characters"), `components/README.md`, `components/cast/otto.ts` (the full lead with
views, poses, gaze, lids, mouths) and `components/cast/mae.ts` (a simpler server).

1. **Brief:** who they are in one line, what they wear, one thing that makes their silhouette unmistakable at
   thumbnail size, one strong colour. Never a real person or an existing character.
2. Write `styles/painted/components/cast/<name>.ts` on the `ink.ts` helpers (`shape`, `line`, `eyes`, `scribbleHair`,
   `limb`, `hand`), exporting the palette, an options interface and the draw function. Add a placement helper next to
   `ottoAt` in `components/episode.ts` and a line in `components/README.md`.
3. Sheet: copy `styles/painted/look/sheet/` to `styles/painted/look/<name>/`, swap Otto for the new character, and
   render `npm run studio -- stills styles/painted/look/<name> --at 0.5`. Open it. Check the silhouette as a black
   blob, the face rules, the proportions (~5 heads for adults), and that the line boils but fills don't shade.
4. Show the user the sheet; iterate. To make them the lead, mention it in `FORMAT.md` ("The series in one line").
