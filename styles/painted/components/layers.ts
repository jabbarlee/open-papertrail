// Static painted layers are painted once and reused every frame (painting a set per frame is far too slow,
// and real painted backgrounds don't boil anyway). Drawn with boil 0.
import { S } from './ink.ts';
import type { C } from './noise.ts';

const cache = new Map<string, HTMLCanvasElement>();
export function layer(key: string, W: number, H: number, fn: (g: C) => void): HTMLCanvasElement {
  let cv = cache.get(key);
  if (!cv) {
    cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const b = S.boil, w = S.inkw; S.boil = 0;
    fn(cv.getContext('2d')!);
    S.boil = b; S.inkw = w;
    cache.set(key, cv);
  }
  return cv;
}
