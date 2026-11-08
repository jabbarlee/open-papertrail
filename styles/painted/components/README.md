# Painted: components

Canvas 2D inside the studio engine (`core/canvas/runtime.ts`). Look rules: `../DESIGN.md`.

| File | What it gives you |
|---|---|
| `noise.ts` | `rng`, `fbm`, `plate`, colour (`mix`, `shade`, `vary`), timing (`ramp`, `outCubic`, `outBack`, `blinkAt`, `onTwos`) |
| `paint.ts` | Painted sets: `paintRect`, `paintPoly`, `paint(path)`, `brushLine`, `shadowBlob` |
| `ink.ts` | Inked characters: `shape`, `line`, `limb`, `capsule`, `hand`, `eyes`, `scribbleHair`; shared state `S` (`inkw`, `boil`) |
| `props.ts` | Collage props (`notebookPaper`, `pen`, `drawProp`), `caption`, `FONTS` |
| `camera.ts` | `withCamera(c, t, dur, moves, draw)`: `push`, `punch`, `snap`, `drift`, `shake` |
| `overlay.ts` | `finish(c, f)`: the painted overlay, last in every render; `prepareOverlay(W, H)` in setup |
| `cast/otto.ts` | Otto, the lead: `otto(c, { view, pose, gaze, lid, mouth, bag })` |

## A shot, the pattern

```ts
render(c, rt) {
  S.boil = Math.floor(rt.f / 2);
  const t = onTwos(rt.local), dur = rt.shot.end - rt.shot.start;
  withCamera(c, t, dur, [{ kind: 'push', to: 1.05 }, { kind: 'punch', at: 1.6, to: 1.35, focus: [540, 700] }], () => {
    c.drawImage(layer('kitchen-bg', paintKitchen), 0, 0);        // painted once, cached
    c.save(); c.translate(560, 1400); c.scale(1.1, 1.1); S.inkw = 5 / 1.1;
    otto(c, { view: 'three', gaze: t < 1.2 ? [0.8, 0] : [0, 0], lid: blinkAt(t, 2.1) });
    c.restore();
  });
  caption(c, 'Sir,');
  finish(c, rt.f);
}
```

The worked example is the episode in `../examples/`. The character sheet is `../look/sheet/scene.ts`: copy it to
design a new character (turnaround, expressions, poses).
