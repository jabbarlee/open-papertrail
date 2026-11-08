// Knife-paint engine: a procedural acrylic-on-canvas painting.
// Every surface is painted in passes on its own Layer. A pass is drawn with ordinary canvas strokes (many bristle
// streaks per stroke), then `Layer.finish` turns it into paint: the paint only sticks where the stroke carried enough
// load for the canvas weave under it (dry brush: thin paint catches only the thread peaks, so the ground shows through
// in dots), and the stacked paint thickness is lit from the top left (impasto ridges).
// Series code draws in frame pixels (1080 x 1920); a Sprite's View offsets its own small canvas into the frame.

export type C = CanvasRenderingContext2D;
export type P = [number, number];

// ---------- randomness + noise ----------
export function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
export function hash2(x: number, y: number, s: number) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function vnoise(x: number, y: number, s: number) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x: number, y: number, s: number, o = 4) {
  let t = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < o; i++) { t += a * vnoise(x * f, y * f, s + i * 17); n += a; f *= 2.03; a *= 0.5; }
  return t / n;
}
export const clamp = (v: number, a = 0, b = 1) => v < a ? a : v > b ? b : v;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------- colour ----------
export type RGB = [number, number, number];
export const hx = (h: string): RGB => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) as RGB;
export const css = (c: RGB) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
export const mixc = (a: string, b: string, t: number): RGB => { const A = hx(a), B = hx(b); return A.map((v, i) => v + (B[i] - v) * t) as RGB; };
/** A colour near `h`, varied in lightness by +-amt (0..1) and a little in hue. */
export function vary(h: string, r: () => number, amt: number): string {
  const c = hx(h), d = (r() - 0.5) * 2 * amt * 255, w = (r() - 0.5) * amt * 40;
  return css([c[0] + d + w, c[1] + d, c[2] + d - w]);
}
export function pick<T>(r: () => number, xs: T[]): T { return xs[Math.floor(r() * xs.length)]; }

// ---------- view: ref coordinates -> output pixels ----------
export interface View { s: number; ox: number; oy: number }

// ---------- canvas weave ----------
/** Height of the primed canvas at every output pixel, 0..1. Plain weave: a grid of thread bumps, with slubs. */
export class Weave {
  h: Float32Array;
  shade: HTMLCanvasElement;   // grey relief image of the weave, used as a soft-light overlay on the final frame
  W: number; H: number;
  constructor(W: number, H: number, period = 4.6) {
    this.W = W; this.H = H;
    this.h = new Float32Array(W * H);
    const sh = document.createElement('canvas'); sh.width = W; sh.height = H;
    const g = sh.getContext('2d')!, img = g.createImageData(W, H), d = img.data;
    const k = (2 * Math.PI) / period;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        // the threads wander a little, and their thickness changes (slubs)
        const wx = x + (vnoise(y / 37, x / 300, 3) - 0.5) * 2.2, wy = y + (vnoise(x / 37, y / 300, 4) - 0.5) * 2.2;
        const sx = Math.sin(wx * k), sy = Math.sin(wy * k);
        const bump = sx * sy;                                  // +1 / -1 alternate: over / under crossings
        const slub = vnoise(x / 3, y / 60, 5) * 0.5 + vnoise(x / 60, y / 3, 6) * 0.5;
        const patch = fbm(x / 70, y / 70, 7, 3);               // where the priming is thicker the weave is shallower
        const v = 0.5 + 0.34 * bump * (0.6 + 0.4 * slub) + (patch - 0.5) * 0.5 + (hash2(x, y, 8) - 0.5) * 0.1;
        this.h[y * W + x] = clamp(v);
        // relief lighting of the weave, light from the top left: derivative of the bump
        const dx = Math.cos(wx * k) * sy, dy = sx * Math.cos(wy * k);
        const l = 128 + (-dx - dy) * 30 * (0.6 + 0.4 * slub) + (hash2(x, y, 9) - 0.5) * 18;
        const i = (y * W + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = l; d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    this.shade = sh;
  }
}

// ---------- layer ----------
let softC: HTMLCanvasElement | null = null;
function soft(w: number, h: number) {
  if (!softC || softC.width < w || softC.height < h) { softC = document.createElement('canvas'); softC.width = Math.max(w, softC?.width ?? 0); softC.height = Math.max(h, softC?.height ?? 0); }
  return softC;
}
export interface FinishOpts {
  dry: number;        // 0 = paint covers everything it touches, 1 = very dry brush (only thread peaks catch thin paint)
  relief?: number;    // impasto lighting strength
  opacity?: number;   // translucent paint (glazes)
  gain?: number;      // multiplies the stroke load before the weave test
  soften?: number;    // px of blur before the paint test (wet-into-wet blending of the stroke edges)
  patch?: number;     // 0..1: the paint film thins in irregular patches (knife work), so the weave shows in dotted islands
}

export class Layer {
  cv: HTMLCanvasElement; g: C;
  W: number; H: number; view: View;
  constructor(W: number, H: number, view: View) {
    this.W = W; this.H = H; this.view = view;
    this.cv = document.createElement('canvas'); this.cv.width = W; this.cv.height = H;
    this.g = this.cv.getContext('2d', { willReadFrequently: true })!;
    this.reset();
  }
  reset() {
    const g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.W, this.H);
    g.setTransform(this.view.s, 0, 0, this.view.s, this.view.ox, this.view.oy);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  /** Turn what was drawn into paint on canvas (see top of file). `box` is in ref coordinates. */
  finish(weave: Weave, o: FinishOpts, box?: [number, number, number, number]) {
    const { W, H, view } = this;
    let x0 = 0, y0 = 0, x1 = W, y1 = H;
    if (box) {
      x0 = Math.max(0, Math.floor(box[0] * view.s + view.ox) - 4); y0 = Math.max(0, Math.floor(box[1] * view.s + view.oy) - 4);
      x1 = Math.min(W, Math.ceil(box[2] * view.s + view.ox) + 4); y1 = Math.min(H, Math.ceil(box[3] * view.s + view.oy) + 4);
    }
    const w = x1 - x0, h = y1 - y0;
    if (w <= 2 || h <= 2) return;
    const g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (o.soften) {
      const tmp = soft(w, h), tg = tmp.getContext('2d')!;
      tg.clearRect(0, 0, w, h); tg.drawImage(this.cv, x0, y0, w, h, 0, 0, w, h);
      g.clearRect(x0, y0, w, h); g.filter = `blur(${o.soften}px)`; g.drawImage(tmp, 0, 0, w, h, x0, y0, w, h); g.filter = 'none';
    }
    const img = g.getImageData(x0, y0, w, h), d = img.data;
    const T = new Float32Array(w * h);
    const wW = weave.W, wH = weave.H, fx = Math.round(-view.ox), fy = Math.round(-view.oy);
    const dry = o.dry, gain = o.gain ?? 1.15, op = o.opacity ?? 1, rel = o.relief ?? 0.5, pt = o.patch ?? 0, sv = 1 / view.s;
    for (let y = 0; y < h; y++) {
      const row = (((y + y0 + fy) % wH + wH) % wH) * wW;
      for (let x = 0; x < w; x++) {
        const j = y * w + x, i = j * 4, a = d[i + 3] / 255;
        if (a === 0) continue;
        const wv = weave.h[row + (((x + x0 + fx) % wW) + wW) % wW];
        const pf = pt > 0 ? 1 - pt * 0.75 + pt * 0.95 * clamp(fbm((x + x0 + fx) * sv / 30, (y + y0 + fy) * sv / 22, 77, 3) * 1.6 - 0.3) : 1;
        const m = a * gain * pf - (1 - wv) * dry - (1 - dry) * 0.02;
        const cov = m <= -0.12 ? 0 : m >= 0.12 ? 1 : (m + 0.12) / 0.24;
        T[j] = cov * (0.35 + 0.65 * a);
        d[i + 3] = 255 * cov * op;
      }
    }
    if (rel > 0) {
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const j = y * w + x, i = j * 4;
          if (d[i + 3] === 0) continue;
          // N.L with light from the top left
          const s = ((T[j + 1] - T[j - 1]) + (T[j + w] - T[j - w])) * rel;
          const f = s > 0 ? 1 + s * 0.9 : 1 + s;
          d[i] = d[i] * f + (s > 0 ? s * 40 : 0); d[i + 1] = d[i + 1] * f + (s > 0 ? s * 40 : 0); d[i + 2] = d[i + 2] * f + (s > 0 ? s * 40 : 0);
        }
      }
    }
    g.putImageData(img, x0, y0);
    g.setTransform(view.s, 0, 0, view.s, view.ox, view.oy);
  }
}

// ---------- paths ----------
/** Catmull-Rom through the points, resampled every `step` px. */
export function smooth(pts: P[], step = 3, closed = false): P[] {
  const n = pts.length; if (n < 2) return pts.slice();
  const out: P[] = [];
  const get = (i: number) => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const m = Math.max(1, Math.ceil(len / step));
    for (let k = 0; k < m; k++) {
      const t = k / m, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}
/** A closed outline made organic: each vertex pushed in/out along its normal by noise. */
export function rough(pts: P[], amt: number, seed: number, freq = 0.05): P[] {
  const n = pts.length;
  return pts.map((p, i) => {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const d = (fbm(p[0] * freq, p[1] * freq, seed, 3) - 0.5) * 2 * amt + (hash2(i, 0, seed) - 0.5) * amt * 0.25;
    return [p[0] + nx * d, p[1] + ny * d];
  });
}
export function pathOf(g: C, pts: P[], closed = true) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  if (closed) g.closePath();
}
export function fillPoly(g: C, pts: P[], color: string) { pathOf(g, pts); g.fillStyle = color; g.fill(); }
export function inPoly(p: P, poly: P[]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}
export function bbox(pts: P[]): [number, number, number, number] {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  return [x0, y0, x1, y1];
}

// ---------- strokes ----------
export interface StrokeOpts {
  load?: number;          // paint alpha at the start, 0..1
  fade?: number;          // how much of the load is gone by the end (the brush runs dry)
  streaks?: number;       // bristle tracks across the width
  taper?: (u: number) => number;   // width profile along the stroke
  colorVar?: number;      // per-bristle lightness variation
  ragged?: number;        // how much single bristles wander off the edge
  coherence?: number;     // 0 = every bristle breaks on its own (brush), 1 = the whole stroke thins in patches (knife)
  seed?: number;
}
export const T_KNIFE = (u: number) => 0.85 + 0.15 * Math.sin(Math.PI * u);
export const T_BRUSH = (u: number) => Math.pow(Math.sin(Math.PI * clamp(u * 0.92 + 0.04)), 0.45);
export const T_TAIL = (u: number) => Math.pow(1 - u, 0.6) * Math.min(1, u * 8 + 0.3);
export const T_POINT = (u: number) => Math.pow(Math.sin(Math.PI * u), 0.7);

/** A bristle stroke along a path: `streaks` parallel tracks, each with its own load and colour, breaking up as the
 *  brush runs dry. The look of every mark in the painting comes from this one function. */
export function stroke(g: C, r: () => number, path: P[], width: number, color: string, o: StrokeOpts = {}) {
  const pts = path.length > 2 ? smooth(path, 2.5) : resample(path, 2.5);
  const n = pts.length; if (n < 2) return;
  const K = o.streaks ?? Math.max(3, Math.round(width / 2.2));
  const load = o.load ?? 0.85, fade = o.fade ?? 0.5, taper = o.taper ?? T_BRUSH, cv = o.colorVar ?? 0.05, rag = o.ragged ?? 0.15;
  const seed = o.seed ?? Math.floor(r() * 1e6);
  // normals
  const nor: P[] = pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; return [nx / l, ny / l];
  });
  g.lineCap = 'round'; g.lineJoin = 'round';
  const lw = Math.max(0.9, (width / K) * 1.7);
  for (let k = 0; k < K; k++) {
    const off0 = K === 1 ? 0 : (k / (K - 1) - 0.5);
    const edge = Math.abs(off0) * 2;                       // 0 centre .. 1 edge
    const coh0 = o.coherence ?? 0;
    const ak = load * lerp(0.55 + 0.45 * r(), 0.92 + 0.08 * r(), coh0) * (1 - edge * edge * 0.35);
    const start = edge > 0.7 ? r() * 0.25 * rag * 4 : r() * 0.05;   // edge bristles start late / end early
    const end = 1 - (edge > 0.7 ? r() * 0.3 * rag * 4 : r() * 0.08);
    g.strokeStyle = vary(color, r, cv);
    g.lineWidth = lw * (0.7 + 0.6 * r());
    const wob = (r() - 0.5) * 0.25;
    const CH = 5;
    for (let i0 = Math.floor(start * (n - 1)); i0 < Math.floor(end * (n - 1)); i0 += CH) {
      const i1 = Math.min(n - 1, i0 + CH, Math.floor(end * (n - 1)));
      const u = i0 / (n - 1);
      // dry break: the track skips where its load (noise) dips under the dryness of this point of the stroke
      const coh = o.coherence ?? 0;
      const nz = vnoise(i0 * lerp(0.09, 0.035, coh), k * lerp(3.1, 0.12, coh), seed);
      const a = ak * (1 - fade * Math.pow(u, 1.3)) * (0.55 + 0.6 * nz);
      if (a < 0.08) continue;
      g.globalAlpha = clamp(a);
      g.beginPath();
      for (let i = i0; i <= i1; i++) {
        const ui = i / (n - 1), wv = taper(ui) * width;
        const off = (off0 + wob * ui) * wv + (vnoise(i * 0.05, k, seed + 1) - 0.5) * lw * 0.8;
        const x = pts[i][0] + nor[i][0] * off, y = pts[i][1] + nor[i][1] * off;
        if (i === i0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
    }
  }
  g.globalAlpha = 1;
}
function resample(p: P[], step: number): P[] {
  const out: P[] = [];
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i], b = p[i + 1], m = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < m; k++) out.push([a[0] + (b[0] - a[0]) * k / m, a[1] + (b[1] - a[1]) * k / m]);
  }
  out.push(p[p.length - 1]);
  return out;
}

/** A palette-knife smear: a flat film of paint with ragged edges, its load falling off along the drag; a few
 *  faint bristle-like ridges on top. Dry breakup happens in Layer.finish (weave + patch). */
export function knife(g: C, r: () => number, x: number, y: number, ang: number, len: number, wid: number, color: string, o: StrokeOpts = {}) {
  const c = Math.cos(ang), s = Math.sin(ang), bend = (r() - 0.5) * len * 0.2;
  ribbon(g, r, [[x - c * len / 2, y - s * len / 2], [x - s * bend, y + c * bend], [x + c * len / 2, y + s * len / 2]], wid, color, o);
}

/** A solid film of paint along any path (knife smear, a loaded flat brush): ragged edges, load falling off along it. */
export function ribbon(g: C, r: () => number, path: P[], wid: number, color: string, o: StrokeOpts = {}) {
  const seed = Math.floor(r() * 1e6);
  const spine = smooth(path, 4);
  const taper = o.taper ?? ((u: number) => 0.8 + 0.2 * Math.sin(Math.PI * u));
  const n = spine.length, Lp: P[] = [], Rp: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = spine[Math.max(0, i - 1)], b = spine[Math.min(n - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const u = i / (n - 1), hw = wid / 2 * taper(u);
    const e1 = (vnoise(i * 0.35, 1, seed) - 0.5) * wid * taper(u) * (o.ragged ?? 0.22) + (hash2(i, 1, seed) - 0.5) * 2.5 * taper(u);
    const e2 = (vnoise(i * 0.35, 2, seed) - 0.5) * wid * taper(u) * (o.ragged ?? 0.22) + (hash2(i, 2, seed) - 0.5) * 2.5 * taper(u);
    // the tail end frays: the edges pull in unevenly
    const tail = u > 0.75 ? (u - 0.75) * 4 * wid * 0.3 * vnoise(i * 0.5, 3, seed) : 0;
    Lp.push([spine[i][0] + nx * (hw + e1 - tail), spine[i][1] + ny * (hw + e1 - tail)]);
    Rp.push([spine[i][0] - nx * (hw + e2 - tail * 0.5), spine[i][1] - ny * (hw + e2 - tail * 0.5)]);
  }
  const load = o.load ?? 0.85, fade = o.fade ?? 0.6;
  const p0 = spine[0], p1 = spine[n - 1];
  const gr = g.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
  const col = vary(color, r, o.colorVar ?? 0.015);
  const rgba = (a: number) => col.replace('rgb(', 'rgba(').replace(')', `,${clamp(a).toFixed(3)})`);
  gr.addColorStop(0, rgba(load)); gr.addColorStop(0.5, rgba(load * (1 - fade * 0.3))); gr.addColorStop(1, rgba(load * (1 - fade)));
  pathOf(g, [...Lp, ...Rp.reverse()]); g.fillStyle = gr; g.fill();
  // ridges left by the knife edge: a couple of thin lighter/darker lines along the drag
  const ridges = 1 + Math.floor(r() * 3);
  for (let k = 0; k < ridges; k++) {
    const off = (r() - 0.5) * wid * 0.8, w = 1 + r() * 2.5;
    g.strokeStyle = vary(color, r, 0.06); g.lineWidth = w; g.globalAlpha = load * (0.3 + r() * 0.4);
    g.beginPath();
    for (let i = Math.floor(r() * n * 0.3); i < n * (0.6 + r() * 0.4); i++) {
      const a = spine[Math.max(0, i - 1)], b = spine[Math.min(n - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1;
      const px = spine[i][0] + nx / l * off, py = spine[i][1] + ny / l * off;
      if (k === -1 || i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.stroke(); g.globalAlpha = 1;
  }
}

/** A crisp tapered line (fine brush, used for the face profile, fingers, bow string). */
export function line(g: C, pts: P[], w0: number, w1: number, color: string, alpha = 1) {
  const p = pts.length > 2 ? smooth(pts, 1.5) : resample(pts, 1.5);
  const n = p.length;
  g.fillStyle = color; g.globalAlpha = alpha;
  const L: P[] = [], R: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = p[Math.max(0, i - 1)], b = p[Math.min(n - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const u = i / (n - 1), w = lerp(w0, w1, u) * (0.88 + 0.24 * vnoise(i * 0.08, 0, 11)) / 2;
    L.push([p[i][0] + nx * w, p[i][1] + ny * w]); R.push([p[i][0] - nx * w, p[i][1] - ny * w]);
  }
  pathOf(g, [...L, ...R.reverse()]); g.fill();
  g.globalAlpha = 1;
}

/** Fill a closed shape with strokes that follow a direction field; the shape is the clip. */
export function fillStrokes(g: C, r: () => number, poly: P[], dir: (x: number, y: number) => number, o: {
  colors: string[]; len: [number, number]; wid: [number, number]; density: number; stroke?: StrokeOpts; bleed?: number;
}) {
  const [x0, y0, x1, y1] = bbox(poly);
  g.save(); pathOf(g, poly); g.clip();
  const area = (x1 - x0) * (y1 - y0), N = Math.round(area / 1000 * o.density);
  for (let i = 0; i < N; i++) {
    const x = lerp(x0 - 10, x1 + 10, r()), y = lerp(y0 - 10, y1 + 10, r());
    const a = dir(x, y), L = lerp(o.len[0], o.len[1], r()), W = lerp(o.wid[0], o.wid[1], r());
    const c = Math.cos(a), s = Math.sin(a), b = (r() - 0.5) * L * 0.2;
    stroke(g, r, [[x - c * L / 2, y - s * L / 2], [x - s * b, y + c * b], [x + c * L / 2, y + s * L / 2]], W, pick(r, o.colors), o.stroke);
  }
  g.restore();
}

/** One paint pass: draw on the scratch layer, turn it into paint, lay it onto the target. */
export function pass(target: Layer, scratch: Layer, wv: Weave, o: FinishOpts, draw: (g: C) => void, box?: [number, number, number, number]) {
  scratch.reset();
  draw(scratch.g);
  scratch.finish(wv, o, box);
  const g = target.g;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.drawImage(scratch.cv, 0, 0);
  g.restore();
}
