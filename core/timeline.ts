import path from 'node:path';
import { loadEpisode, readJson, readScriptLines, writeJson } from './paths.ts';
import type { Line, PackConfig, Shot, StoryboardShot, Timeline, Word } from './types.ts';

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');
const tokens = (s: string) => s.split(/\s+/).map(norm).filter(Boolean);

// Finds `want` as a run of spoken words starting at or after `from`. Returns the index of its first word.
function locate(words: Word[], want: string[], from: number, label: string): number {
  for (let i = from; i + want.length <= words.length; i++) {
    if (want.every((w, k) => norm(words[i + k].text) === w)) return i;
  }
  const near = words.slice(from, from + 8).map(w => w.text).join(' ');
  throw new Error(`${label}: can't find "${want.join(' ')}" in the voiceover after word ${from} ("${near}…")`);
}

// Resolves storyboard shots and script lines against the word timings into one frame-exact timeline.
export function buildTimeline(dir: string, pack: PackConfig): Timeline {
  const ep = loadEpisode(dir);
  const words = readJson<Word[]>(path.join(dir, 'words.json'));
  const board = readJson<{ shots: StoryboardShot[] }>(path.join(dir, 'storyboard.json')).shots;
  const { fps, width, height } = pack.video;
  const snap = (t: number) => Math.max(0, Math.round(t * fps) / fps);

  let cursor = 0;
  const lines: Line[] = readScriptLines(dir).map(({ text, speaker }, n) => {
    const want = tokens(text);
    const i = locate(words, want, cursor, `script line ${n + 1}`);
    cursor = i + want.length;
    return { text, start: words[i].start, end: words[cursor - 1].end, ...(speaker ? { speaker } : {}) };
  });
  if (cursor !== words.length) throw new Error(`Voiceover has ${words.length - cursor} words the script doesn't (regenerate the voice)`);

  const voiceEnd = words.at(-1)!.end;
  const tail = ep.endCard ? pack.tail.endCardSeconds : pack.tail.noEndCardSeconds;
  cursor = 0;
  const shots: Shot[] = [];
  for (const s of board) {
    const prev = shots.at(-1);
    if (!s.words.trim()) {
      // Wordless shots (end card, tail) only come after the last spoken word, one after another.
      if (cursor < words.length) throw new Error(`shot ${s.id} has no words but the voice isn't finished; only shots after the last word can be wordless`);
      const start = prev && prev.firstWord < 0 ? prev.end : snap(voiceEnd + (prev?.hold ?? 0.2));
      if (prev && prev.firstWord >= 0) prev.end = start;
      shots.push({ ...s, start, end: snap(start + (s.seconds ?? tail)), firstWord: -1, lastWord: -1 });
      continue;
    }
    const want = tokens(s.words);
    const i = locate(words, want, cursor, `shot ${s.id}`);
    if (prev && i !== cursor) {
      throw new Error(`shot ${s.id} skips "${words.slice(cursor, i).map(w => w.text).join(' ')}"; every spoken word must belong to a shot`);
    }
    cursor = i + want.length;
    const start = prev ? snap(words[i].start - (s.lead ?? pack.cutLeadSeconds)) : 0;
    if (prev && start <= prev.start) throw new Error(`shot ${s.id}: its lead cuts before shot ${prev.id} starts`);
    if (prev) prev.end = start;
    shots.push({ ...s, start, end: snap(voiceEnd + tail), firstWord: i, lastWord: cursor - 1 });
  }
  if (cursor !== words.length) throw new Error(`The storyboard leaves "${words.slice(cursor).map(w => w.text).join(' ')}" without a shot`);

  const duration = shots.at(-1)!.end;
  const timeline: Timeline = { fps, width, height, duration, words, lines, shots, endCard: ep.endCard };
  writeJson(path.join(dir, 'timeline.json'), timeline);
  return timeline;
}

export const shotFrames = (s: Shot, fps: number) => [Math.round(s.start * fps), Math.round(s.end * fps)] as const;
