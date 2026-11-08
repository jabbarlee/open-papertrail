// Characters and foreground props are INKED: flat fills inside a thin, slightly rough black line that boils on 2s.
import { hash2, rng, type C, type P } from './noise.ts';

export const INK = '#151317';
export const SKIN = '#E5E2D7';

// Shared state. inkw = line width in the CURRENT transform's units: set it to (screen px) / scale before drawing a
// scaled character so the line stays ~5 px on screen at 1080 wide. boil changes every 2 frames on animated layers;
// cached (static) layers are drawn with boil 0.
export const S = { inkw: 5, boil: 0 };

export function jitter(pts: P[], closed: boolean, seed: number, amp = 1.2, step = 14): P[] {
  const out: P[] = []; const m = closed ? pts.length : pts.length - 1;
  let k = 0;
  for (let i = 0; i < m; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    const L = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.round(L / step));
    const nx = -(y2 - y1) / (L || 1), ny = (x2 - x1) / (L || 1);
    for (let j = 0; j < n; j++) {
      const t = j / n, d = (hash2(k++, seed + S.boil * 7919, 5) - 0.5) * 2 * amp;
      out.push([x1 + (x2 - x1) * t + nx * d, y1 + (y2 - y1) * t + ny * d]);
    }
  }
  if (!closed) out.push(pts[pts.length - 1]);
  return out;
}
export function curve(pts: P[], closed = true): Path2D {
  const p = new Path2D(), n = pts.length;
  if (!closed) {
    p.moveTo(...pts[0]);
    for (let i = 1; i < n - 1; i++) p.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    p.lineTo(...pts[n - 1]); return p;
  }
  const mid = (i: number): P => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
  p.moveTo(...mid(0));
  for (let i = 1; i <= n; i++) { const m = mid(i); p.quadraticCurveTo(pts[i % n][0], pts[i % n][1], m[0], m[1]); }
  p.closePath(); return p;
}
export function ell(cx: number, cy: number, rx: number, ry: number, n = 36, a0 = 0, a1 = Math.PI * 2, rot = 0): P[] {
  const out: P[] = []; const full = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6;
  for (let i = 0; i < (full ? n : n + 1); i++) {
    const a = a0 + (a1 - a0) * i / n, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    out.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return out;
}
export function ink(c: C, path: Path2D, w = S.inkw, color = INK) {
  c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = color;
  c.lineWidth = w; c.stroke(path);
  c.lineWidth = w * 0.55; c.globalAlpha = 0.6; c.translate(0.7, -0.5); c.stroke(path); c.translate(-0.7, 0.5); c.globalAlpha = 1;
}
export function shape(c: C, pts: P[], fill: string | null, seed: number, o: { closed?: boolean; w?: number; amp?: number; noInk?: boolean } = {}) {
  const closed = o.closed ?? true;
  const path = curve(jitter(pts, closed, seed, o.amp ?? 1.1), closed);
  if (fill) { c.fillStyle = fill; c.fill(path); }
  if (!o.noInk) ink(c, path, o.w ?? S.inkw);
  return path;
}
export function line(c: C, pts: P[], seed: number, w = S.inkw, color = INK) { ink(c, curve(jitter(pts, false, seed, 0.9), false), w, color); }
export function capsule(a: P, b: P, w: number): P[] {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  return [...ell(b[0], b[1], w / 2, w / 2, 10, ang - Math.PI / 2, ang + Math.PI / 2), ...ell(a[0], a[1], w / 2, w / 2, 10, ang + Math.PI / 2, ang + Math.PI * 1.5)];
}
// One outline for a bent limb (shoulder → elbow → wrist), so there's no seam at the elbow.
export function limb(pts: P[], w0: number, w1 = w0): P[] {
  const L: P[] = [], R: P[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), w = (w0 + (w1 - w0) * i / (pts.length - 1)) / 2;
    L.push([pts[i][0] - Math.sin(ang) * w, pts[i][1] + Math.cos(ang) * w]);
    R.push([pts[i][0] + Math.sin(ang) * w, pts[i][1] - Math.cos(ang) * w]);
  }
  return [...L, ...R.reverse()];
}
export function hand(c: C, x: number, y: number, s: number, ang: number, fill = SKIN, seed = 1) {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  const w = S.inkw; S.inkw = w / s;
  shape(c, [[-26, -22], [10, -26], [30, -14], [34, 4], [26, 22], [-4, 26], [-26, 20]], fill, seed);
  line(c, [[6, -8], [26, -16]], seed + 1, S.inkw * 0.6);
  S.inkw = w; c.restore();
}

export type Gaze = [number, number];
// Big white ovals, dot pupils. lid 0..1 closes from the top (1 = blink) in lidColor.
export function eyes(c: C, l: P, r: P, rx: number, ry: number, gaze: Gaze, seed: number, lid = 0, lidColor = SKIN) {
  for (const [i, [x, y]] of [l, r].entries()) {
    const p = shape(c, ell(x, y, rx, ry, 28), '#F5F3EE', seed + i, { w: S.inkw * 0.85, amp: 0.6 });
    c.save(); c.clip(p);
    c.fillStyle = INK; c.beginPath(); c.arc(x + gaze[0] * rx * 0.55, y + gaze[1] * ry * 0.5, Math.max(4, rx * 0.2), 0, 7); c.fill();
    if (lid > 0) {
      c.fillStyle = lidColor; c.fillRect(x - rx - 4, y - ry - 4, rx * 2 + 8, ry * 2 * lid + 4);
      line(c, [[x - rx, y - ry + ry * 2 * lid], [x + rx, y - ry + ry * 2 * lid]], seed + 9, S.inkw * 0.8);
    }
    c.restore();
    if (lid > 0) ink(c, p, S.inkw * 0.85);
  }
}

// Black scribble hair with white scratch highlights.
export function scribbleHair(c: C, pts: P[], seed: number, scratchAng = -1.0, flicks = true) {
  const r = rng(seed);
  const path = shape(c, pts, '#151318', seed, { amp: 3 });
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  if (flicks) for (let i = 0; i < pts.length; i += 2) {
    const [x, y] = pts[i];
    const a = Math.atan2(y - cy, x - cx) + (r() - 0.5) * 0.6, l = 10 + r() * 22;
    line(c, [[x - Math.cos(a) * 8, y - Math.sin(a) * 8], [x + Math.cos(a) * l, y + Math.sin(a) * l]], seed + i, S.inkw * 0.7);
  }
  c.save(); c.clip(path);
  let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
  for (const [x, y] of pts) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
  const n = Math.round((maxx - minx) * (maxy - miny) / 260);
  c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = minx + r() * (maxx - minx), y = miny + r() * (maxy - miny), a = scratchAng + (r() - 0.5) * 0.5, l = 6 + r() * 16;
    c.strokeStyle = `rgba(232,230,238,${0.45 + r() * 0.45})`; c.lineWidth = 1.2 + r() * 1.6;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
  }
  c.restore();
}
