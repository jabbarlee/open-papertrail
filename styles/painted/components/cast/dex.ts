// DEX, Otto's best friend. Short and round, a huge cloud of curly black hair, a rust-and-cream striped rugby shirt.
// Silhouette: the hair cloud. Sleeps anywhere, wakes up loud.
// dexOnSofa: slumped asleep (or just woken) under a blanket. Origin = his seat point; ~1 unit = 1 px at scale 1.
import { type C, type P } from '../noise.ts';
import { INK, S, SKIN, ell, eyes, line, scribbleHair, shape, type Gaze } from '../ink.ts';

export const DEX = { shirt: '#A65336', stripe: '#E3D6BC', blanket: '#7C8E9A', blanketStripe: '#D9CFB8' };

export interface DexOpts { awake?: number; gaze?: Gaze; mouth?: 'snore' | 'o' | 'shout'; seed?: number }

export function dexOnSofa(c: C, o: DexOpts = {}) {
  const sd = (o.seed ?? 0) * 1000, w = S.inkw, awake = o.awake ?? 0;
  const tilt = -0.42 * (1 - awake);           // head tipped back asleep, upright when awake
  const hx = -10 + awake * 10, hy = -250 + awake * -30;
  // shoulders / shirt (striped), mostly hidden by the blanket
  const shirt = shape(c, [[-120, -150], [-80, -196], [80, -196], [120, -150], [130, -40], [-130, -40]], DEX.shirt, sd + 1);
  c.save(); c.clip(shirt);
  for (let y = -190; y < -40; y += 34) { c.fillStyle = DEX.stripe; c.fillRect(-140, y, 280, 14); }
  c.restore(); shape(c, [[-120, -150], [-80, -196], [80, -196], [120, -150], [130, -40], [-130, -40]], null, sd + 1);
  // neck + head
  shape(c, [[-18, -214], [18, -214], [16, -186], [-16, -186]], SKIN, sd + 2);
  c.save(); c.translate(hx, hy); c.rotate(tilt);
  scribbleHair(c, ell(0, -40, 118, 96, 26).map(([x, y], i) => [x + (i % 2 ? 10 : -4) * Math.sign(x), y + (i % 2 ? -10 : 4)] as P), sd + 3, -0.9);
  shape(c, ell(0, 4, 66, 72, 34).map(([x, y]) => [x * (y > 0 ? 1 - 0.1 * y / 72 : 1), y] as P), SKIN, sd + 4);
  scribbleHair(c, [[-62, -30], [-40, -70], [0, -84], [40, -70], [62, -30], [30, -46], [0, -40], [-30, -48]], sd + 5, -0.9, false);
  if (awake < 0.5) {
    line(c, [[-40, 2], [-26, 8], [-12, 2]], sd + 6, w * 0.8);
    line(c, [[12, 2], [26, 8], [40, 2]], sd + 7, w * 0.8);
  } else {
    eyes(c, [-24, 0], [24, -2], 26, 24, o.gaze ?? [0.6, 0], sd + 8);
  }
  const m = o.mouth ?? 'snore';
  if (m === 'snore') shape(c, ell(0, 42, 10, 8, 14), INK, sd + 9, { w: 2 });
  if (m === 'o') shape(c, ell(0, 44, 9, 11, 14), INK, sd + 9, { w: 2 });
  if (m === 'shout') shape(c, ell(0, 44, 18, 16, 16), INK, sd + 9, { w: 2 });
  c.restore();
}

// The blanket over Dex's lap: drawn after him so it covers his body.
export function blanket(c: C, seed = 0) {
  const sd = seed * 1000 + 50;
  const b = shape(c, [[-150, -120], [-60, -150], [60, -146], [150, -116], [190, 60], [150, 140], [-160, 150], [-200, 50]], DEX.blanket, sd);
  c.save(); c.clip(b);
  for (const x of [-120, -40, 40, 120]) line(c, [[x - 10, -160], [x + 6, 0], [x - 4, 160]], sd + x, S.inkw * 0.5, '#2F3A42');
  c.fillStyle = DEX.blanketStripe; for (const y of [-60, 50]) c.fillRect(-220, y, 440, 16);
  c.restore();
  shape(c, [[-150, -120], [-60, -150], [60, -146], [150, -116], [190, 60], [150, 140], [-160, 150], [-200, 50]], null, sd);
}
