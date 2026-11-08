// Voices an episode's script.txt into voice.mp3 + words.json (every word timed) + clarity.json.
//
// The script is said in ONE take (or in pieces of up to `pieceWords` words for long scripts, because the Whisper check
// hears 30 s at a time), so sentences keep their natural intonation. Each piece gets `takes` tries and the clearest one
// is kept: Whisper listens back and every script word it can't hear counts against the take.
//
// Then, by the style's `cut`:
// - "lines" (default): the take is cut between script lines and re-joined with each line's pause (`{pause=0.6}`), and
//   shown-not-spoken lines (`{speaker="mia"}`) get silence for their reading time.
// - "never": the take is kept exactly as spoken, never cut (flat-grain: no hard stops between sentences).
import fs from 'node:fs';
import path from 'node:path';
import { alignTake, resample } from './align.ts';
import { ffmpeg } from './ffmpeg.ts';
import { isVoiced, loadEpisode, readScriptLines, writeJson, type ScriptLine } from './paths.ts';
import { kokoroSynth, qwenSynth, resolveProvider, stretch, writeWav, type Pcm, type Provider } from './tts.ts';
import type { PackConfig, VoiceConfig, Word } from './types.ts';

const POLISH = 'highpass=f=80,equalizer=f=250:t=q:w=1:g=-2.5,equalizer=f=3200:t=q:w=1.2:g=3,highshelf=f=7000:g=4,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2';
const words = (s: string) => s.split(/\s+/).filter(Boolean);
const weight = (w: string) => 0.55 + 0.11 * w.replace(/[^\p{L}\p{N}]/gu, '').length;

// The style's voice, with any per-episode override (episode.json "voice") merged on top.
export function voiceFor(dir: string, pack: PackConfig): VoiceConfig {
  const o = loadEpisode(dir).voice ?? {};
  return { ...pack.voice, ...o, kokoro: { ...pack.voice.kokoro, ...o.kokoro } };
}

// How long an unvoiced line stays on screen: hold= if set, else its reading time (min 1.2 s).
export function holdSeconds(l: ScriptLine, pack: PackConfig): number {
  return l.hold ?? Math.max(1.2, 0.4 + l.text.length / (pack.pace.readCharsPerSecond ?? 15));
}

// Stand-in word timings spread over `dur` seconds from t0 (longer words take longer).
function spread(ws: string[], t0: number, dur: number): Word[] {
  const unit = dur / Math.max(1e-6, ws.reduce((s, w) => s + weight(w), 0));
  let t = t0;
  return ws.map(w => { const d = weight(w) * unit, o = { text: w, start: +t.toFixed(3), end: +(t + d * 0.92).toFixed(3) }; t += d; return o; });
}

// Trims leading/trailing near-silence so the pauses are the ones we chose.
function trim(a: Float32Array, sr: number): Float32Array {
  const th = 0.01, pad = Math.round(0.03 * sr);
  let s = 0, e = a.length - 1;
  while (s < e && Math.abs(a[s]) < th) s++;
  while (e > s && Math.abs(a[e]) < th) e--;
  return a.slice(Math.max(0, s - pad), Math.min(a.length, e + pad));
}

function fade(a: Float32Array, sr: number): Float32Array {
  const n = Math.min(Math.round(0.006 * sr), a.length >> 1);
  for (let i = 0; i < n; i++) { const g = i / n; a[i] *= g; a[a.length - 1 - i] *= g; }
  return a;
}

const join = (parts: Float32Array[]) => {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};

export interface VoiceOptions { takes?: number; provider?: 'auto' | Provider }

export async function generateVoice(dir: string, pack: PackConfig, opts: VoiceOptions = {}): Promise<Word[]> {
  const voice = voiceFor(dir, pack);
  const provider = await resolveProvider(opts.provider ?? voice.provider ?? 'auto');
  const name = provider === 'qwen' ? voice.voiceId : voice.kokoro.voiceId;
  const speed = provider === 'qwen' ? voice.speed ?? 1 : voice.kokoro.speed ?? voice.speed ?? 1;
  const TAKES = opts.takes ?? (provider === 'qwen' ? voice.takes ?? 3 : 1);
  const say = async (text: string, n: number): Promise<Pcm> => provider === 'qwen'
    ? stretch(await qwenSynth(text, { voice: name, seed: 2 + n, temperature: voice.temperature ?? 1.0 }), speed)
    : kokoroSynth(text, { voice: name, speed });
  console.log(`voice: ${provider} "${name}"${provider === 'kokoro' && (opts.provider ?? voice.provider ?? 'auto') === 'auto' ? ' (the Qwen voice server is not running, so Kokoro speaks; SETUP.md has the better voice)' : ''}`);

  const lines = readScriptLines(dir);
  const spoken = lines.filter(isVoiced);
  if (!spoken.length) throw new Error('script.txt has no spoken lines');
  const limit = voice.pieceWords ?? (voice.cut === 'never' ? Infinity : 60);

  const pieces: ScriptLine[][] = [];
  let cur: ScriptLine[] = [], count = 0;
  for (const l of spoken) {
    const n = words(l.text).length;
    if (cur.length && count + n > limit) { pieces.push(cur); cur = []; count = 0; }
    cur.push(l); count += n;
  }
  if (cur.length) pieces.push(cur);

  let sr = 24000;
  const parts: Float32Array[] = [], tw: Word[] = [], heardAll: boolean[] = [];
  let offset = 0, transcript = '';
  for (const [p, piece] of pieces.entries()) {
    const script = piece.flatMap(l => words(l.text));
    let best: { audio: Float32Array; take: Awaited<ReturnType<typeof alignTake>> } | null = null;
    for (let n = 0; n < TAKES && (!best || best.take.clarity < 1); n++) {
      const o = await say(piece.map(l => l.say).join(' '), n);
      if (!parts.length && !best) sr = o.sr;
      const audio = trim(o.sr === sr ? o.audio : resample(o.audio, o.sr, sr), sr);
      const take = await alignTake(script, resample(audio, sr));
      console.log(`  ${pieces.length > 1 ? `part ${p + 1}/${pieces.length} ` : ''}take ${n + 1}: ${(audio.length / sr).toFixed(1)}s, ${(take.clarity * 100).toFixed(0)}% heard${take.missed.length ? ` (missed: ${take.missed.join(', ')})` : ''}`);
      if (!best || take.clarity > best.take.clarity) best = { audio, take };
    }
    const gap = parts.length ? Math.round(0.18 * sr) : 0;
    if (gap) { parts.push(new Float32Array(gap)); offset += gap / sr; }
    for (const w of best!.take.words) tw.push({ text: w.text, start: w.start + offset, end: w.end + offset });
    heardAll.push(...best!.take.heard);
    transcript += ` ${best!.take.transcript}`;
    parts.push(best!.audio);
    offset += best!.audio.length / sr;
  }
  const audio = join(parts);
  const clarityAll = heardAll.filter(Boolean).length / heardAll.length;
  const minClarity = voice.minClarity ?? 0.9;
  if (clarityAll < minClarity) throw new Error(`best take only ${(clarityAll * 100).toFixed(0)}% heard (needs ${minClarity * 100}%); Whisper heard "${transcript.trim()}". Reword the line it missed, or spell numbers out.`);

  const ranges: [number, number][] = [];
  { let k = 0; for (const l of spoken) { const n = words(l.text).length; ranges.push([k, k + n - 1]); k += n; } }
  const clarity = spoken.map((l, v) => {
    const [w0, w1] = ranges[v], heard = heardAll.slice(w0, w1 + 1), lw = words(l.text);
    return { text: l.text, clarity: +(heard.filter(Boolean).length / lw.length).toFixed(3), missed: lw.filter((_, j) => !heard[j]) };
  });

  let pcm: Float32Array, out: Word[];
  if (voice.cut === 'never') {
    if (lines.some(l => !isVoiced(l))) throw new Error('"cut": "never" voices cannot hold speaker= lines; use "cut": "lines"');
    pcm = audio;
    out = tw.map(w => ({ text: w.text, start: +w.start.toFixed(3), end: +w.end.toFixed(3) }));
  } else {
    const cuts = spoken.map((_, i) => i === 0 ? 0 : (tw[ranges[i - 1][1]].end + tw[ranges[i][0]].start) / 2);
    cuts.push(audio.length / sr);
    const chunks: Float32Array[] = [new Float32Array(Math.round(0.12 * sr))];
    out = [];
    let t = 0.12, v = 0;
    const silence = (s: number) => { if (s > 0) { chunks.push(new Float32Array(Math.round(s * sr))); t += s; } };
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (!isVoiced(l)) {
        const hold = holdSeconds(l, pack);
        out.push(...spread(words(l.text), t, hold * 0.9));
        silence(hold + (l.pause ?? pack.pace.linePause));
        continue;
      }
      const a = cuts[v], b = cuts[v + 1];
      const seg = fade(audio.slice(Math.round(a * sr), Math.round(b * sr)), sr);
      const [w0, w1] = ranges[v];
      for (let j = w0; j <= w1; j++) out.push({ text: tw[j].text, start: +(t + tw[j].start - a).toFixed(3), end: +(t + tw[j].end - a).toFixed(3) });
      chunks.push(seg);
      t += seg.length / sr;
      const next = lines[i + 1];
      const gap = v + 1 < spoken.length ? tw[ranges[v + 1][0]].start - tw[w1].end : 0;
      if (next && (l.pause !== undefined || !isVoiced(next))) silence(Math.max(0, (l.pause ?? pack.pace.linePause) - gap));
      v++;
    }
    pcm = join(chunks);
  }

  const wav = path.join(dir, 'voice.wav');
  writeWav(wav, pcm, sr);
  await ffmpeg(['-i', wav, '-af', POLISH, '-ar', '44100', '-b:a', '192k', path.join(dir, 'voice.mp3')]);
  fs.rmSync(wav);
  writeJson(path.join(dir, 'words.json'), out);
  writeJson(path.join(dir, 'clarity.json'), clarity);
  fs.rmSync(path.join(dir, 'words.estimated'), { force: true });
  fs.writeFileSync(path.join(dir, 'voice.provider'), `${provider} ${name}\n`);
  return out;
}

// Stand-in timings before any voice exists, so the picture can be built and checked first.
// Longer words take longer; lines end with a breath. The real voice later replaces words.json.
export function estimateWords(dir: string, pack: PackConfig): Word[] {
  const { wordsPerSecond, linePause } = pack.pace;
  const lines = readScriptLines(dir);
  const spokenWords = lines.filter(isVoiced).flatMap(l => words(l.text));
  const unit = (spokenWords.length / wordsPerSecond) / Math.max(1e-6, spokenWords.reduce((s, w) => s + weight(w), 0));
  const out: Word[] = [];
  let t = 0.15;
  for (const line of lines) {
    const ws = words(line.text);
    if (!isVoiced(line)) {
      const hold = holdSeconds(line, pack);
      out.push(...spread(ws, t, hold * 0.9));
      t += hold + (line.pause ?? linePause);
      continue;
    }
    for (const w of ws) {
      const d = weight(w) * unit;
      out.push({ text: w, start: +t.toFixed(3), end: +(t + d * 0.92).toFixed(3) });
      t += d + (/[,;:]$/.test(w) ? 0.12 : 0);
    }
    t += linePause;
  }
  writeJson(path.join(dir, 'words.json'), out);
  fs.rmSync(path.join(dir, 'clarity.json'), { force: true });
  fs.writeFileSync(path.join(dir, 'words.estimated'), 'words.json holds estimated timings; run `npm run studio -- voice <episode>` to replace them.\n');
  return out;
}
