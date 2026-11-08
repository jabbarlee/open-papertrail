// Flat Grain toolkit, shared by every picture in this style: grain tiles, curves through measured or designed points,
// pen lines and stippled shadows. A point's third value of 1 marks a hard corner.
export interface View { s: number; ox: number; oy: number }
export type Pt = [number, number] | [number, number, 1];
export type XY = [number, number];
export type Ink = CanvasPattern | string;

// ---- grain -------------------------------------------------------------------------------------------------------
export const rng = (a: number) => () => {
  a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
export const T = 1024;

// Blurred white noise, wrapped so the tile repeats, normalised to sd 1. Blur matches the reference's ~1 px grain.
export function field(seed: number): Float32Array {
  const r = rng(seed), n = new Float32Array(T * T), m = new Float32Array(T * T);
  for (let i = 0; i < n.length; i++) n[i] = r() + r() + r() - 1.5;
  const k = [0, 0.25, 0.5, 0.25, 0];
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    let v = 0; for (let j = -2; j <= 2; j++) v += k[j + 2] * n[y * T + ((x + j + T) % T)]; m[y * T + x] = v;
  }
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    let v = 0; for (let j = -2; j <= 2; j++) v += k[j + 2] * m[((y + j + T) % T) * T + x]; n[y * T + x] = v;
  }
  let s = 0; for (const v of n) s += v * v; s = Math.sqrt(s / n.length);
  for (let i = 0; i < n.length; i++) n[i] /= s;
  return n;
}

export const rgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

export function tile(f: Float32Array, hex: string, sd: number, speck = 0): CanvasPattern {
  const cv = document.createElement('canvas'); cv.width = cv.height = T;
  const g = cv.getContext('2d')!, im = g.createImageData(T, T), [R, G, B] = rgb(hex);
  for (let i = 0; i < f.length; i++) {
    const v = f[i] * sd - (f[i] < -1.9 ? speck : 0);   // specks: ink that missed the paper's tooth
    im.data[i * 4] = R + v; im.data[i * 4 + 1] = G + v; im.data[i * 4 + 2] = B + v; im.data[i * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  return g.createPattern(cv, 'repeat')!;
}

// ---- lines -------------------------------------------------------------------------------------------------------
// Catmull-Rom through the points, broken at hard corners, sampled about every 2 units.
export function curve(p: Pt[], closed = true): XY[] {
  const n = p.length, out: XY[] = [], at = (i: number) => p[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const a = at(i), b = at(i + 1), pa = a[2] ? a : at(i - 1), nb = b[2] ? b : at(i + 2);
    const steps = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2));
    for (let k = 0; k < steps; k++) {
      const t = k / steps, t2 = t * t, t3 = t2 * t;
      const q = (u: 0 | 1) => 0.5 * (2 * a[u] + (b[u] - pa[u]) * t + (2 * pa[u] - 5 * a[u] + 4 * b[u] - nb[u]) * t2 + (3 * a[u] - pa[u] - 3 * b[u] + nb[u]) * t3);
      out.push([q(0), q(1)]);
    }
  }
  if (!closed) out.push([p[n - 1][0], p[n - 1][1]]);
  return out;
}

// A hand never holds a perfect edge: slow drift of a fraction of a unit.
const wob = (x: number, y: number, ph: number) => 0.22 * (Math.sin(x * 0.06 + y * 0.04 + ph) + 0.5 * Math.sin(x * 0.13 - y * 0.11 + ph * 2.1));
export const shake = (l: XY[], ph = 0, amp = 1): XY[] => l.map(([x, y]) => [x + amp * wob(x, y, ph), y + amp * wob(y, x, ph + 1.7)]);

export function tools(c: CanvasRenderingContext2D, v: View, W: number, H: number, black: string, noise: Float32Array, amp = 1, boil = 0) {
  const X = (x: number) => x * v.s + v.ox, Y = (y: number) => y * v.s + v.oy;
  const trace = (l: XY[]) => { c.beginPath(); l.forEach(([x, y], i) => i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y))); };
  const fill = (p: Pt[], ink: Ink, ph = 0) => { trace(shake(curve(p), ph + boil, amp)); c.closePath(); c.fillStyle = ink; c.fill(); };
  const edge = (p: Pt[], w: number, ph = 0, closed = true) => {
    trace(shake(curve(p, closed), ph + boil, amp)); if (closed) c.closePath();
    c.strokeStyle = black; c.lineWidth = w * v.s; c.lineJoin = c.lineCap = 'round'; c.stroke();
  };
  const part = (p: Pt[], ink: Ink, w: number, ph = 0) => { edge(p, w, ph); fill(p, ink, ph); };
  // A pen line whose width follows `ws` (evenly spaced along its length).
  const pen = (p: Pt[], ws: number[], ph = 0) => {
    const l = shake(curve(p, false), ph + boil, amp), L: XY[] = [], R: XY[] = [];
    l.forEach(([x, y], i) => {
      const a = l[Math.max(0, i - 1)], b = l[Math.min(l.length - 1, i + 1)], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const u = (i / (l.length - 1)) * (ws.length - 1), j = Math.min(ws.length - 2, Math.floor(u));
      const w = (ws[j] + (ws[j + 1] - ws[j]) * (u - j)) / 2, nx = -(b[1] - a[1]) / d, ny = (b[0] - a[0]) / d;
      L.push([x + nx * w, y + ny * w]); R.unshift([x - nx * w, y - ny * w]);
    });
    trace([...L, ...R]); c.closePath(); c.fillStyle = black; c.fill();
  };
  // A shadow that breaks into grain at its edges instead of ending on a line.
  const stipple = (p: Pt[], hex: string, blur: number, strength: number) => {
    const s = document.createElement('canvas'); s.width = W; s.height = H;
    const g = s.getContext('2d')!; g.filter = `blur(${blur * v.s}px)`; g.fillStyle = '#000'; g.beginPath();
    curve(p).forEach(([x, y], i) => i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))); g.closePath(); g.fill(); g.filter = 'none';
    const im = g.getImageData(0, 0, W, H), [R, G, B] = rgb(hex);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, a = im.data[i + 3] / 255;
      if (!a) continue;
      const on = noise[(y % T) * T + (x % T)] * 0.5 + 0.5 < a * 1.5;
      im.data[i] = R; im.data[i + 1] = G; im.data[i + 2] = B; im.data[i + 3] = on ? 255 * strength : 0;
    }
    g.putImageData(im, 0, 0); c.drawImage(s, 0, 0);
  };

  return { X, Y, trace, fill, edge, part, pen, stipple };
}
