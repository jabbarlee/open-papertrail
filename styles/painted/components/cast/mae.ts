// MAE, the barista. Tall, unbothered, a high black bun, cream shirt with rolled sleeves, a rust apron.
// Origin = between her feet; head centre at (0, -770). rHand / lHand: targets in her units (null = at her side).
import { type C, type P } from '../noise.ts';
import { INK, S, SKIN, ell, eyes, hand, limb, line, scribbleHair, shape, type Gaze } from '../ink.ts';

export const MAE = { shirt: '#E2D6BC', apron: '#9A4A2E', trousers: '#2F2C2A', shoe: '#2A2420' };

export interface MaeOpts { gaze?: Gaze; lid?: number; mouth?: 'none' | 'flat' | 'o'; rHand?: P | null; lHand?: P | null; seed?: number; legs?: boolean }

function arm(c: C, sh: P, target: P, side: number, sd: number) {
  const elbow: P = [(sh[0] + target[0]) / 2 + side * 60, (sh[1] + target[1]) / 2 + 50];
  shape(c, limb([sh, elbow], 56, 50), MAE.shirt, sd);
  shape(c, limb([elbow, target], 40, 34), SKIN, sd + 1);
  return Math.atan2(target[1] - elbow[1], target[0] - elbow[0]);
}

export function mae(c: C, o: MaeOpts = {}): { rAng: number; lAng: number } {
  const sd = (o.seed ?? 0) * 1000 + 500, w = S.inkw;
  if (o.legs !== false) {
    shape(c, [[-56, -280], [-6, -280], [-10, -26], [-50, -26]], MAE.trousers, sd + 1);
    shape(c, [[6, -280], [56, -280], [50, -26], [10, -26]], MAE.trousers, sd + 2);
    shape(c, [[-66, 0], [-62, -28], [-8, -28], [-6, 0]], MAE.shoe, sd + 3);
    shape(c, [[6, 0], [8, -28], [62, -28], [66, 0]], MAE.shoe, sd + 4);
  }
  shape(c, [[-54, -668], [54, -668], [100, -640], [110, -440], [100, -270], [-100, -270], [-110, -440], [-100, -640]], MAE.shirt, sd + 5);
  // apron: bib + skirt + neck strap + pocket
  shape(c, [[-56, -600], [56, -600], [62, -470], [96, -440], [100, -250], [-100, -250], [-96, -440], [-62, -470]], MAE.apron, sd + 6);
  line(c, [[-50, -600], [-28, -668]], sd + 7, w * 0.8); line(c, [[50, -600], [28, -668]], sd + 8, w * 0.8);
  shape(c, [[-40, -420], [40, -420], [40, -360], [-40, -360]], MAE.apron, sd + 9, { w: w * 0.7 });
  let rAng = 0, lAng = 0;
  for (const [i, side, sh, tgt] of [[0, -1, [-96, -630], o.rHand], [1, 1, [96, -630], o.lHand]] as [number, number, P, P | null | undefined][]) {
    const target: P = tgt ?? [side * 118, -350];
    const a = arm(c, sh, target, side, sd + 10 + i * 5);
    hand(c, target[0], target[1], 0.9, a, SKIN, sd + 20 + i);
    if (i === 0) rAng = a; else lAng = a;
  }
  shape(c, [[-20, -708], [20, -708], [18, -664], [-18, -664]], SKIN, sd + 30);
  scribbleHair(c, ell(0, -884, 46, 40, 18), sd + 31, -1.0, false);   // the bun
  shape(c, ell(0, -770, 70, 84, 40).map(([x, y]) => [x * (y > -770 ? 1 - 0.13 * (y + 770) / 84 : 1), y] as P), SKIN, sd + 32);
  scribbleHair(c, [...ell(0, -790, 76, 74, 20, Math.PI * 1.02, Math.PI * 1.98), [60, -800], [20, -826], [-20, -822], [-62, -798]], sd + 33, -1.0, false);
  eyes(c, [-26, -768], [26, -770], 22, 15, o.gaze ?? [0, 0], sd + 34, o.lid ?? 0);
  if (o.mouth === 'flat') line(c, [[-10, -716], [10, -717]], sd + 36, w * 0.75);
  if (o.mouth === 'o') shape(c, ell(0, -714, 6, 8, 12), INK, sd + 37, { w: 2 });
  return { rAng, lAng };
}
