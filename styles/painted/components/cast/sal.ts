// SAL, the barber. Older, tall, bald dome, grey side hair, a huge grey moustache that hides his mouth (all his
// acting is in the eyes). Pale blue tunic, sleeves rolled, a comb in the breast pocket. Origin = between his feet.
// rHand / lHand are targets in his own units (screen-left / screen-right hand); null = hanging at his side.
import { type C, type P } from '../noise.ts';
import { INK, S, SKIN, ell, eyes, hand, limb, line, shape, type Gaze } from '../ink.ts';

export const SAL = { tunic: '#B8C8D0', trousers: '#3A3836', grey: '#BDB9B0', shoe: '#2A2420' };

export interface SalOpts { gaze?: Gaze; lid?: number; rHand?: P | null; lHand?: P | null; scissors?: number | null; seed?: number; legs?: boolean; rAng?: number }

function arm(c: C, sh: P, target: P, side: number, sd: number) {
  const mx = (sh[0] + target[0]) / 2, my = (sh[1] + target[1]) / 2;
  const elbow: P = [mx + side * 70, my + 60];
  shape(c, limb([sh, elbow], 64, 58), SAL.tunic, sd);
  shape(c, limb([elbow, target], 46, 40), SKIN, sd + 1);
  return Math.atan2(target[1] - elbow[1], target[0] - elbow[0]);
}

export function sal(c: C, o: SalOpts = {}) {
  const sd = (o.seed ?? 0) * 1000 + 300, w = S.inkw;
  if (o.legs !== false) {
    shape(c, [[-70, -270], [-6, -270], [-12, -26], [-62, -26]], SAL.trousers, sd + 1);
    shape(c, [[6, -270], [70, -270], [62, -26], [12, -26]], SAL.trousers, sd + 2);
    shape(c, [[-84, 0], [-80, -30], [-10, -30], [-8, 0]], SAL.shoe, sd + 3);
    shape(c, [[8, 0], [10, -30], [80, -30], [84, 0]], SAL.shoe, sd + 4);
  }
  // tunic
  shape(c, [[-60, -672], [60, -672], [118, -640], [130, -440], [124, -250], [-124, -250], [-130, -440], [-118, -640]], SAL.tunic, sd + 5, { amp: 1.3 });
  shape(c, [[-46, -676], [46, -676], [40, -650], [-40, -650]], SAL.tunic, sd + 6, { w: w * 0.8 });
  line(c, [[0, -650], [0, -260]], sd + 7, w * 0.6);
  shape(c, [[30, -580], [86, -580], [86, -530], [30, -530]], SAL.tunic, sd + 8, { w: w * 0.7 });
  shape(c, [[40, -612], [52, -612], [52, -560], [40, -560]], '#2B2B2E', sd + 9, { w: w * 0.6 });   // comb in the pocket
  // arms
  for (const [i, side, sh, tgt] of [[0, -1, [-110, -630], o.rHand], [1, 1, [110, -630], o.lHand]] as [number, number, P, P | null | undefined][]) {
    const target: P = tgt ?? [side * 132, -330];
    const ang0 = arm(c, sh, target, side, sd + 10 + i * 5);
    const ang = i === 0 && o.rAng != null ? o.rAng : ang0;
    hand(c, target[0], target[1], 1.0, ang, SKIN, sd + 20 + i);
    if (i === 0 && o.scissors != null) scissors(c, target, ang, o.scissors, sd + 30);
  }
  // head: neck, bald dome, grey side hair, moustache
  shape(c, [[-24, -712], [24, -712], [22, -668], [-22, -668]], SKIN, sd + 40);
  shape(c, ell(0, -770, 78, 92, 40).map(([x, y]) => [x * (y > -770 ? 1 - 0.12 * (y + 770) / 92 : 1), y] as P), SKIN, sd + 41);
  for (const s of [-1, 1]) shape(c, [[s * 64, -800], [s * 88, -790], [s * 92, -748], [s * 76, -726], [s * 68, -760]], SAL.grey, sd + 42 + s, { amp: 2 });
  line(c, [[-20, -838], [-4, -842]], sd + 45, w * 0.5);   // a single forehead line
  eyes(c, [-28, -782], [28, -784], 22, 15, o.gaze ?? [0, 0], sd + 46, o.lid ?? 0);
  shape(c, [[-70, -722], [-40, -748], [0, -744], [40, -748], [70, -722], [56, -712], [30, -726], [0, -722], [-30, -726], [-56, -712]], SAL.grey, sd + 50, { amp: 1.6 });
}

// Barber scissors held at p, pointing along ang; open 0..1.
export function scissors(c: C, p: P, ang: number, open: number, sd: number) {
  c.save(); c.translate(p[0], p[1]); c.rotate(ang);
  const a = 0.06 + open * 0.28, w = S.inkw;
  for (const s of [-1, 1]) {
    c.save(); c.rotate(s * a);
    shape(c, [[20, -5], [120, -2], [124, 2], [20, 6]], '#C9CCCE', sd + s, { w: w * 0.7 });
    shape(c, ell(6, s * 14, 13, 10, 14), null, sd + 3 + s, { w: w * 0.8 });
    c.restore();
  }
  c.fillStyle = INK; c.beginPath(); c.arc(20, 0, 3, 0, 7); c.fill();
  c.restore();
}
