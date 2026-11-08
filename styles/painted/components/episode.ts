// The painted episode shell: everything an episode's scene.ts needs besides its own sets and shots.
//   export default paintedEpisode({ s01(c, t, rt) { ... }, s02 ... })
// Every frame: line boil on 2s, motion stepped at 12 drawings/s (t), the shot, the narrator's subtitle, the overlay.
import { defineScene, type Runtime } from '../../../core/scene.ts';
import { finish, prepareOverlay } from './overlay.ts';
import { paintPlates } from './paint.ts';
import { S } from './ink.ts';
import { FONTS } from './props.ts';
import { withCamera, type Move } from './camera.ts';
import { layer } from './layers.ts';
import { onTwos, type C, type P } from './noise.ts';
import { otto, type OttoOpts } from './cast/otto.ts';
import { mae, type MaeOpts } from './cast/mae.ts';
import { catFront, catSide, type CatOpts } from './cast/cat.ts';
import { sal, type SalOpts } from './cast/sal.ts';
import { dexOnSofa, blanket, type DexOpts } from './cast/dex.ts';

export const W = 1080, H = 1920;
export type Shot = (c: C, t: number, rt: Runtime) => void;

// A painted layer cached for the whole episode (sets, walls, floors: anything that doesn't move).
export const L = (key: string, fn: (g: C) => void) => layer(key, W, H, fn);

export const dur = (rt: Runtime) => rt.shot.end - rt.shot.start;
export const cam = (c: C, t: number, rt: Runtime, m: Move[], draw: () => void) => withCamera(c, t, dur(rt), m, draw);

// When a spoken word starts, in seconds since this shot began. Time every beat from the words, never fixed seconds.
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
export function wordT(rt: Runtime, w: string, fallback: number): number {
  const x = rt.tl.words.find(o => norm(o.text) === norm(w) && o.start >= rt.shot.start - 0.3);
  return x ? x.start - rt.shot.start : fallback;
}

// Characters placed on screen. ottoAt/maeAt/... take the FEET point unless noted; S.inkw is set for the scale.
export function ottoAt(c: C, x: number, feetY: number, s: number, o: OttoOpts, mirror = false) {
  c.save(); c.translate(x, feetY); c.scale(mirror ? -s : s, s); S.inkw = 5 / s; otto(c, o); c.restore();
}
// Otto's head centre at (x, headY): for close-ups.
export const ottoHeadAt = (c: C, x: number, headY: number, s: number, o: OttoOpts, mirror = false) => ottoAt(c, x, headY + 722 * s, s, o, mirror);
export function maeAt(c: C, x: number, headY: number, s: number, o: MaeOpts) {
  c.save(); c.translate(x, headY + 770 * s); c.scale(s, s); S.inkw = 5 / s; const r = mae(c, o); c.restore(); return r;
}
export const toMae = (X: number, Y: number, x: number, headY: number, s: number): P => [(X - x) / s, (Y - headY - 770 * s) / s];
export function salAt(c: C, x: number, headY: number, s: number, o: SalOpts) {
  c.save(); c.translate(x, headY + 770 * s); c.scale(s, s); S.inkw = 5 / s; sal(c, o); c.restore();
}
export function catAt(c: C, x: number, groundY: number, s: number, o: CatOpts, front = false) {
  c.save(); c.translate(x, groundY); c.scale(s, s); S.inkw = 5 / s; (front ? catFront : catSide)(c, o); c.restore();
}
export function dexAt(c: C, x: number, seatY: number, s: number, o: DexOpts, withBlanket = true) {
  c.save(); c.translate(x, seatY); c.scale(s, s); S.inkw = 5 / s; dexOnSofa(c, o); if (withBlanket) blanket(c); c.restore();
}

function wrapLines(c: C, text: string, maxW: number, font: string) {
  c.save(); c.font = font;
  const out: string[] = []; let cur = '';
  for (const w of text.split(' ')) { const t = cur ? `${cur} ${w}` : w; if (c.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }
  if (cur) out.push(cur); c.restore(); return out;
}
// The narrator's line as a handwritten subtitle, top-left in the paint. First baseline at 260: the box starts ~195,
// below the TikTok tabs (150 px, core/platform.ts). Pushes its box to rt.text for QA.
export function subtitle(c: C, rt: Runtime) {
  const lines = rt.tl.lines.filter(l => !(l as { speaker?: string }).speaker);
  const i = lines.findIndex((l, k) => rt.t >= l.start - 0.08 && rt.t < Math.min(l.end + 0.5, lines[k + 1]?.start ?? 1e9));
  if (i < 0) return;
  const font = '80px Gaegu', ls = wrapLines(c, lines[i].text, W - 150, font);
  c.save(); c.font = font; c.fillStyle = 'rgba(240,234,218,0.95)';
  c.shadowColor = 'rgba(20,14,8,0.55)'; c.shadowBlur = 14;
  ls.forEach((l, k) => c.fillText(l, 70, 260 + k * 86));
  c.restore();
  rt.text.push({ text: lines[i].text, x0: 70, y0: 195, x1: W - 80, y1: 260 + (ls.length - 1) * 86 + 22, size: 80 });
}

export function paintedEpisode(shots: Record<string, Shot>) {
  return defineScene({
    fonts: FONTS,
    setup({ tl }) {
      const missing = tl.shots.map(s => s.id).filter(id => !shots[id]);
      if (missing.length) throw new Error(`scene.ts has no shot for: ${missing.join(', ')}`);
      paintPlates(); prepareOverlay(W, H);
    },
    render(c, rt) {
      S.boil = Math.floor(rt.f / 2);
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      shots[rt.shot.id](c, onTwos(rt.local), rt);
      subtitle(c, rt);
      finish(c, rt.f);
    },
  });
}
