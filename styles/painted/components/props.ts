// Collage props and handwriting. A prop the joke hangs on is "photographic" (real material: lit crumple, rules,
// torn edges, a soft cast shadow) next to flat drawn things. That clash is the reference's signature.
import { cl, fbm, plate, rng, type C, type P } from './noise.ts';
import { curve, ell, jitter } from './ink.ts';

export const FONT_DIR = '/styles/painted/fonts';
export const FONTS = [
  { family: 'Gaegu', url: `${FONT_DIR}/Gaegu-Regular.ttf` },             // captions + ballpoint writing
  { family: 'Patrick Hand', url: `${FONT_DIR}/PatrickHand-Regular.ttf` }, // small painted signage
  { family: 'Caveat Brush', url: `${FONT_DIR}/CaveatBrush-Regular.ttf` }, // big painted signage
];

// A sheet of crumpled lined notebook paper with a torn top edge, w×h px, ruled every `rule` px.
export function notebookPaper(w: number, h: number, seed = 21, rule = 42): HTMLCanvasElement {
  const tex = plate(w, h, (d, i, x, y) => {
    const e = 1.6;
    const hf = (xx: number, yy: number) => { const n = fbm(xx / 120, yy / 120, seed, 4); return (1 - Math.abs(n * 2 - 1)) + fbm(xx / 20, yy / 20, seed + 1, 2) * 0.04; };
    const gx = hf(x + e, y) - hf(x - e, y), gy = hf(x, y + e) - hf(x, y - e);
    const lit = Math.max(0.8, Math.min(1.04, 0.95 + (-gx * 0.8 - gy * 1.0) * 2.6));
    let r = 238 * lit, g = 238 * lit, b = 234 * lit;
    if (x % rule < 2.2) { r *= 0.55; g *= 0.78; b *= 0.96; }
    d[i] = cl(r); d[i + 1] = cl(g); d[i + 2] = cl(b); d[i + 3] = 255;
  });
  const cv = document.createElement('canvas'); cv.width = w + 40; cv.height = h + 40;
  const g = cv.getContext('2d')!, r = rng(seed + 10);
  const edge = new Path2D();
  edge.moveTo(20, h + 20); edge.lineTo(20, 40);
  for (let x = 20; x <= w + 20; x += 9) edge.lineTo(x, 26 + (x / 9 % 2 ? 0 : 10) + r() * 9);
  edge.lineTo(w + 20, h + 20); edge.closePath();
  g.save(); g.clip(edge); g.drawImage(tex, 20, 10); g.restore();
  g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2; g.stroke(edge);
  return cv;
}
// Ballpoint, gone over two or three times like a real doodle.
export function pen(g: C, pts: P[], seed: number, passes = 3, closed = false, color = '28,30,52') {
  for (let k = 0; k < passes; k++) {
    g.strokeStyle = `rgba(${color},${0.7 + k * 0.08})`; g.lineWidth = 2.2; g.lineCap = 'round'; g.lineJoin = 'round';
    g.stroke(curve(jitter(pts, closed, seed + k * 13, 4.5, 30), closed));
  }
}
export const penCircle = (g: C, x: number, y: number, r: number, seed: number) => pen(g, ell(x, y, r, r, 16), seed, 3, true);

// Draw a prop canvas centred at (x, y) with a soft cast shadow.
export function drawProp(c: C, img: HTMLCanvasElement, x: number, y: number, s: number, ang: number) {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  c.shadowColor = 'rgba(10,6,2,0.45)'; c.shadowBlur = 22 * s; c.shadowOffsetX = 10 * s; c.shadowOffsetY = 14 * s;
  c.drawImage(img, -img.width / 2, -img.height / 2);
  c.restore();
}

// Handwritten caption, chalky off-white, top-left of the frame, sitting in the art.
// Shrinks to fit inside the frame (60 px margins); pass several lines as an array.
export function caption(c: C, text: string | string[], x = 80, y = 210, size = 112, color = 'rgba(222,218,204,0.92)') {
  const lines = Array.isArray(text) ? text : [text], maxW = c.canvas.width - x - 60;
  c.save(); c.textBaseline = 'alphabetic'; c.fillStyle = color;
  let s = size; c.font = `${s}px Gaegu`;
  while (s > 40 && Math.max(...lines.map(l => c.measureText(l).width)) > maxW) { s -= 4; c.font = `${s}px Gaegu`; }
  lines.forEach((l, i) => c.fillText(l, x, y + i * s * 1.02));
  c.restore();
}

// A paper takeaway cup, "photographic" (shaded paper, rim, cast shadow, no ink), name in black marker.
// (x, yBottom) = centre of its base on screen; s = scale (1 = 200 px across the top, 260 tall).
// name: lines of marker text; chars: how many characters are written so far (for a write-on).
export interface CupOpts { name?: string[]; chars?: number; lid?: boolean; sleeve?: boolean; fill?: number; nameSize?: number }
export function paperCup(c: C, x: number, yB: number, s: number, o: CupOpts = {}) {
  const T = 100, B = 76, Hh = 260;
  c.save(); c.translate(x, yB); c.scale(s, s);
  // cast shadow
  c.save(); c.filter = 'blur(10px)'; c.fillStyle = 'rgba(20,12,6,0.35)';
  c.beginPath(); c.ellipse(26, 4, B + 30, 16, 0, 0, 7); c.fill(); c.restore();
  const body = new Path2D();
  body.moveTo(-T, -Hh); body.lineTo(T, -Hh); body.lineTo(B, 0); body.ellipse(0, 0, B, 12, 0, 0, Math.PI); body.lineTo(-T, -Hh); body.closePath();
  const g = c.createLinearGradient(-T, 0, T, 0);
  g.addColorStop(0, '#C9C4BA'); g.addColorStop(0.18, '#E6E2DA'); g.addColorStop(0.38, '#F8F6F1'); g.addColorStop(0.7, '#E9E5DD'); g.addColorStop(1, '#BDB7AC');
  c.fillStyle = g; c.fill(body);
  c.strokeStyle = 'rgba(60,50,40,0.45)'; c.lineWidth = 2.5 / s * 1.6; c.stroke(body);
  if (o.sleeve) {
    const y0 = -150, y1 = -70, k0 = T - (T - B) * (Hh + y0) / Hh, k1 = T - (T - B) * (Hh + y1) / Hh;
    const sl = new Path2D(); sl.moveTo(-k0, y0); sl.lineTo(k0, y0); sl.lineTo(k1, y1); sl.lineTo(-k1, y1); sl.closePath();
    const sg = c.createLinearGradient(-T, 0, T, 0);
    sg.addColorStop(0, '#8C6A42'); sg.addColorStop(0.35, '#BE9764'); sg.addColorStop(1, '#8A673F');
    c.fillStyle = sg; c.fill(sl);
    c.save(); c.clip(sl); c.strokeStyle = 'rgba(70,48,24,0.35)'; c.lineWidth = 2;
    for (let xx = -T; xx < T; xx += 7) { c.beginPath(); c.moveTo(xx, y0); c.lineTo(xx * 0.9, y1); c.stroke(); }
    c.restore();
  }
  if (o.lid) {
    const lid = new Path2D(); lid.moveTo(-T - 6, -Hh + 4); lid.lineTo(T + 6, -Hh + 4); lid.lineTo(T - 6, -Hh - 26); lid.quadraticCurveTo(0, -Hh - 44, -T + 6, -Hh - 26); lid.closePath();
    const lg = c.createLinearGradient(-T, 0, T, 0);
    lg.addColorStop(0, '#D8D6D0'); lg.addColorStop(0.4, '#FBFAF7'); lg.addColorStop(1, '#C8C5BE');
    c.fillStyle = lg; c.fill(lid); c.strokeStyle = 'rgba(60,50,40,0.4)'; c.lineWidth = 2; c.stroke(lid);
    c.fillStyle = '#3A3430'; c.beginPath(); c.ellipse(30, -Hh - 30, 14, 4, 0, 0, 7); c.fill();
  } else {
    c.fillStyle = '#E9E5DD'; c.beginPath(); c.ellipse(0, -Hh, T, 15, 0, 0, 7); c.fill();
    const f = o.fill ?? 0;
    c.fillStyle = f > 0 ? '#F5F2EA' : '#5A4632'; c.beginPath(); c.ellipse(0, -Hh + 2, T - 7, 11, 0, 0, 7); c.fill();
    if (f > 0 && f < 1) { c.fillStyle = 'rgba(90,70,50,0.5)'; c.beginPath(); c.ellipse(0, -Hh + 2, (T - 7) * (1 - f), 11 * (1 - f), 0, 0, 7); c.fill(); }
    c.strokeStyle = 'rgba(60,50,40,0.45)'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(0, -Hh, T, 15, 0, 0, 7); c.stroke();
  }
  if (o.name) {
    let left = o.chars ?? 1e9;
    const size = o.nameSize ?? 64, n = o.name.length;
    c.save(); c.rotate(-0.04); c.fillStyle = '#17161A'; c.font = `${size}px "Caveat Brush"`; c.textAlign = 'center';
    const top = o.sleeve ? -200 : -Hh / 2 - (n - 1) * size * 0.45;
    o.name.forEach((l, i) => { const shown = l.slice(0, Math.max(0, left)); left -= l.length; if (shown) c.fillText(shown, 0, top + i * size * 0.9 + size * 0.3); });
    c.restore();
  }
  c.restore();
}
