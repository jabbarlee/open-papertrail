// Style-free helpers any pack may use: seeded randomness, easing, timing, and measured text.
// No colours, textures or shapes live here; those belong to a pack's design language.
import type { Runtime } from '../scene.ts';

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const inv = (a: number, b: number, v: number) => clamp((v - a) / (b - a));

export const ease = {
  linear: (t: number) => t,
  inOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  in: (t: number) => t * t * t,
  // Overshoot then settle, for things that land.
  back: (t: number) => { const s = 1.70158; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); },
  // Damped spring from 0 to 1.
  spring: (t: number, k = 9, d = 5) => 1 - Math.exp(-d * t) * Math.cos(k * t),
};

// Mulberry32: same seed, same sequence, so render(f) stays pure.
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const hash = (...n: number[]) => rng(n.reduce((h, v) => Math.imul(h ^ Math.round(v * 1000), 2654435761), 7))();

// Smooth 1D value noise in [-1, 1].
export function noise1(x: number, seed = 0): number {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash(i, seed) * 2 - 1, hash(i + 1, seed) * 2 - 1, u);
}

// Progress 0..1 of a window inside the shot, in seconds from the shot start.
export const within = (rt: Runtime, from: number, dur: number) => clamp((rt.local - from) / dur);

// Seconds since a spoken word started (negative before it). `i` is the shot-relative word index.
export function sinceWord(rt: Runtime, i: number): number {
  const w = rt.tl.words[rt.shot.firstWord + i];
  return w ? rt.t - w.start : -1;
}

// "Boil" on 2s: a value that changes every other frame, for hand-made line wobble.
export const boilSeed = (rt: Runtime, every = 2) => Math.floor(rt.f / every);

export type Pt = [number, number];

// Closed (or open) smooth path through points, using midpoint quadratics.
export function smoothPath(pts: Pt[], closed = true): Path2D {
  const p = new Path2D();
  const n = pts.length;
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  if (closed) {
    const s = mid(pts[n - 1], pts[0]);
    p.moveTo(s[0], s[1]);
    for (let i = 0; i < n; i++) { const m = mid(pts[i], pts[(i + 1) % n]); p.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
    p.closePath();
  } else {
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n - 1; i++) { const m = mid(pts[i], pts[i + 1]); p.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
    p.lineTo(pts[n - 1][0], pts[n - 1][1]);
  }
  return p;
}

// Points around an ellipse, optionally roughened with seeded jitter (radius fraction).
export function ellipsePts(cx: number, cy: number, rx: number, ry: number, n = 32, jitter = 0, seed = 1): Pt[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, k = 1 + (r() * 2 - 1) * jitter;
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k] as Pt;
  });
}

export interface TextOpts {
  font: string;            // family name
  size: number;            // px
  color: string;
  align?: CanvasTextAlign;
  weight?: string;
  maxWidth?: number;       // shrink to fit, down to minSize
  minSize?: number;
  lineHeight?: number;     // multiple of size, for \n-separated lines
  letterSpacing?: number;  // px
  world?: boolean;
}

// Draws text and records its box so QA can check margins and phone legibility.
export function drawText(c: CanvasRenderingContext2D, rt: Runtime, text: string, x: number, y: number, o: TextOpts): void {
  const lines = text.split('\n');
  let size = o.size;
  const set = () => { c.font = `${o.weight ?? '400'} ${size}px "${o.font}"`; (c as any).letterSpacing = `${o.letterSpacing ?? 0}px`; };
  set();
  if (o.maxWidth) {
    while (size > (o.minSize ?? 0) && Math.max(...lines.map(l => c.measureText(l).width)) > o.maxWidth) { size -= 2; set(); }
  }
  c.fillStyle = o.color;
  c.textAlign = o.align ?? 'left';
  c.textBaseline = 'alphabetic';
  const lh = size * (o.lineHeight ?? 1.1);
  lines.forEach((line, n) => {
    const ly = y + n * lh;
    c.fillText(line, x, ly);
    const m = c.measureText(line);
    // Map the box through the current transform so QA sees where it lands on screen.
    const tr = c.getTransform();
    const pts = [[x - m.actualBoundingBoxLeft, ly - m.actualBoundingBoxAscent], [x + m.actualBoundingBoxRight, ly + m.actualBoundingBoxDescent]]
      .map(([px, py]) => [tr.a * px + tr.c * py + tr.e, tr.b * px + tr.d * py + tr.f]);
    const scale = Math.hypot(tr.a, tr.b);
    if (c.globalAlpha > 0.05 && !o.world) {
      rt.text.push({
        text: line, size: size * scale,
        x0: Math.min(pts[0][0], pts[1][0]), y0: Math.min(pts[0][1], pts[1][1]),
        x1: Math.max(pts[0][0], pts[1][0]), y1: Math.max(pts[0][1], pts[1][1]),
      });
    }
  });
}
