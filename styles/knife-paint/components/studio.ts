// The knife-paint episode shell. Everything is painted into Sprites (small canvases holding finished paint, cached per
// page), placed in the frame per shot, then the canvas weave and the light of a photographed painting go over the
// whole frame. Moving parts are separate sprites, so the paint moves with the thing and never swims.
//   export default knifeEpisode({ s01(f) { ... }, s02 ... })
import { defineScene, type Runtime } from '../../../core/scene.ts';
import { Layer, Weave, pass, ribbon, rng, vary, clamp, type C, type FinishOpts } from './paint.ts';

export const W = 1080, H = 1920;
export const FONT_DIR = '/styles/knife-paint/fonts';

let wv: Weave | null = null;
export const weave = () => (wv ??= new Weave(W, H));

// ---------- sprites ----------
export class Sprite {
  L: Layer; private S: Layer | null;
  w: number; h: number; x0: number; y0: number;
  constructor(x0: number, y0: number, x1: number, y1: number) {
    this.x0 = Math.floor(x0); this.y0 = Math.floor(y0);
    this.w = Math.ceil(x1 - this.x0); this.h = Math.ceil(y1 - this.y0);
    const view = { s: 1, ox: -this.x0, oy: -this.y0 };
    this.L = new Layer(this.w, this.h, view); this.S = new Layer(this.w, this.h, view);
  }
  /** One paint pass in frame coordinates. */
  pass(o: FinishOpts, draw: (g: C) => void) { pass(this.L, this.S!, weave(), o, draw); return this; }
  /** Draw plain canvas marks (no paint test), e.g. a mask or crisp letters that the next pass will cover. */
  raw(draw: (g: C) => void) { const g = this.L.g; g.save(); draw(g); g.restore(); return this; }
  done() { this.S = null; return this; }
  get cv() { return this.L.cv; }
  /** Place in the frame: shifted by (dx, dy) and scaled about the pivot (frame coords). */
  put(c: C, o: { dx?: number; dy?: number; s?: number; px?: number; py?: number; rot?: number; alpha?: number } = {}) {
    const s = o.s ?? 1, px = o.px ?? this.x0 + this.w / 2, py = o.py ?? this.y0 + this.h;
    c.save(); c.globalAlpha *= o.alpha ?? 1;
    c.translate(px + (o.dx ?? 0), py + (o.dy ?? 0)); if (o.rot) c.rotate(o.rot); c.scale(s, s); c.translate(-px, -py);
    c.drawImage(this.L.cv, this.x0, this.y0);
    c.restore();
  }
}
const cache = new Map<string, Sprite>();
/** A painted sprite, made once per page. Box in frame coords. */
export function sprite(key: string, box: [number, number, number, number], paint: (sp: Sprite) => void): Sprite {
  let sp = cache.get(key);
  if (!sp) { sp = new Sprite(...box); paint(sp); sp.done(); cache.set(key, sp); }
  return sp;
}

// ---------- time ----------
export type Shot = (f: Frame) => void;
export interface Frame { c: C; t: number; rt: Runtime; dur: number; p: number; word: (w: string, fb: number) => number; drawing: number }
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
export const ease = (x: number) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const outCubic = (t: number, a: number, b: number) => { const x = clamp((t - a) / Math.max(1e-6, b - a)); return 1 - Math.pow(1 - x, 3); };
export const inOut = (t: number, a: number, b: number) => ease((t - a) / Math.max(1e-6, b - a));

// ---------- the frame finish ----------
let light: HTMLCanvasElement | null = null;
function finish(c: C) {
  if (!light) {
    light = document.createElement('canvas'); light.width = W; light.height = H;
    const g = light.getContext('2d')!, gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#DCD2C0'); gr.addColorStop(0.18, '#F3EEE6'); gr.addColorStop(0.55, '#FFFFFF'); gr.addColorStop(1, '#EFE9E0');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'soft-light'; c.globalAlpha = 0.4; c.drawImage(weave().shade, 0, 0);
  c.globalCompositeOperation = 'multiply'; c.globalAlpha = 1; c.drawImage(light, 0, 0);
  c.restore();
}

// ---------- captions: the narrator's line, set in italic serif on a cream knife smear ----------
function wrap(c: C, text: string, maxW: number, font: string) {
  c.save(); c.font = font;
  const out: string[] = []; let cur = '';
  for (const w of text.split(' ')) { const t = cur ? `${cur} ${w}` : w; if (c.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }
  if (cur) out.push(cur); c.restore(); return out;
}
const CAP_FONT = 'italic 70px "Instrument Serif"', CAP_LH = 74, CAP_X = 78, CAP_Y = 290;
function captionSprite(c: C, text: string, k: number) {
  const ls = wrap(c, text, W - 220, CAP_FONT);
  c.save(); c.font = CAP_FONT; const tw = Math.max(...ls.map(l => c.measureText(l).width)); c.restore();
  const y0 = CAP_Y - 62, y1 = CAP_Y + (ls.length - 1) * CAP_LH + 26;
  return sprite(`cap:${k}:${text}`, [CAP_X - 50, y0 - 30, CAP_X + tw + 60, y1 + 30], sp => {
    const r = rng(300 + k * 7);
    sp.pass({ dry: 0.6, relief: 0.4, patch: 0.3, soften: 1.2 }, g => {
      ls.forEach((l, i) => {
        c.save(); c.font = CAP_FONT; const lw = c.measureText(l).width; c.restore();
        const y = CAP_Y + i * CAP_LH - 22;
        ribbon(g, r, [[CAP_X - 26, y + (r() - 0.5) * 6], [CAP_X + lw / 2, y + (r() - 0.5) * 8], [CAP_X + lw + 30, y + (r() - 0.5) * 6]], CAP_LH + 6, '#EFE6D4', { load: 0.95, colorVar: 0.02, fade: 0.25, ragged: 0.12 });
      });
    });
    sp.raw(g => {
      g.font = CAP_FONT; g.fillStyle = '#24161B';
      ls.forEach((l, i) => g.fillText(l, CAP_X, CAP_Y + i * CAP_LH));
    });
  });
}
function caption(c: C, rt: Runtime) {
  const lines = rt.tl.lines.filter(l => !(l as { speaker?: string }).speaker);
  const i = lines.findIndex((l, k) => rt.t >= l.start - 0.08 && rt.t < Math.min(l.end + 0.45, lines[k + 1]?.start ?? 1e9));
  if (i < 0) return;
  const sp = captionSprite(c, lines[i].text, i);
  sp.put(c);
  rt.text.push({ text: lines[i].text, x0: CAP_X, y0: CAP_Y - 56, x1: sp.x0 + sp.w, y1: sp.y0 + sp.h - 30, size: 70 });
}

// ---------- camera ----------
export function camera(c: C, z: number, fx = W / 2, fy = H / 2, dx = 0, dy = 0) {
  c.setTransform(z, 0, 0, z, fx - fx * z + dx, fy - fy * z + dy);
}

// ---------- the episode ----------
export function knifeEpisode(shots: Record<string, Shot>) {
  let frameC: HTMLCanvasElement | null = null;
  return defineScene({
    fonts: [
      { family: 'Instrument Serif', url: `${FONT_DIR}/InstrumentSerif-Italic.ttf`, style: 'italic' },
      { family: 'Instrument Serif', url: `${FONT_DIR}/InstrumentSerif-Regular.ttf` },
    ],
    setup({ tl }) {
      const missing = tl.shots.map(s => s.id).filter(id => !shots[id]);
      if (missing.length) throw new Error(`scene.ts has no shot for: ${missing.join(', ')}`);
      weave();
    },
    render(c, rt) {
      frameC ??= Object.assign(document.createElement('canvas'), { width: W, height: H });
      const g = frameC.getContext('2d')!;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#E4D8C5'; g.fillRect(0, 0, W, H);
      const drawing = Math.floor(rt.local * 12);
      const t = drawing / 12, dur = rt.shot.end - rt.shot.start;
      const word = (w: string, fb: number) => {
        const x = rt.tl.words.find(o => norm(o.text) === norm(w) && o.start >= rt.shot.start - 0.3);
        return x ? x.start - rt.shot.start : fb;
      };
      g.save();
      shots[rt.shot.id]({ c: g, t, rt, dur, p: clamp(t / dur), word, drawing });
      g.restore();
      g.setTransform(1, 0, 0, 1, 0, 0);
      caption(g, rt);
      finish(g);
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.drawImage(frameC, 0, 0);
    },
  });
}
