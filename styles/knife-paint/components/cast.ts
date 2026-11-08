// The cast: elongated fashion-illustration figures in profile (facing right), flat skin, black hair, one fine line for
// the eye, and clothes made of knife-painted folds and bands, as in the reference painting. Every figure is painted
// once into a Sprite at its frame position: (x, feetY) is the point between the feet, s the scale (1 = ~1000 px tall).
import { stroke, ribbon, line, fillPoly, fillStrokes, rough, smooth, pick, rng, lerp, vnoise, pathOf, T_POINT, T_BRUSH, type C, type P } from './paint.ts';
import { sprite, type Sprite } from './studio.ts';
import type { FinishOpts } from './paint.ts';

type Draw = (g: C) => void;
const local = (sp: Sprite, o: FinishOpts, x: number, y: number, s: number, flip: boolean, draw: Draw) =>
  sp.pass(o, g => { g.save(); g.translate(x, y); g.scale(flip ? -s : s, s); draw(g); g.restore(); });
const tr = (pts: P[], dx: number, dy: number, k = 1): P[] => pts.map(([x, y]) => [x * k + dx, y * k + dy]);

export const INK = '#120D0F';
export const SKINS = { umber: '#784529', tan: '#9A6A48', fair: '#D9B9A0', olive: '#A57B55', deep: '#5C3420' };
export const HAIRS = { black: '#0B0A09', brown: '#3A2418', auburn: '#6E3220', grey: '#8D8780' };

export interface Palette { base: string; mid: string[]; dark: string[]; light: string[] }
export const CLOTH: Record<string, Palette> = {
  plum: { base: '#5E3644', mid: ['#5C3944', '#633A4A', '#55303D'], dark: ['#141012', '#1A1216'], light: ['#815E6E', '#8A6676'] },
  mauve: { base: '#8E5A93', mid: ['#93609A', '#875489', '#9C68A0'], dark: ['#4E2752', '#5A2E5E'], light: ['#B78BBB', '#C29BC4'] },
  tyrian: { base: '#5B2148', mid: ['#62264F', '#55203F', '#6B2C58'], dark: ['#240A1C', '#2E0F24'], light: ['#8A4877', '#94547F'] },
  linen: { base: '#D8CDB6', mid: ['#D2C6AE', '#DDD3BD', '#CABEA6'], dark: ['#A99C82', '#9F927A'], light: ['#EEE6D6', '#E8E0CE'] },
  sage: { base: '#A6AE9C', mid: ['#A0A996', '#ADB4A2'], dark: ['#6F7868', '#7A8372'], light: ['#C6CCBC', '#CED3C5'] },
  slate: { base: '#6E7178', mid: ['#73767E', '#696C73'], dark: ['#3E4046', '#45474D'], light: ['#9497A0', '#8C8F97'] },
  rust: { base: '#9A4C2E', mid: ['#A2533A', '#924630'], dark: ['#5A2817', '#4E2213'], light: ['#C2714F', '#B9684A'] },
  coat: { base: '#2C2624', mid: ['#302A27', '#28221F', '#352E2A'], dark: ['#0E0B0A', '#141110'], light: ['#4E4642', '#58504B'] },
  grey: { base: '#7C7F80', mid: ['#828586', '#76797A'], dark: ['#4A4C4E', '#424446'], light: ['#A2A5A6', '#9A9D9E'] },
  smock: { base: '#C9B48E', mid: ['#CDB892', '#C2AD86'], dark: ['#8C7652', '#7E6A48'], light: ['#E2D3B2', '#DCCCAA'] },
  ochre: { base: '#B98B4E', mid: ['#B4864A', '#C29454'], dark: ['#7A5528', '#6C4A22'], light: ['#D8B47C', '#DDBB86'] },
};

// ---------- the head (archer reference: profile right, centre 0,0, ~100 px tall) ----------
const FACE: P[] = [[36, -28], [41, -16], [44, -2], [46, 8], [50, 19], [44, 23], [44, 28], [41, 31], [42, 37], [37, 43], [28, 47], [17, 46], [7, 40], [-3, 33], [-13, 31], [-29, 26], [-41, 12], [-45, -8], [-39, -28], [-23, -42], [0, -48], [22, -42]];
const HAIR_BUN: P[] = [[-42, -18], [-34, -35], [-20, -45], [-2, -50], [16, -48], [30, -41], [38, -30], [33, -24], [18, -22], [3, -16], [-9, -6], [-17, 4], [-22, 18], [-25, 32], [-34, 34], [-44, 22], [-48, 4]];
const HAIR_SHORT: P[] = [[-44, -10], [-38, -32], [-22, -46], [0, -51], [20, -48], [34, -38], [40, -26], [30, -27], [16, -30], [2, -26], [-8, -14], [-13, 0], [-22, 12], [-34, 16], [-44, 8]];
const NECK = (lean = 0): P[] => [[-12, 24], [16, 36], [18 + lean, 64], [22 + lean, 116], [-10 + lean, 116], [-8 + lean, 62]];

export interface HeadOpts { skin: string; hair: string; style: 'bun' | 'short' | 'low-bun'; crown?: boolean; wreath?: boolean; helmet?: boolean; beard?: boolean }
/** Paint a head (and neck) into a sprite, centred at (x, y) in frame coords, k = size (1 = 100 px). */
export function paintHead(sp: Sprite, x: number, y: number, k: number, flip: boolean, o: HeadOpts) {
  const r = rng(Math.round(x * 3 + y));
  const at = (pts: P[]) => smooth(rough(tr(pts, 0, 0), 0.6, Math.round(x + y), 0.1), 1.5, true);
  local(sp, { dry: 0.12, relief: 0.2 }, x, y, k, flip, g => {
    fillPoly(g, smooth(NECK(), 2, true), o.skin);
    fillPoly(g, at(FACE), o.skin);
  });
  local(sp, { dry: 0.1, relief: 0.3 }, x, y, k, flip, g => {
    if (o.helmet) return;
    fillPoly(g, at(o.style === 'short' ? HAIR_SHORT : HAIR_BUN), o.hair);
    if (o.style === 'bun') for (const [bx, by, br] of [[-60, 12, 12], [-66, 28, 10], [-56, 41, 9], [-48, 25, 8]]) { g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.fillStyle = o.hair; g.fill(); }
    if (o.style === 'low-bun') for (const [bx, by, br] of [[-50, 30, 14], [-40, 40, 11]]) { g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.fillStyle = o.hair; g.fill(); }
    if (o.style === 'short') fillPoly(g, [[-12, -2], [-4, -4], [-2, 20], [-9, 22]], o.hair);
    // a full beard along the jaw, and a moustache
    if (o.beard) {
      fillPoly(g, smooth([[-6, 4], [2, 22], [14, 30], [30, 30], [40, 34], [44, 42], [36, 56], [20, 62], [4, 56], [-8, 42], [-14, 26]], 1.5, true), o.hair);
      fillPoly(g, smooth([[30, 26], [44, 27], [46, 31], [36, 32], [28, 31]], 1, true), o.hair);
    }
  });
  local(sp, { dry: 0.05, relief: 0.15 }, x, y, k, flip, g => {
    line(g, [[22, 3], [29, 1], [36, 4]], 1.4, 1.0, '#1A0F0A');
    g.beginPath(); g.arc(31, 6.5, 1.9, 0, Math.PI * 2); g.fillStyle = '#1A0F0A'; g.fill();
    line(g, [[-13, 4], [-19, 10], [-19, 19], [-13, 25]], 1.3, 1.0, '#1A0F0A', 0.85);
    if (o.style === 'bun') for (const [bx, by, br, a0] of [[-60, 12, 6, 0.5], [-66, 29, 5, 2.2], [-56, 41, 4, 4]]) {
      const pts: P[] = []; for (let i = 0; i <= 10; i++) { const a = a0 + i / 10 * Math.PI * 1.4; pts.push([bx + Math.cos(a) * br, by + Math.sin(a) * br]); }
      line(g, pts, 0.8, 0.3, '#5A534C', 0.8);
    }
    if (o.style !== 'short') line(g, [[4, -14], [0, 6], [3, 28], [9, 45]], 0.9, 0.35, o.hair, 0.9);
    line(g, [[-24, -37], [-6, -44], [16, -42]], 1.1, 0.4, '#4A4440', 0.7);
    if (o.crown) {
      fillPoly(g, [[-26, -44], [16, -50], [14, -62], [8, -55], [2, -68], [-4, -55], [-12, -66], [-16, -53], [-24, -60]], '#C9A44A');
      line(g, [[-26, -45], [16, -51]], 2.5, 2.5, '#8C6A22');
      for (const [cx, cy] of [[2, -70], [-12, -68]] as P[]) { g.beginPath(); g.arc(cx, cy, 2.4, 0, 7); g.fillStyle = '#E9E2D2'; g.fill(); }
    }
    if (o.wreath) {
      for (let i = 0; i < 16; i++) {
        const a = Math.PI * (1.05 + i / 15 * 0.95), cx = Math.cos(a) * 44 + 2, cy = Math.sin(a) * 40 - 14;
        const la = a + Math.PI / 2 + (i % 2 ? 0.6 : -0.6);
        line(g, [[cx, cy], [cx + Math.cos(la) * 13, cy + Math.sin(la) * 13]], 6, 1, i % 3 ? '#4F6B33' : '#62803F');
      }
    }
    if (o.helmet) {
      fillPoly(g, smooth([[-46, 6], [-44, -30], [-26, -50], [4, -54], [32, -42], [42, -22], [34, -18], [10, -20], [-6, -10], [-14, 10], [-30, 18]], 2, true), '#A9803E');
      line(g, [[-40, -10], [36, -26]], 2.2, 2.2, '#6E5126');
      // crest
      const pts: P[] = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * (1.15 + i / 12 * 0.75); pts.push([Math.cos(a) * 56 - 4, Math.sin(a) * 50 - 18]); }
      for (let i = 0; i < pts.length; i++) line(g, [pts[i], [pts[i][0] * 1.05 - 6, pts[i][1] - 26]], 7, 2, i % 2 ? '#A3301F' : '#8E2618');
    }
  });
  void r;
}

// ---------- cloth ----------
export interface GarmentOpts { pal: Palette; dir?: (x: number, y: number) => number; folds?: P[][]; foldW?: [number, number]; bands?: { top: (u: number) => P; bottom: (u: number) => P; n: number; w: number }; seed: number; texture?: number }
/** A garment in local coords: flat base, strokes along the form, dark folds or bands, dry light sheen. */
export function garment(sp: Sprite, x: number, y: number, s: number, flip: boolean, poly: P[], o: GarmentOpts) {
  const r = rng(o.seed);
  const pg = smooth(rough(poly, 4, o.seed, 0.05), 3, true);
  const dir = o.dir ?? (() => Math.PI / 2);
  local(sp, { dry: 0.3, relief: 0.4, soften: 1.2 }, x, y, s, flip, g => {
    fillPoly(g, pg, o.pal.base);
    fillStrokes(g, r, pg, dir, { colors: o.pal.mid, len: [40, 110], wid: [12, 26], density: o.texture ?? 1.2, stroke: { load: 0.6, fade: 0.4, coherence: 0.85 } });
  });
  if (o.bands || o.folds) local(sp, { dry: 0.45, relief: 0.7, soften: 1, patch: 0.3 }, x, y, s, flip, g => {
    g.save(); pathOf(g, pg); g.clip();
    if (o.bands) {
      const B = o.bands;
      for (let i = 0; i < B.n; i++) {
        const u = (i + 0.3 + r() * 0.35) / B.n, pts: P[] = [];
        for (let k = 0; k <= 8; k++) { const v = k / 8, a = B.top(u), b = B.bottom(u + (vnoise(k * 0.7, i, o.seed) - 0.5) * 0.012); pts.push([lerp(a[0], b[0], Math.pow(v, 1.1)), lerp(a[1], b[1], v)]); }
        ribbon(g, r, pts, B.w * (0.8 + r() * 0.4), pick(r, o.pal.dark), { taper: u2 => 0.1 + 0.9 * Math.pow(u2, 0.9), load: 1, fade: 0.05, ragged: 0.22 });
      }
    }
    for (const f of o.folds ?? []) {
      const [w0, w1] = o.foldW ?? [10, 22];
      ribbon(g, r, f, lerp(w0, w1, r()), pick(r, o.pal.dark), { taper: T_POINT, load: 0.95, fade: 0.2, ragged: 0.25 });
    }
    g.restore();
  });
  local(sp, { dry: 0.9, relief: 0.5 }, x, y, s, flip, g => {
    g.save(); pathOf(g, pg); g.clip();
    const [x0, y0, x1, y1] = pg.reduce((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])], [1e9, 1e9, -1e9, -1e9]);
    for (let i = 0; i < 40; i++) {
      const px = lerp(x0, x1, r()), py = lerp(y0, y1, r()), a = dir(px, py), L = 20 + r() * 40;
      stroke(g, r, [[px - Math.cos(a) * L / 2, py - Math.sin(a) * L / 2], [px + Math.cos(a) * L / 2, py + Math.sin(a) * L / 2]], 4 + r() * 8, pick(r, o.pal.light), { load: 0.5, fade: 0.6 });
    }
    g.restore();
  });
}

export function skin(sp: Sprite, x: number, y: number, s: number, flip: boolean, poly: P[], color: string) {
  local(sp, { dry: 0.12, relief: 0.2 }, x, y, s, flip, g => fillPoly(g, smooth(rough(poly, 1.2, 7, 0.1), 2, true), color));
}

// ---------- figures: body, head and near arm are separate sprites, so they can move ----------
export interface Fig { body: Sprite; head: Sprite; arm: Sprite; x: number; feetY: number; s: number; flip: boolean; shoulder: P; neck: P; hand0: P }
export interface FigPose { dx?: number; dy?: number; arm?: number; head?: number; lean?: number; alpha?: number; scale?: number }
const HEAD_C: P = [12, -905], NECK_P: P = [16, -812], SHOULDER: P = [16, -784], HAND: P = [22, -560];
const at = (x: number, y: number, s: number, flip: boolean, p: P): P => [x + (flip ? -p[0] : p[0]) * s, y + p[1] * s];
function fig(key: string, x: number, feetY: number, s: number, flip: boolean, paintBody: (sp: Sprite) => void, paintArm: (sp: Sprite) => void, head: HeadOpts): Fig {
  const body = sprite(`${key}:body`, [x - 320 * s, feetY - 960 * s, x + 320 * s, feetY + 14], paintBody);
  const hc = at(x, feetY, s, flip, HEAD_C);
  const headSp = sprite(`${key}:head`, [hc[0] - 110 * s, hc[1] - 110 * s, hc[0] + 110 * s, hc[1] + 110 * s], sp => paintHead(sp, hc[0], hc[1], s, flip, head));
  const arm = sprite(`${key}:arm`, [x - 100 * s, feetY - 820 * s, x + 140 * s, feetY - 500 * s], paintArm);
  return { body, head: headSp, arm, x, feetY, s, flip, shoulder: at(x, feetY, s, flip, SHOULDER), neck: at(x, feetY, s, flip, NECK_P), hand0: at(x, feetY, s, flip, HAND) };
}
/** Draw a figure: shift it, lean it about the feet, swing the near arm (radians, - is forward), tilt the head. */
export function drawFig(c: C, F: Fig, p: FigPose = {}) {
  const k = F.flip ? -1 : 1;
  c.save(); c.globalAlpha = p.alpha ?? 1;
  c.translate(F.x + (p.dx ?? 0), F.feetY + (p.dy ?? 0)); if (p.lean) c.rotate(p.lean * k); if (p.scale) c.scale(p.scale, p.scale); c.translate(-F.x, -F.feetY);
  F.head.put(c, { rot: (p.head ?? 0) * k, px: F.neck[0], py: F.neck[1] });
  F.body.put(c);
  F.arm.put(c, { rot: (p.arm ?? 0) * k, px: F.shoulder[0], py: F.shoulder[1] });
  c.restore();
}
/** Where the hand is for a pose, in frame coords. */
export function handAt(F: Fig, p: FigPose = {}): P {
  const k = F.flip ? -1 : 1, a = (p.arm ?? 0) * k;
  const vx = F.hand0[0] - F.shoulder[0], vy = F.hand0[1] - F.shoulder[1];
  let hx = F.shoulder[0] + vx * Math.cos(a) - vy * Math.sin(a), hy = F.shoulder[1] + vx * Math.sin(a) + vy * Math.cos(a);
  if (p.lean) { const l = p.lean * k, dx = hx - F.x, dy = hy - F.feetY; hx = F.x + dx * Math.cos(l) - dy * Math.sin(l); hy = F.feetY + dx * Math.sin(l) + dy * Math.cos(l); }
  if (p.scale) { hx = F.x + (hx - F.x) * p.scale; hy = F.feetY + (hy - F.feetY) * p.scale; }
  return [hx + (p.dx ?? 0), hy + (p.dy ?? 0)];
}
/** A walk: bob and a small sway while moving from dx0 to dx1 between t0 and t1. */
export function walk(t: number, t0: number, t1: number, dx0: number, dx1: number) {
  const u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0))), moving = u > 0 && u < 1;
  return { dx: dx0 + (dx1 - dx0) * u, dy: moving ? -Math.abs(Math.sin(t * Math.PI * 3.2)) * 10 : 0, lean: moving ? Math.sin(t * Math.PI * 3.2) * 0.015 : 0 };
}
/** Breathing and a slow idle sway, so nobody is ever a cut-out. */
export const idle = (t: number, seed = 0): FigPose => ({ lean: Math.sin(t * 1.3 + seed) * 0.008, head: Math.sin(t * 0.9 + seed * 2) * 0.03, dy: Math.sin(t * 2.2 + seed) * 1.5 });

function straightArm(sp: Sprite, x: number, feetY: number, s: number, flip: boolean, pal: Palette, skinC: string, seed: number) {
  garment(sp, x, feetY, s, flip, [[2, -796], [32, -794], [36, -690], [32, -584], [12, -582], [0, -690]], { pal, seed, texture: 2, folds: [[[18, -770], [20, -640]]], foldW: [4, 7] });
  skin(sp, x, feetY, s, flip, [[10, -588], [34, -586], [38, -560], [28, -536], [12, -540], [6, -566]], skinC);
}

export interface LadyOpts {
  pal: Palette; cut: 'mermaid' | 'aline' | 'crinoline'; skin: string; hair: string; puff?: boolean; crown?: boolean; veil?: boolean; seed: number; flip?: boolean;
}
const GOWN: Record<LadyOpts['cut'], P[]> = {
  mermaid: [[-44, -792], [-20, -806], [-10, -800], [18, -800], [26, -806], [48, -794], [54, -740], [38, -660], [34, -600], [58, -520], [60, -440], [46, -340], [42, -280], [92, -180], [160, -70], [222, 0],
    [175, 7], [120, 2], [60, 9], [0, 3], [-60, 9], [-120, 2], [-180, 8], [-238, 0], [-170, -70], [-90, -180], [-40, -280], [-46, -340], [-60, -440], [-58, -520], [-34, -600], [-38, -660], [-48, -740]],
  aline: [[-44, -792], [-20, -806], [-10, -800], [18, -800], [26, -806], [48, -794], [54, -740], [38, -660], [32, -600], [82, -450], [150, -250], [215, 0], [150, 8], [75, 2], [0, 9], [-75, 2], [-150, 8], [-222, 0], [-150, -250], [-80, -450], [-34, -600], [-38, -660], [-48, -740]],
  crinoline: [[-44, -792], [-20, -806], [-10, -800], [18, -800], [26, -806], [48, -794], [54, -740], [38, -660], [32, -600], [120, -540], [212, -330], [262, 0], [180, 8], [90, 2], [0, 9], [-90, 2], [-180, 8], [-268, 0], [-215, -330], [-120, -540], [-34, -600], [-38, -660], [-48, -740]],
};
export function lady(key: string, x: number, feetY: number, s: number, o: LadyOpts): Fig {
  const fl = !!o.flip;
  return fig(`lady:${key}`, x, feetY, s, fl, sp => {
    const waist = -600, hemW = o.cut === 'crinoline' ? 265 : o.cut === 'mermaid' ? 230 : 218;
    const topY = o.cut === 'mermaid' ? -280 : waist, topW = o.cut === 'mermaid' ? 60 : 48;
    if (o.veil) local(sp, { dry: 0.5, relief: 0.3, opacity: 0.85, soften: 2 }, x, feetY, s, fl, g => {
      fillPoly(g, smooth([[-30, -930], [-70, -860], [-120, -700], [-170, -480], [-205, -300], [-150, -300], [-80, -560], [-30, -800]], 3, true), '#E6DFD0');
    });
    garment(sp, x, feetY, s, fl, widen(GOWN[o.cut], 1.3), {
      pal: o.pal, seed: o.seed,
      bands: { top: u => [lerp(-topW, topW, u), topY], bottom: u => [lerp(-hemW + 10, hemW - 10, u), 4 + Math.sin(u * Math.PI) * 6], n: o.cut === 'crinoline' ? 12 : 9, w: o.cut === 'crinoline' ? 30 : 34 },
      folds: o.cut === 'mermaid' ? Array.from({ length: 11 }, (_, i) => { const y = -770 + i * 44; return [[-64, y - 26], [-14, y + 4], [0, y + 10]] as P[]; }).concat(
        Array.from({ length: 11 }, (_, i) => { const y = -770 + i * 44; return [[70, y - 28], [16, y + 4], [0, y + 10]] as P[]; })) : [],
      foldW: [9, 16],
    });
    if (o.puff) garment(sp, x, feetY, s, fl, [[-24, -812], [20, -830], [62, -806], [78, -756], [66, -708], [28, -692], [-14, -712], [-30, -760]], { pal: o.pal, seed: o.seed + 1, folds: [[[-10, -796], [30, -766], [50, -726]], [[-20, -756], [10, -736], [40, -708]]], foldW: [8, 14], dir: (px, py) => Math.atan2(py + 760, px - 20) + Math.PI / 2 });
  }, sp => straightArm(sp, x, feetY, s, fl, o.pal, o.skin, o.seed + 2),
  { skin: o.skin, hair: o.hair, style: o.crown ? 'low-bun' : 'bun', crown: o.crown });
}

export interface ManOpts { pal: Palette; skin: string; hair: string; seed: number; wreath?: boolean; helmet?: boolean; toga?: boolean; flip?: boolean; trousers?: Palette; beard?: boolean }
/** A man in profile: a toga (emperor), a tunic (citizen, guard) or a frock coat (the chemist). */
export function man(key: string, x: number, feetY: number, s: number, o: ManOpts): Fig {
  const fl = !!o.flip;
  return fig(`man:${key}`, x, feetY, s, fl, sp => {
    if (o.trousers) {
      garment(sp, x, feetY, s, fl, [[-52, -470], [52, -470], [54, -10], [12, -6], [4, -300], [-6, -300], [-14, -6], [-56, -10]], { pal: o.trousers, seed: o.seed + 5 });
      local(sp, { dry: 0.1, relief: 0.3 }, x, feetY, s, fl, g => { fillPoly(g, [[-56, -14], [-14, -14], [2, 0], [-56, 2]], INK); fillPoly(g, [[12, -14], [52, -14], [70, 0], [12, 2]], INK); });
    } else {
      skin(sp, x, feetY, s, fl, [[-48, -420], [-10, -420], [-14, -10], [-46, -10]], o.skin);
      skin(sp, x, feetY, s, fl, [[8, -420], [46, -420], [44, -10], [12, -10]], o.skin);
      local(sp, { dry: 0.1, relief: 0.3 }, x, feetY, s, fl, g => { fillPoly(g, [[-50, -12], [-12, -12], [2, 2], [-50, 2]], '#4A3020'); fillPoly(g, [[10, -12], [46, -12], [64, 2], [10, 2]], '#4A3020'); });
    }
    const top: P[] = [[-50, -790], [-24, -804], [-10, -798], [16, -798], [24, -804], [46, -792]];
    const torso: P[] = o.toga
      ? [...top, [62, -700], [56, -480], [70, -200], [84, 0], [-92, 0], [-80, -300], [-72, -600], [-66, -720]]
      : o.trousers
        ? [...top, [60, -700], [52, -560], [60, -380], [72, -300], [-60, -300], [-66, -560], [-66, -720]]
        : [...top, [60, -700], [56, -540], [70, -390], [-68, -390], [-64, -560], [-66, -720]];
    garment(sp, x, feetY, s, fl, widen(torso, 1.4, 1.3), {
      pal: o.pal, seed: o.seed,
      folds: o.toga ? [[[-50, -770], [0, -640], [50, -480]], [[-60, -700], [-10, -520], [40, -380]], [[-70, -560], [-30, -380], [30, -200]], [[-60, -400], [-20, -220], [40, -40]], [[-80, -240], [-40, -100], [0, -10]], [[30, -760], [50, -620], [52, -500]]]
        : o.trousers ? [[[-10, -780], [-4, -600], [0, -420]], [[30, -560], [36, -420], [44, -320]]] : [[[-40, -770], [-20, -600], [-30, -420]], [[20, -760], [30, -600], [26, -420]]],
      foldW: o.toga ? [16, 30] : [8, 16],
    });
    if (o.trousers) local(sp, { dry: 0.15, relief: 0.3 }, x, feetY, s, fl, g => {
      // a slim shirt collar and a dark cravat at the throat
      fillPoly(g, [[-4, -812], [24, -810], [30, -790], [12, -778], [-4, -792]], '#E9E2D2');
      fillPoly(g, [[12, -800], [26, -800], [22, -772], [15, -770]], INK);
    });
  }, sp => straightArm(sp, x, feetY, s, fl, o.pal, o.skin, o.seed + 3),
  { skin: o.skin, hair: o.hair, style: 'short', wreath: o.wreath, helmet: o.helmet, beard: o.beard });
}
const widen = (pts: P[], k = 1.45, hemK = 1.12): P[] => pts.map(([x, y]) => [x * (y > -200 ? hemK : k), y]);
void T_BRUSH;
