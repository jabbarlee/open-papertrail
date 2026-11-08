// Writes timeline.json from words.json and a shot list: npx tsx series/flat-grain/components/timeline.ts <episode> <tail seconds> '[["s01",0,"what we see"],["s02",10,"..."]]'
// Each shot is [id, index of its first word, what it draws]. Tail is the silent reveal after the last word.
import path from 'node:path';
import { episodeDir, readJson, readScriptLines, writeJson } from '../../../core/paths.ts';

const dir = episodeDir(process.argv[2]), tail = Number(process.argv[3] ?? 1.4), shots = JSON.parse(process.argv[4]) as [string, number, string][];
const words = readJson<{ text: string; start: number; end: number }[]>(path.join(dir, 'words.json')).map(({ text, start, end }) => ({ text, start, end }));
const r2 = (x: number) => Math.round(x * 100) / 100;
let i = 0;
const lines = readScriptLines(dir).map(l => { const n = l.text.split(/\s+/).length, line = { text: l.text, start: words[i].start, end: words[i + n - 1].end }; i += n; return line; });
if (i !== words.length) throw new Error(`script has ${i} words, the take has ${words.length}`);
const duration = r2(words[words.length - 1].end + tail);
writeJson(path.join(dir, 'timeline.json'), {
  fps: 30, width: 1080, height: 1920, duration, words, lines, endCard: false,
  shots: shots.map(([id, first, draw], k) => {
    const next = shots[k + 1], last = next ? next[1] - 1 : words.length - 1;
    return { id, words: words.slice(first, last + 1).map(w => w.text).join(' '), draw, moves: draw, change: draw, start: k ? r2(words[first].start - 0.1) : 0, end: next ? r2(words[next[1]].start - 0.1) : duration, firstWord: first, lastWord: last };
  }),
});
console.log(`timeline.json: ${duration}s, ${shots.length} shots`);
