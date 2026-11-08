// Seeded randomness, value noise and colour helpers. Everything is deterministic: same seed, same frame.
export type P = [number, number];
export type C = CanvasRenderingContext2D;

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

export const hx = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
export const mix = (a: string, b: string, t: number) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => cl(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
export const shade = (h: string, d: number) => d < 0 ? mix(h, '#000000', -d) : mix(h, '#ffffff', d);
// A brush-load variation of a base colour: a little lighter/darker, drifting warm or cool.
export const vary = (h: string, r: () => number, amt: number) => {
  const d = (r() - 0.5) * 2 * amt;
  const tint = r() < 0.5 ? '#6b4a22' : '#3c4a52';
  return mix(shade(h, d), tint, r() * amt * 0.8);
};

// A canvas filled pixel by pixel (texture plates).
export function plate(w: number, h: number, fn: (d: Uint8ClampedArray, i: number, x: number, y: number) => void) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d')!; const im = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) fn(im.data, (y * w + x) * 4, x, y);
  g.putImageData(im, 0, 0); return cv;
}

// Animation timing.
export const sm = (x: number) => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
export const ramp = (t: number, a: number, b: number) => sm((t - a) / (b - a));
export const outCubic = (t: number, a: number, b: number) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return 1 - Math.pow(1 - x, 3); };
export const outBack = (t: number, a: number, b: number) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))), k = 1.6; return 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2); };
// Two drawings closed = a blink (~0.17 s on 2s).
export const blinkAt = (t: number, ...at: number[]) => at.some(b => t >= b && t < b + 0.17) ? 1 : 0;
// Time stepped to drawings: 12 a second = "on 2s" at 24 fps.
export const onTwos = (local: number) => Math.floor(local * 12) / 12;
