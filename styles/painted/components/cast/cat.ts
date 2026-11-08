// OTTO THE CAT: the café's cat. Enormous, orange, unbothered. Same face rules as everyone: white oval eyes, dot pupils.
// catSide: side view facing right, origin = ground under his middle. phase drives the walk; head: 0 up, 1 down (drinking).
// catFront: sitting, facing camera.
import { type C, type P } from '../noise.ts';
import { INK, S, ell, eyes, limb, line, shape, type Gaze } from '../ink.ts';

export const CAT = { fur: '#D2792F', dark: '#A85A22', light: '#EBC48F' };

export interface CatOpts { phase?: number; head?: number; gaze?: Gaze; lid?: number; seed?: number }

export function catSide(c: C, o: CatOpts = {}) {
  const sd = (o.seed ?? 0) * 1000 + 700, w = S.inkw, ph = o.phase ?? 0, hd = o.head ?? 0;
  const sw = Math.sin(ph) * 16;
  // far legs, tail, body, near legs
  for (const [x, k] of [[-70, 1], [80, -1]] as [number, number][]) shape(c, [[x - 14 + sw * k, -70], [x + 14 + sw * k, -70], [x + 16 + sw * k * 1.4, 0], [x - 16 + sw * k * 1.4, 0]], CAT.dark, sd + x);
  shape(c, limb([[-150, -110], [-215, -190], [-200, -290], [-160, -310]], 34, 26), CAT.fur, sd + 1);
  const body = shape(c, ell(0, -125, 165, 88, 40), CAT.fur, sd + 2, { amp: 1.4 });
  c.save(); c.clip(body);
  for (const x of [-100, -50, 0, 50]) line(c, [[x, -215], [x + 12, -170], [x + 4, -140]], sd + 3 + x, w * 0.7);
  c.restore();
  for (const [x, k] of [[-100, -1], [50, 1]] as [number, number][]) shape(c, [[x - 15 + sw * k, -60], [x + 15 + sw * k, -60], [x + 17 + sw * k * 1.4, 0], [x - 17 + sw * k * 1.4, 0]], CAT.fur, sd + 10 + x);
  // head: lowers toward the bowl as hd → 1
  const hx = 150 + 40 * hd, hy = -175 + 120 * hd, rot = 0.5 * hd;
  c.save(); c.translate(hx, hy); c.rotate(rot);
  shape(c, [[-46, -40], [-30, -98], [-6, -52]], CAT.fur, sd + 20);
  shape(c, [[4, -56], [32, -102], [44, -40]], CAT.fur, sd + 21);
  shape(c, ell(0, 0, 74, 64, 32), CAT.fur, sd + 22);
  shape(c, ell(30, 26, 34, 22, 20), CAT.light, sd + 23, { w: w * 0.7 });
  eyes(c, [-6, -10], [34, -14], 18, 20, o.gaze ?? [0.6, 0], sd + 24, o.lid ?? 0, CAT.fur);
  shape(c, [[52, 12], [64, 12], [58, 22]], '#3A2420', sd + 26, { w: 2 });
  for (const dy of [-6, 6]) line(c, [[60, 26 + dy], [110, 20 + dy * 2.5]], sd + 27 + dy, w * 0.45);
  c.restore();
}

export function catFront(c: C, o: CatOpts = {}) {
  const sd = (o.seed ?? 0) * 1000 + 760, w = S.inkw;
  shape(c, limb([[80, -30], [170, -40], [190, -120], [160, -170]], 32, 24), CAT.fur, sd + 1);
  const body = shape(c, ell(0, -130, 120, 132, 36), CAT.fur, sd + 2, { amp: 1.4 });
  c.save(); c.clip(body);
  shape(c, ell(0, -100, 60, 90, 24), CAT.light, sd + 3, { w: w * 0.6 });
  c.restore();
  for (const x of [-44, 44]) shape(c, ell(x, -12, 34, 18, 16), CAT.fur, sd + 4 + x);
  shape(c, [[-70, -300], [-58, -372], [-20, -320]], CAT.fur, sd + 6);
  shape(c, [[20, -320], [58, -372], [70, -300]], CAT.fur, sd + 7);
  shape(c, ell(0, -280, 92, 78, 34), CAT.fur, sd + 8);
  for (const x of [-60, 60]) line(c, [[x * 0.5, -350], [x * 0.4, -330]], sd + 9 + x, w * 0.6);
  eyes(c, [-32, -290], [32, -292], 22, 22, o.gaze ?? [0, 0], sd + 10, o.lid ?? 0, CAT.fur);
  shape(c, [[-8, -256], [8, -256], [0, -246]], '#3A2420', sd + 12, { w: 2 });
  for (const s of [-1, 1]) for (const dy of [-6, 6]) line(c, [[s * 30, -246 + dy], [s * 96, -252 + dy * 2.5]], sd + 13 + s * 3 + dy, w * 0.45);
  void INK;
}
