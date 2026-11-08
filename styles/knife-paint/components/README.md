# Knife Paint components

Everything is drawn in frame pixels (1080 x 1920) and painted, never left as flat vector.

| File | What |
|---|---|
| `paint.ts` | The paint engine. `Weave` (canvas threads), `Layer.finish` (dry brush: paint sticks only where the load beats the weave; impasto relief; `soften`, `patch`), marks: `knife`, `ribbon` (solid film along a path), `stroke` (bristle tracks), `line` (crisp tapered fine brush), `fillStrokes`. |
| `studio.ts` | The episode shell. `knifeEpisode({ s01(f) {...} })`; `sprite(key, box, paint)` caches finished paint per page; `Sprite.pass(opts, draw)` / `.raw()` / `.put(c, {dx, dy, s, rot, px, py, alpha})`; `camera(c, z, fx, fy)`; `outCubic`, `inOut`, `ease`. The frame `f` has `c, t (on 12 drawings/s), dur, p, word(w, fallback), drawing`. Captions (serif italic on a cream knife smear) and the weave + light finish are automatic. |
| `sets.ts` | `backdrop(name)`: `gallery` (blue-grey over cream, sand floor), `works`, `rome`, `lab`, `insert`, `street`, `palace`, `yard`, `pharmacy`, `apothecary`, `studio`, `garden`, `colourshop`, `office`, `church`, `kitchen`. Add a palette to `SETS` for a new place. `shadow(key, cx, cy, w)`. |
| `cast.ts` | Articulated figures (body + head + near arm sprites). `lady(key, x, feetY, s, {pal, cut: mermaid/aline/crinoline, skin, hair, puff, crown, veil, flip})`, `man(key, x, feetY, s, {pal, skin, hair, toga, trousers, wreath, helmet, flip})`. `drawFig(c, F, {dx, dy, arm, head, lean, alpha, scale})` (arm: radians, negative swings forward; -1.5 is level, -2.3 raised), `handAt(F, pose)` to put a prop in the hand, `walk(t, t0, t1, dx0, dx1)`, `idle(t, seed)`. Palettes `CLOTH`, `SKINS`, `HAIRS`. |
| `props.ts` | `shell`, `vat`, `wisp` (steam, smoke, stink), `flaskGlass` + `liquid`, `bottle` (with a painted label), `cloth`, `bench`, `lamp` + `flame`, `factory`, `dyeTub`, `shelves`, `counter`, `box`. |

Rules: every figure moves (at least `idle`; a walk-in, a gesture, a look on the beat that matters). Moving things are
their own sprites, so the paint moves with them. Time every beat with `f.word('word', fallback)`.
The worked example is the episode in `../examples/`.
