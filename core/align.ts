// Word timings for audio that didn't come with any: a small Whisper model (run locally through
// transformers.js) hears the words, then the script's own words are matched onto what it heard.
// Unmatched script words (numbers it spelled differently, a missed word) are interpolated between
// their matched neighbours, so every script word gets a time and the timeline can always resolve.
import { env, pipeline } from '@huggingface/transformers';
import type { Word } from './types.ts';

// Model files live here between runs (cloud routines set STUDIO_MODEL_CACHE to a cached path).
if (process.env.STUDIO_MODEL_CACHE) env.cacheDir = process.env.STUDIO_MODEL_CACHE;

const MODEL = 'onnx-community/whisper-base_timestamped';
let asr: any = null;

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');

export function resample(src: Float32Array, from: number, to = 16000): Float32Array {
  const n = Math.floor((src.length * to) / from), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = (i * from) / to, j = Math.floor(p), f = p - j;
    out[i] = (src[j] ?? 0) * (1 - f) + (src[j + 1] ?? 0) * f;
  }
  return out;
}

async function hear(audio16k: Float32Array): Promise<{ text: string; start: number; end: number }[]> {
  asr ??= await pipeline('automatic-speech-recognition', MODEL, { dtype: 'q8' as any });
  const out = await asr(audio16k, { return_timestamps: 'word', language: 'en' });
  return (out.chunks ?? []).map((c: any) => ({ text: String(c.text).trim(), start: c.timestamp[0], end: c.timestamp[1] ?? c.timestamp[0] }));
}

// Aligns `script` words (as written) to audio of one line; returns times relative to that audio.
const NUMBER_WORDS = /^(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|first|second|third|percent|point)$/;

export async function alignLine(script: string[], audio16k: Float32Array): Promise<Word[]> {
  return (await alignTake(script, audio16k)).words;
}

const near = (a: string, b: string) => {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 5 || Math.abs(a.length - b.length) > 1) return false;
  let i = 0; while (i < a.length && a[i] === b[i]) i++;
  let j = 0; while (j < a.length - i && j < b.length - i && a[a.length - 1 - j] === b[b.length - 1 - j]) j++;
  return a.length - i - j <= 1 && b.length - i - j <= 1;
};

export async function alignTake(script: string[], audio16k: Float32Array): Promise<{ words: Word[]; clarity: number; missed: string[]; heard: boolean[]; transcript: string }> {
  const heard = await hear(audio16k);
  const dur = audio16k.length / 16000;
  const S = script.map(norm), H = heard.map(h => norm(h.text));
  // Edit-distance alignment over words; equal tokens are matches.
  const dp = Array.from({ length: S.length + 1 }, (_, i) => Array.from({ length: H.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= S.length; i++) for (let j = 1; j <= H.length; j++) {
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (S[i - 1] === H[j - 1] ? 0 : 1));
  }
  const match: (number | null)[] = new Array(S.length).fill(null);
  for (let i = S.length, j = H.length; i > 0 && j > 0;) {
    if (dp[i][j] === dp[i - 1][j - 1] + (S[i - 1] === H[j - 1] ? 0 : 1)) { if (S[i - 1] === H[j - 1]) match[i - 1] = j - 1; i--; j--; }
    else if (dp[i][j] === dp[i - 1][j] + 1) i--;
    else j--;
  }
  const digits = H.some(h => /\d/.test(h));
  const joined = H.join('');
  const heardOk = script.map((_, i) => match[i] !== null || (S[i].length >= 4 && joined.includes(S[i])) || H.some(h => near(h, S[i])) ||
    (digits && script[i].toLowerCase().replace(/[^a-z-]/g, '').split('-').every(w => NUMBER_WORDS.test(w))));
  const missed = script.filter((_, i) => !heardOk[i] && match[i] === null && !(digits && script[i].toLowerCase().replace(/[^a-z-]/g, '').split('-').every(w => NUMBER_WORDS.test(w))));
  const clarity = script.length ? 1 - missed.length / script.length : 1;
  const words: Word[] = script.map((text, i) => {
    const m = match[i];
    return m === null ? { text, start: NaN, end: NaN } : { text, start: heard[m].start, end: heard[m].end };
  });
  // Fill gaps: spread unmatched runs across the time between their matched neighbours, by length.
  for (let i = 0; i < words.length;) {
    if (!Number.isNaN(words[i].start)) { i++; continue; }
    let j = i; while (j < words.length && Number.isNaN(words[j].start)) j++;
    const t0 = i > 0 ? words[i - 1].end : (heard[0]?.start ?? 0.05), t1 = j < words.length ? words[j].start : dur - 0.05;
    const weights = words.slice(i, j).map(w => 1 + norm(w.text).length), total = weights.reduce((a, b) => a + b, 0);
    let t = t0;
    for (let k = i; k < j; k++) { const d = ((t1 - t0) * weights[k - i]) / total; words[k].start = t; words[k].end = t + d * 0.92; t += d; }
    i = j;
  }
  return { words, clarity, missed, heard: heardOk, transcript: heard.map(h => h.text).join(' ') };
}
