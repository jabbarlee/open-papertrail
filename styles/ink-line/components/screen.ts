// Screens in ink: a phone outline, message bubbles, list rows and waveforms, all drawn with the brush line.
// People only ever appear as what they leave behind (their bubbles, their names), never as figures.
import { inv, type Pt } from '../../../core/canvas/kit.ts';
import type { Runtime } from '../../../core/scene.ts';
import { ink, inkBox } from './ink.ts';
import { FONT, P } from './palette.ts';
import { hand, writeOn } from './type.ts';

// A phone seen straight on, big enough that its screen is the shot. p draws it on.
export function phone(c: CanvasRenderingContext2D, f: number, x: number, y: number, w: number, h: number, p = 1, seed = 500): void {
  inkBox(c, f, x, y, w, h, { width: 13, seed, progress: p });
  ink(c, f, [[x + w / 2 - 70, y + 34], [x + w / 2 + 70, y + 33]], { width: 9, seed: seed + 1, progress: inv(0.5, 1, p) });
}

// A message bubble with a tail. mine = the narrator's (cobalt text, tail right), else ink and tail left.
export function bubble(c: CanvasRenderingContext2D, rt: Runtime, text: string, x: number, y: number, w: number,
  o: { mine?: boolean; p?: number; size?: number; seed?: number; lines?: number } = {}): number {
  const p = o.p ?? 1, size = o.size ?? 58, lines = o.lines ?? text.split('\n').length, seed = o.seed ?? 600;
  const h = 46 + lines * size * 1.15;
  const tail: Pt[] = o.mine ? [[x + w - 60, y + h], [x + w + 18, y + h + 26], [x + w - 20, y + h - 4]] : [[x + 60, y + h], [x - 18, y + h + 26], [x + 20, y + h - 4]];
  const k = inv(0, 0.45, p);
  inkBox(c, rt.f, x, y, w, h, { width: 8, seed, progress: k, color: o.mine ? P.cobalt : P.ink });
  ink(c, rt.f, tail, { width: 7, seed: seed + 3, progress: inv(0.3, 0.5, p), per: 6, color: o.mine ? P.cobalt : P.ink });
  writeOn(c, rt, text, x + 32, y + 26 + size, { ...hand(size, o.mine ? P.cobalt : P.ink), lineHeight: 1.15, maxWidth: w - 60 }, inv(0.4, 1, p));
  return h;
}

// A hand-ruled divider under a list row.
export function rule(c: CanvasRenderingContext2D, f: number, x0: number, x1: number, y: number, p = 1, seed = 700, color = P.soft): void {
  ink(c, f, [[x0, y], [(x0 + x1) / 2, y + 2], [x1, y - 1]], { width: 4, seed, progress: p, color });
}

// A voice-message waveform: bars drawn as short brush strokes, `played` 0..1 turns them cobalt.
export function waveform(c: CanvasRenderingContext2D, f: number, x: number, y: number, w: number, bars: number, p = 1, played = 0, seed = 800): void {
  for (let i = 0; i < bars; i++) {
    const k = inv(i / bars * 0.7, i / bars * 0.7 + 0.3, p);
    if (k <= 0) continue;
    const h = 14 + 62 * Math.abs(Math.sin(i * 1.7 + seed) * Math.sin(i * 0.43 + 1.3));
    const bx = x + (i + 0.5) * (w / bars);
    ink(c, f, [[bx, y - h / 2 * k], [bx, y + h / 2 * k]], { width: 9, seed: seed + i, color: i / bars < played ? P.cobalt : P.ink });
  }
}
