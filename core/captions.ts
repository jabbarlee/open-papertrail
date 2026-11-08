// Spoken-word captions in short chunks: 1-4 words that never split a phrase, each on screen for at
// least 0.6 s, so they can be read at a glance (research/2026-10-22-retention-pacing.md).
// Format-agnostic: a pack decides how a chunk looks; this decides what's in it and when.
import type { Timeline, Word } from './types.ts';

export interface Chunk { words: Word[]; first: number; start: number; end: number; text: string }

const SMALL = new Set(['a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'for', 'and', 'but', 'or', 'so', 'my', 'your', 'their', 'his', 'her', 'our', 'is', 'was', 'i', "i'm", 'you', 'it', 'that', 'with', 'from', 'just']);
const bare = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');

export function captionChunks(tl: Timeline, maxWords = 4, maxChars = 18): Chunk[] {
  const chunks: Chunk[] = [];
  // Line ends are hard breaks: a chunk never spans two script lines.
  const lineEnd = new Set<number>();
  let i = 0;
  for (const l of tl.lines) { i += l.text.split(/\s+/).filter(Boolean).length; lineEnd.add(i - 1); }
  let cur: number[] = [];
  const flush = () => {
    if (!cur.length) return;
    const ws = cur.map(k => tl.words[k]);
    chunks.push({ words: ws, first: cur[0], start: ws[0].start, end: ws.at(-1)!.end, text: ws.map(w => w.text).join(' ') });
    cur = [];
  };
  tl.words.forEach((w, k) => {
    const chars = cur.reduce((n, j) => n + tl.words[j].text.length + 1, 0) + w.text.length;
    if (cur.length && (cur.length >= maxWords || chars > maxChars)) {
      // Don't leave a dangling small word ("the", "to") at the end of a chunk: carry it over.
      const last = cur.at(-1)!;
      if (cur.length > 1 && SMALL.has(bare(tl.words[last].text))) { cur.pop(); flush(); cur = [last]; }
      else flush();
    }
    cur.push(k);
    if (lineEnd.has(k) || /[.,!?;:…—]$/.test(w.text)) flush();
  });
  flush();
  // Hold each chunk until the next one starts (or at least 0.6 s), so the screen is never blank mid-line.
  chunks.forEach((c, n) => {
    const next = chunks[n + 1];
    c.end = next ? Math.max(c.end, Math.min(next.start, c.start + 2.5)) : c.end + 0.4;
    if (c.end - c.start < 0.6) c.end = next ? Math.max(c.end, Math.min(next.start, c.start + 0.6)) : c.start + 0.6;
  });
  return chunks;
}

export const chunkAt = (chunks: Chunk[], t: number) => chunks.find(c => c.start <= t && t < c.end) ?? null;
