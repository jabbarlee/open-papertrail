// The brush-pen line: tapered ends, a swell in the middle, a wobble that boils on 2s,
// and a draw-on `progress` so lines are written in rather than cut in.
import { noise1, type Pt } from '../../../core/canvas/kit.ts';
import { P } from './palette.ts';

// Catmull-Rom resample so a few control points become a smooth stroke.
export function spline(pts: Pt[], per = 14): Pt[] {
  if (pts.length < 2) return pts;
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2
        + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)) as Pt);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

export interface InkOpts { width?: number; seed?: number; color?: string; progress?: number; per?: number }

export function ink(c: CanvasRenderingContext2D, f: number, ctrl: Pt[], o: InkOpts = {}): void {
  const progress = o.progress ?? 1;
  if (progress <= 0) return;
  const width = o.width ?? 10, seed = o.seed ?? 1;
  const pts = spline(ctrl, o.per ?? 14);
  const n = Math.max(2, Math.round(pts.length * Math.min(1, progress)));
  const boil = Math.floor(f / 2) * 13.7;
  const L: Pt[] = [], R: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    // Taper against the drawn length, so a half-drawn line still has a nib-shaped tip.
    const t = i / (n - 1);
    const taper = Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.98 + 0.01)), 0.45);
    const w = width * (0.25 + 0.75 * taper) * (0.85 + 0.3 * noise1(i * 0.15, seed)) / 2;
    const wob = noise1(i * 0.2 + boil, seed + 9) * 1.3;
    const x = pts[i][0] + (-dy / len) * wob, y = pts[i][1] + (dx / len) * wob;
    L.push([x - dy / len * w, y + dx / len * w]);
    R.push([x + dy / len * w, y - dx / len * w]);
  }
  c.fillStyle = o.color ?? P.ink;
  c.beginPath();
  L.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  for (let i = R.length - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]);
  c.closePath();
  c.fill();
}

// A hand-drawn circle (open slightly where the pen lifts).
export function inkCircle(c: CanvasRenderingContext2D, f: number, x: number, y: number, r: number, o: InkOpts = {}): void {
  const pts: Pt[] = Array.from({ length: 13 }, (_, i) => {
    const a = -Math.PI / 2 + (i / 12) * Math.PI * 2.08;
    return [x + Math.cos(a) * r, y + Math.sin(a) * r];
  });
  ink(c, f, pts, { per: 8, ...o });
}

// A rounded, hand-drawn box.
export function inkBox(c: CanvasRenderingContext2D, f: number, x: number, y: number, w: number, h: number, o: InkOpts = {}): void {
  const r = Math.min(28, w / 4, h / 4);
  ink(c, f, [[x + r, y + 2], [x + w - r, y], [x + w, y + r], [x + w + 2, y + h - r], [x + w - r, y + h], [x + r, y + h + 2], [x, y + h - r], [x - 1, y + r], [x + r + 6, y + 1]],
    { per: 10, ...o });
}

export function wash(c: CanvasRenderingContext2D, path: Path2D, alpha = 1): void {
  c.save(); c.globalAlpha *= alpha; c.fillStyle = P.cobaltWash; c.fill(path); c.restore();
}
