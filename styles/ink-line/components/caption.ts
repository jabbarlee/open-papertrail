// Ink-line captions: the picture fades softly into the paper above the caption band,
// then the words come in as they're spoken (`wordCaptions`), bottom-anchored in the band.
import { bandBaselines, CAPTION_BAND as BAND } from '../../../core/platform.ts';
import type { Runtime } from '../../../core/scene.ts';
import { drawPaperRegion } from './paper.ts';
import { P } from './palette.ts';
import { serif, writeOn } from './type.ts';
import { drawText, type TextOpts } from '../../../core/canvas/kit.ts';

export interface Caption { text: string; p: number; color: string; size: number }

// Paper over everything below the picture, with a 70 px soft edge.
export function captionPlate(c: CanvasRenderingContext2D, H: number): void {
  const edge = 70, top = BAND.top - edge;
  for (let i = 0; i < edge; i += 5) drawPaperRegion(c, top + i, 5, (i + 5) / edge);
  drawPaperRegion(c, BAND.top, H - BAND.top, 1);
}

export function drawCaptions(c: CanvasRenderingContext2D, rt: Runtime, caps: Caption[]): void {
  for (const cap of caps) {
    const lines = cap.text.split('\n'), size = Math.min(cap.size, lines.length > 1 ? 108 : 120);
    const ys = bandBaselines(lines.length, size, 1.02);
    lines.forEach((line, i) => writeOn(c, rt, line, BAND.left, ys[i],
      { ...serif(size, cap.color ?? P.ink), maxWidth: BAND.right - BAND.left, minSize: 64 }, cap.p * lines.length - i));
  }
}

// Word by word: each spoken word fades and rises into place at the moment it's said (its timestamp in the
// timeline), so the captions follow the voice exactly. Lines wrap to the band; a page holds `maxLines` lines and
// clears when the next page's first word is spoken.
export interface TimedWord { text: string; start: number }

const LEAD = 0.05, FADE = 0.16, RISE = 16;

export function wordAlpha(t: number, start: number): number {
  const k = Math.min(1, Math.max(0, (t - (start - LEAD)) / FADE));
  return 1 - Math.pow(1 - k, 3);
}

// One word, faded in at its time; returns nothing drawn before it starts.
export function fadeWord(c: CanvasRenderingContext2D, rt: Runtime, text: string, x: number, y: number, start: number, o: TextOpts): void {
  const a = wordAlpha(rt.t, start);
  if (a <= 0) return;
  c.save(); c.globalAlpha *= a;
  drawText(c, rt, text, x, y + (1 - a) * RISE, o);
  c.restore();
}

export function wordCaptions(c: CanvasRenderingContext2D, rt: Runtime, words: TimedWord[], o: { size?: number; color?: string; maxLines?: number } = {}): void {
  if (!words.length) return;
  const size = o.size ?? 88, maxLines = o.maxLines ?? 2, opts = serif(size, o.color ?? P.ink);
  c.save();
  c.font = `400 ${size}px "${opts.font}"`;
  const space = c.measureText(' ').width, width = BAND.right - BAND.left;
  // Pages follow the speech: words are grouped into phrases (split after , . ? ! ; :), phrases are packed into
  // a page while it still fits in maxLines, and a phrase longer than a page is split by lines.
  const widths = words.map(wd => c.measureText(wd.text).width);
  c.restore();
  const wrap = (ids: number[]): number[][] => {
    const out: number[][] = [[]];
    let w = 0;
    for (const i of ids) {
      if (out.at(-1)!.length && w + space + widths[i] > width) { out.push([]); w = 0; }
      w += (out.at(-1)!.length ? space : 0) + widths[i];
      out.at(-1)!.push(i);
    }
    return out;
  };
  const phrases: number[][] = [[]];
  words.forEach((wd, i) => { phrases.at(-1)!.push(i); if (/[,.?!;:]$/.test(wd.text) && i < words.length - 1) phrases.push([]); });
  // A run of words too long for one page is cut into k pages of about equal width (no orphan last line).
  const balance = (ids: number[]): number[][] => {
    const k = Math.ceil(wrap(ids).length / maxLines);
    if (k <= 1) return [ids];
    const total = ids.reduce((sum, i) => sum + widths[i] + space, 0), out: number[][] = [[]];
    let acc = 0;
    for (const i of ids) {
      if (out.length < k && out.at(-1)!.length && acc + (widths[i] + space) / 2 > total * out.length / k) out.push([]);
      out.at(-1)!.push(i); acc += widths[i] + space;
    }
    return out;
  };
  const runs: number[][] = [];
  let cur: number[] = [];
  for (const ph of phrases) {
    if (cur.length && wrap([...cur, ...ph]).length > maxLines) { runs.push(cur); cur = []; }
    cur.push(...ph);
  }
  if (cur.length) runs.push(cur);
  const pages: number[][][] = runs.flatMap(balance).map(wrap);
  // The page on screen: the last one whose first word has started.
  let page = 0;
  pages.forEach((pg, i) => { if (rt.t >= words[pg[0][0]].start - LEAD) page = i; });
  // Anchored to the top line of a full page, so a one-line page reads from the same place as a two-line one.
  const ys = bandBaselines(maxLines, size, 1.04).map(y => y - RISE);  // room for the rise-in
  pages[page].forEach((line, li) => {
    let x = BAND.left;
    c.save(); c.font = `400 ${size}px "${opts.font}"`;
    const xs = line.map(i => { const at = x; x += c.measureText(words[i].text).width + space; return at; });
    c.restore();
    line.forEach((i, k) => fadeWord(c, rt, words[i].text, xs[k], ys[li], words[i].start, opts));
  });
}

// Big on-screen text (a message, a note) revealed word by word with the voice: `lines` hold the spoken words in
// order, and each word appears when it's said.
export function wordLines(c: CanvasRenderingContext2D, rt: Runtime, lines: string[], words: TimedWord[], x: number, y: number, lineGap: number, o: TextOpts): void {
  let n = 0;
  c.save(); c.font = `${o.weight ?? '400'} ${o.size}px "${o.font}"`;
  const space = c.measureText(' ').width;
  const placed = lines.map((line, li) => {
    let cx = x;
    return line.split(' ').map(text => { const at = cx; cx += c.measureText(text).width + space; return { text, x: at, y: y + li * lineGap, start: words[n++]?.start ?? Infinity }; });
  }).flat();
  c.restore();
  for (const p of placed) fadeWord(c, rt, p.text, p.x, p.y, p.start, o);
}

// The spoken words of the shot on screen, lowercase as the captions are set.
export function shotWords(rt: Runtime): TimedWord[] {
  const s = rt.shot;
  if (s.firstWord < 0 || s.lastWord < 0) return [];
  return rt.tl.words.slice(s.firstWord, s.lastWord + 1).map(w => ({ text: w.text.toLowerCase(), start: w.start }));
}
