// What every Flat Grain explainer shares: timing helpers, the table world, word-by-word captions in the dark band,
// speech bubbles and day cards. Text goes through `boxes` so QA can check it against the Reels UI.
import type { TextBox } from '../../../core/scene.ts';
import type { Ink, Pt, tools } from './ink.ts';
import type { StreetInks } from './street.ts';

export type T = ReturnType<typeof tools>;
export const W = 1080, H = 1920, DARK_Y = 1215, WORLD = 1.12;
export const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const ss = (a: number, b: number, x: number) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
export const pop = (a: number, d: number, x: number) => { const u = clamp((x - a) / d) - 1; return x < a ? 0 : 1 + 2.7 * u * u * u + 1.7 * u * u; };
export const bump = (a: number, b: number, x: number) => Math.sin(Math.PI * clamp((x - a) / (b - a)));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const P = (x: number, y: number): [number, number] => [(x - 540) * WORLD + 540, y * WORLD];
export const world = (c: CanvasRenderingContext2D) => { c.translate(540, 0); c.scale(WORLD, WORLD); c.translate(-540, 0); };

export let boxes: TextBox[] = [];
export const clearBoxes = () => { boxes = []; };

export function makeCaptions(said: { text: string; start: number }[], lines: string[][], key: Set<string>, hookWords = 0) {
  let i = 0;
  const chunks = lines.map(ls => {
    const l = ls.map(s => s.split(' ').map(text => {
      const w = said[i++];
      if (w.text.replace(/[^a-z]/gi, '') !== text.replace(/[^a-z]/gi, '')) throw new Error(`caption mismatch ${text} / ${w.text}`);
      return { text, at: w.start };
    }));
    return { lines: l, at: l[0][0].at };
  });
  if (i !== said.length) throw new Error(`captions cover ${i} of ${said.length} words`);
  const first = chunks[0].lines.flat().length;
  if (hookWords && first < hookWords) throw new Error(`frame 1 shows ${first} of the ${hookWords} hook words: the first caption chunk must hold the whole hook`);
  return (c: CanvasRenderingContext2D, I: StreetInks, t: number) => {
    let k = 0; for (let n = 0; n < chunks.length; n++) if (t >= chunks[n].at - 0.04) k = n;
    const ch = chunks[k], y0 = ch.lines.length === 1 ? 1436 : 1392;
    c.setTransform(1, 0, 0, 1, 0, 0); c.textBaseline = 'middle'; c.textAlign = 'left';
    let size = 78; c.font = `900 ${size}px Inter`;
    const widest = Math.max(...ch.lines.map(l => c.measureText(l.map(w => w.text).join(' ')).width));
    if (widest > 800) { size = Math.floor(size * 800 / widest); c.font = `900 ${size}px Inter`; }
    ch.lines.forEach((l, j) => {
      const full = c.measureText(l.map(w => w.text).join(' ')).width, cy = y0 + j * (size + 8); let x = 500 - full / 2;
      boxes.push({ text: l.map(w => w.text).join(' '), x0: x, y0: cy - size / 2, x1: x + full, y1: cy + size / 2, size });
      for (const w of l) {
        const wd = c.measureText(w.text + ' ').width;
        if (k === 0 || t >= w.at - 0.03) {
          const p = k === 0 ? 1 : 0.86 + 0.14 * pop(w.at - 0.03, 0.14, t);
          c.save(); c.translate(x + wd / 2, cy); c.scale(p, p); c.fillStyle = key.has(w.text) ? '#EDA93D' : I.paper; c.fillText(w.text, -wd / 2, 0); c.restore();
        }
        x += wd;
      }
    });
  };
}

export function tableBand(t: T, I: StreetInks, dim = false) {
  const poly = (l: [number, number][], ink: Ink) => t.fill(l.map(([x, y]) => [x, y, 1] as Pt), ink);
  poly([[-60, DARK_Y - 34], [1140, DARK_Y - 34], [1140, 2000], [-60, 2000]], I.road);
  poly([[-60, DARK_Y - 34], [1140, DARK_Y - 34], [1140, DARK_Y - 8], [-60, DARK_Y - 8]], dim ? I.goldDeep : I.gold);
}
export function cup(t: T, I: StreetInks, x: number, ink: Ink = I.paper) {
  const y = DARK_Y - 34;
  t.part([[x - 34, y - 74, 1], [x + 34, y - 74, 1], [x + 24, y, 1], [x - 24, y, 1]], ink, 3, 40);
  t.pen([[x + 34, y - 58], [x + 58, y - 48], [x + 56, y - 22], [x + 28, y - 16]], [4, 5, 5, 3], 41);
}
export function lamp(c: CanvasRenderingContext2D, t: T, I: StreetInks, sway: number, lit = true) {
  c.save(); c.translate(540, -20); c.rotate(sway);
  if (lit) { c.save(); c.globalAlpha = 0.1; t.fill([[-60, 210, 1], [60, 210, 1], [430, 1190, 1], [-430, 1190, 1]], I.gold); c.restore(); }
  t.pen([[0, 0], [0, 150]], [4, 4], 42);
  t.part([[-20, 140, 1], [20, 140, 1], [84, 214, 1], [-84, 214, 1]], lit ? I.black : I.far, 2, 43);
  t.fill([[-40, 214, 1], [40, 214, 1], [30, 226, 1], [-30, 226, 1]], lit ? I.gold : I.goldDeep, 44);
  c.restore();
}
// A speech bubble in world coordinates. tail is the point it speaks from.
export function say(c: CanvasRenderingContext2D, t: T, I: StreetInks, x: number, y: number, w: number, h: number, p: number, text: string, tail: [number, number], size = 54, ink: Ink = I.paper) {
  if (p <= 0) return;
  c.save(); c.translate(x, y); c.scale(p, p);
  const hw = w / 2, hh = h / 2, tx = tail[0] - x, ty = tail[1] - y, side = tx > 0 ? 1 : -1;
  const shape: Pt[] = [[-hw, -hh], [hw, -hh], [hw + 10, 0], [hw, hh], [side * 40, hh, 1], [tx / p, ty / p, 1], [side * -10, hh, 1], [-hw, hh], [-hw - 10, 0]];
  t.part(shape, ink, 5, 44);
  c.fillStyle = I.black; c.font = `900 ${size}px Inter`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, 2);
  const tw = c.measureText(text).width * WORLD / 2;
  c.restore();
  if (p > 0.9) { const [sx, sy] = P(x, y); boxes.push({ text, x0: sx - tw, y0: sy - size * WORLD / 2, x1: sx + tw, y1: sy + size * WORLD / 2, size: size * WORLD }); }
}
// A day card. lit: gold when the day has come.
export function dayCard(c: CanvasRenderingContext2D, t: T, I: StreetInks, x: number, y: number, p: number, day: string, lit: boolean, hot: Ink = I.gold) {
  if (p <= 0) return;
  c.save(); c.translate(x, y); c.scale(p, p);
  t.part([[-71, -72, 1], [71, -72, 1], [71, 72, 1], [-71, 72, 1]], lit ? hot : I.road, 3, 60);
  c.fillStyle = lit ? I.black : I.paper; c.font = '900 36px Inter'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(day, 0, 0);
  c.restore();
}

// The time a word is said: its nth appearance in the take.
export const wordAt = (said: { text: string; start: number }[]) => (word: string, n = 1) => {
  let k = 0;
  for (const w of said) if (w.text.toLowerCase().replace(/[^a-z']/g, '') === word && ++k === n) return w.start;
  throw new Error(`no word ${word} #${n}`);
};
export function phone(t: T, I: StreetInks, x: number, y: number, s: number, lit = true) {
  t.part([[x - 46 * s, y - 84 * s, 1], [x + 46 * s, y - 84 * s, 1], [x + 46 * s, y + 84 * s, 1], [x - 46 * s, y + 84 * s, 1]], I.black, 3, 45);
  t.fill([[x - 36 * s, y - 72 * s, 1], [x + 36 * s, y - 72 * s, 1], [x + 36 * s, y + 72 * s, 1], [x - 36 * s, y + 72 * s, 1]], lit ? I.gold : I.far, 46);
}
export function heart(c: CanvasRenderingContext2D, t: T, I: StreetInks, x: number, y: number, p: number, ink: Ink = I.gold) {
  if (p <= 0) return;
  c.save(); c.translate(x, y); c.scale(p, p);
  t.part([[0, -46, 1], [46, -92], [104, -70], [108, -14], [0, 96, 1], [-108, -14], [-104, -70], [-46, -92]], ink, 6, 50);
  t.fill([[70, -70], [92, -52], [88, -22], [72, -44]], I.paper, 51);
  c.restore();
}
// A flat label in world coordinates, registered for QA. ink is its backing.
export function tag(c: CanvasRenderingContext2D, t: T, I: StreetInks, text: string, x: number, y: number, size: number, p: number, ink: Ink = I.paper, color = I.black as string, tilt = -0.04) {
  if (p <= 0) return;
  c.save(); c.translate(x, y); c.rotate(tilt); c.scale(p, p); c.font = `900 ${size}px Inter`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const w = c.measureText(text).width, hw = w / 2 + 26;
  t.part([[-hw, -size * 0.74, 1], [hw, -size * 0.74, 1], [hw, size * 0.74, 1], [-hw, size * 0.74, 1]], ink, 4, 79);
  c.fillStyle = color; c.fillText(text, 0, 2); c.restore();
  if (p > 0.9) { const [sx, sy] = P(x, y), tw = w * WORLD / 2; boxes.push({ text, x0: sx - tw, y0: sy - size * WORLD / 2, x1: sx + tw, y1: sy + size * WORLD / 2, size: size * WORLD }); }
}
// A gold circle that fills the frame from a world point, and the hole that opens it again.
export function irisShut(c: CanvasRenderingContext2D, I: StreetInks, x: number, y: number, k: number) {
  if (k <= 0) return;
  const [sx, sy] = P(x, y); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.beginPath(); c.arc(sx, sy, 2300 * k ** 1.5, 0, 7); c.fillStyle = I.gold; c.fill(); c.restore();
}
export function irisOpen(c: CanvasRenderingContext2D, I: StreetInks, x: number, y: number, k: number) {
  if (k >= 1) return;
  const [sx, sy] = P(x, y), r = 2300 * k;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.beginPath(); c.rect(0, 0, W, H); c.moveTo(sx + r, sy); c.arc(sx, sy, r, 0, 7); c.clip('evenodd'); c.fillStyle = I.gold; c.fillRect(0, 0, W, H); c.restore();
}
