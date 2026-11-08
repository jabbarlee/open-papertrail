// Backgrounds are PAINTED: dry-brush bristle strokes over a base, grime mottling, scratches, specks. No ink lines.
import { cl, fbm, plate, rng, vary, type C, type P } from './noise.ts';

let mottleD: HTMLCanvasElement | null = null, mottleL: HTMLCanvasElement | null = null;
// Grime (dark blotches) and wear (light blotches), built once and reused at random offsets.
export function paintPlates() {
  if (mottleD) return { mottleD, mottleL: mottleL! };
  const w = 1400, h = 2200;
  mottleD = plate(w, h, (d, i, x, y) => {
    const n = fbm(x / 210, y / 210, 3, 5) * 0.65 + fbm(x / 38, y / 38, 9, 3) * 0.35;
    d[i] = 20; d[i + 1] = 14; d[i + 2] = 8; d[i + 3] = cl(Math.max(0, n - 0.5) * 2.2 * 255);
  });
  mottleL = plate(w, h, (d, i, x, y) => {
    const n = fbm(x / 260 + 40, y / 260, 5, 5) * 0.75 + fbm(x / 30, y / 30, 11, 2) * 0.25;
    d[i] = 245; d[i + 1] = 238; d[i + 2] = 222; d[i + 3] = cl(Math.max(0, 0.46 - n) * 2.4 * 255);
  });
  return { mottleD, mottleL };
}

// One brush stroke: parallel bristles, broken where the brush runs dry, a slight bend.
export function bristle(c: C, x: number, y: number, ang: number, len: number, width: number, color: string, r: () => number, alpha = 1) {
  const n = Math.max(3, Math.round(width / 2.6));
  const ca = Math.cos(ang), sa = Math.sin(ang);
  c.strokeStyle = color; c.lineCap = 'round';
  const bend = (r() - 0.5) * 0.12;
  for (let k = 0; k < n; k++) {
    const off = (k / (n - 1) - 0.5) * width;
    const bx = x - sa * off, by = y + ca * off;
    c.globalAlpha = alpha * (0.22 + r() * 0.55);
    c.lineWidth = 1.4 + r() * 2.8;
    let s = r() * len * 0.15; const end = len * (0.65 + r() * 0.35);
    c.beginPath();
    while (s < end) {
      const e = Math.min(end, s + 18 + r() * 90);
      const w1 = Math.sin(s / len * Math.PI) * bend * len, w2 = Math.sin(e / len * Math.PI) * bend * len;
      c.moveTo(bx + ca * s - sa * w1, by + sa * s + ca * w1);
      c.lineTo(bx + ca * e - sa * w2, by + sa * e + ca * w2);
      s = e + (r() < 0.3 ? 8 + r() * 30 : 2 + r() * 4);
    }
    c.stroke();
  }
  c.globalAlpha = 1;
}

export interface PaintOpts {
  seed: number;
  ang?: number;       // stroke direction (0 = horizontal, PI/2 = vertical)
  angVar?: number;
  len?: number;       // stroke length
  bw?: number;        // brush width
  density?: number;
  var?: number;       // colour variation per brush load
  grime?: number;     // dark mottling
  light?: number;     // light wear
  scratches?: number;
  specks?: number;
}
export function paint(c: C, shape: Path2D, box: [number, number, number, number], base: string, o: PaintOpts) {
  const { mottleD, mottleL } = paintPlates();
  const r = rng(o.seed), [bx, by, bw, bh] = box;
  c.save(); c.clip(shape);
  c.fillStyle = base; c.fillRect(bx, by, bw, bh);
  const len = o.len ?? 170, sw = o.bw ?? 44, ang = o.ang ?? 0, av = o.angVar ?? 0.25;
  const n = Math.round((o.density ?? 1.3) * bw * bh / (len * sw));
  for (let i = 0; i < n; i++) {
    const a = ang + (r() - 0.5) * av;
    bristle(c, bx - len * 0.3 + r() * (bw + len * 0.3), by - 10 + r() * (bh + 20), a, len * (0.5 + r()), sw * (0.6 + r() * 0.8), vary(base, r, o.var ?? 0.09), r);
  }
  const ox = -Math.floor(r() * 300), oy = -Math.floor(r() * 250);
  c.globalAlpha = o.grime ?? 0.5; c.drawImage(mottleD, ox, oy, Math.max(1400, bw + 400), Math.max(2200, bh + 400));
  c.globalAlpha = o.light ?? 0.2; c.drawImage(mottleL, ox - 60, oy - 40, Math.max(1400, bw + 400), Math.max(2200, bh + 400));
  c.globalAlpha = 1;
  for (let i = 0, sc = o.scratches ?? 10; i < sc; i++) {
    const x = bx + r() * bw, y = by + r() * bh, a = r() * Math.PI, l = 6 + r() * 40;
    c.strokeStyle = r() < 0.7 ? 'rgba(250,244,230,0.16)' : 'rgba(10,8,5,0.18)';
    c.lineWidth = 1 + r() * 1.5;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
  }
  for (let i = 0, sp = o.specks ?? 60; i < sp; i++) {
    c.fillStyle = r() < 0.6 ? `rgba(245,238,220,${0.15 + r() * 0.3})` : `rgba(15,10,5,${0.1 + r() * 0.25})`;
    c.beginPath(); c.ellipse(bx + r() * bw, by + r() * bh, 1 + r() * 3, 1 + r() * 2, r() * 3, 0, 7); c.fill();
  }
  c.restore();
}
export const rectPath = (x: number, y: number, w: number, h: number) => { const p = new Path2D(); p.rect(x, y, w, h); return p; };
export const polyPath = (pts: P[]) => { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; };
export function paintRect(c: C, x: number, y: number, w: number, h: number, base: string, o: PaintOpts) { paint(c, rectPath(x, y, w, h), [x, y, w, h], base, o); }
export function paintPoly(c: C, pts: P[], base: string, o: PaintOpts) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys);
  paint(c, polyPath(pts), [x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0], base, o);
}
// A painted edge (planks, frames, cracks, baseboards): brush, never ink.
export function brushLine(c: C, x1: number, y1: number, x2: number, y2: number, w: number, color: string, seed: number, alpha = 0.9) {
  const r = rng(seed), len = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1);
  for (let k = 0; k < 2; k++) bristle(c, x1, y1, a, len * 1.05, w, color, r, alpha);
}
// Painted contact shadow under a character.
export function shadowBlob(c: C, x: number, y: number, rx: number, ry: number, seed: number, color = '#827E6C') {
  const p = new Path2D(); p.ellipse(x, y, rx, ry, 0, 0, 7);
  paint(c, p, [x - rx, y - ry, rx * 2, ry * 2], color, { seed, len: 60, bw: 20, density: 2, grime: 0.25, light: 0.15, scratches: 4, specks: 10 });
}
