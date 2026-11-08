// The ink-line episode shell: everything an episode's scene.ts needs besides its own objects and shots.
//   export default inkEpisode({ s01(c, rt) { ... }, s02 ... }, { noCaption: ['s04'] })
// Every frame: bone paper, the shot, the paper plate under the picture, the word-by-word caption, grain.
import { defineScene, type Runtime, type Scene } from '../../../core/scene.ts';
import { clamp } from '../../../core/canvas/kit.ts';
import { FONTS } from './palette.ts';
import { drawGrain, drawPaper, makePaper } from './paper.ts';
import { captionPlate, shotWords, wordCaptions } from './caption.ts';

export type Shot = (c: CanvasRenderingContext2D, rt: Runtime) => void;

export const dur = (rt: Runtime) => rt.shot.end - rt.shot.start;

// How far through this shot's spoken words we are, 0..1 (1 for a wordless shot).
export function spoken(rt: Runtime): number {
  const { words } = rt.tl, s = rt.shot;
  if (s.firstWord < 0 || s.lastWord < 0) return 1;
  const a = words[s.firstWord].start, b = words[s.lastWord].end;
  return clamp((rt.t - a) / Math.max(0.1, b - a));
}

// When a spoken word starts, in seconds since this shot began; `fallback` is a fraction of the shot.
// Time every beat from the words, never fixed seconds.
export function wordT(rt: Runtime, w: string, fallback: number): number {
  const { words } = rt.tl, s = rt.shot, norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9']/g, '');
  for (let i = s.firstWord; i >= 0 && i <= s.lastWord; i++) if (norm(words[i].text) === norm(w)) return words[i].start - s.start;
  return fallback * dur(rt);
}

// noCaption: shots whose spoken words are already the picture (drawn with wordLines), so no caption goes under them.
export function inkEpisode(shots: Record<string, Shot>, o: { noCaption?: string[] } = {}): Scene {
  const skip = new Set(o.noCaption ?? []);
  return defineScene({
    fonts: FONTS,
    setup({ W, H }) { makePaper(W, H); },
    render(c, rt) {
      drawPaper(c);
      const shot = shots[rt.shot.id];
      if (!shot) throw new Error(`scene.ts has no shot "${rt.shot.id}"`);
      shot(c, rt);
      captionPlate(c, rt.H);
      if (!skip.has(rt.shot.id)) wordCaptions(c, rt, shotWords(rt));
      drawGrain(c, rt.f, rt.W, rt.H);
    },
  });
}
