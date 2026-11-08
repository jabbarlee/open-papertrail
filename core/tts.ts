// The two voices the engine can speak with, both on your own machine:
// - qwen:   Qwen3-TTS (Apache-2.0) cloning a voice from voices/<name>.wav, served by voice-server/ on this Mac.
//           Natural, expressive, one take of a whole script. Needs the one-time setup in SETUP.md.
// - kokoro: Kokoro-82M (Apache-2.0) on the CPU through kokoro-js. Zero setup; plainer delivery.
// `auto` (the default) uses Qwen when the voice server answers, else Kokoro, and says which one it used.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { KokoroTTS } from 'kokoro-js';
import './align.ts';   // points the model cache at STUDIO_MODEL_CACHE
import { ffmpeg } from './ffmpeg.ts';
import { ROOT } from './paths.ts';

export type Provider = 'qwen' | 'kokoro';
export interface Pcm { audio: Float32Array; sr: number }

function loadEnv(): void {
  const file = path.join(ROOT, '.env');
  if (fs.existsSync(file)) process.loadEnvFile(file);
}

export const qwenUrl = (): string => { loadEnv(); return (process.env.QWEN_URL ?? 'http://127.0.0.1:7865').replace(/\/$/, ''); };

let qwenUp: boolean | null = null;
export async function qwenAvailable(): Promise<boolean> {
  if (qwenUp !== null) return qwenUp;
  try {
    const r = await fetch(`${qwenUrl()}/health`, { signal: AbortSignal.timeout(3000) });
    qwenUp = r.ok;
  } catch { qwenUp = false; }
  return qwenUp;
}

export async function resolveProvider(p: 'auto' | Provider | undefined): Promise<Provider> {
  if (p === 'kokoro') return 'kokoro';
  if (p === 'qwen') {
    if (!(await qwenAvailable())) throw new Error(`The Qwen voice server isn't answering at ${qwenUrl()}. Start it with \`npm run voice:up\` (setup: SETUP.md), or set "provider": "kokoro".`);
    return 'qwen';
  }
  return (await qwenAvailable()) ? 'qwen' : 'kokoro';
}

// One generation of `text` in a cloned voice from voices/. Returns mono PCM.
export async function qwenSynth(text: string, o: { voice: string; seed?: number; temperature?: number }): Promise<Pcm> {
  const r = await fetch(`${qwenUrl()}/tts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, voice: o.voice, seed: o.seed, temperature: o.temperature }),
    signal: AbortSignal.timeout(900_000),
  });
  if (!r.ok) throw new Error(`Qwen /tts ${r.status}: ${(await r.text()).slice(0, 500)}`);
  return decodeWav(Buffer.from(await r.arrayBuffer()));
}

const KOKORO = 'onnx-community/Kokoro-82M-v1.0-ONNX';
let kokoro: KokoroTTS | null = null;

// Kokoro reads up to a few hundred tokens at a time, so longer text is said sentence by sentence and joined with a
// short breath. Bracketed tags would be read aloud, so they're dropped.
export async function kokoroSynth(text: string, o: { voice: string; speed?: number }): Promise<Pcm> {
  kokoro ??= await KokoroTTS.from_pretrained(KOKORO, { dtype: 'q8', device: 'cpu' });
  if (!(o.voice in kokoro.voices)) throw new Error(`Unknown Kokoro voice "${o.voice}". Try: ${Object.keys(kokoro.voices).join(', ')}`);
  const clean = text.replace(/\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = clean.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g)?.map(s => s.trim()).filter(Boolean) ?? [clean];
  const parts: Float32Array[] = [];
  let sr = 24000;
  for (const [i, s] of sentences.entries()) {
    const out = await kokoro.generate(s, { voice: o.voice as never, speed: o.speed ?? 1 });
    sr = out.sampling_rate;
    if (i) parts.push(new Float32Array(Math.round(0.16 * sr)));
    parts.push(out.audio);
  }
  const audio = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let k = 0; for (const p of parts) { audio.set(p, k); k += p.length; }
  return { audio, sr };
}

// A pitch-preserving tempo change (Qwen has no speed control of its own).
export async function stretch(pcm: Pcm, speed: number): Promise<Pcm> {
  if (Math.abs(speed - 1) < 0.01) return pcm;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tts-'));
  writeWav(path.join(tmp, 'in.wav'), pcm.audio, pcm.sr);
  await ffmpeg(['-i', path.join(tmp, 'in.wav'), '-filter:a', `atempo=${speed.toFixed(3)}`, '-c:a', 'pcm_s16le', path.join(tmp, 'out.wav')]);
  const out = decodeWav(fs.readFileSync(path.join(tmp, 'out.wav')));
  fs.rmSync(tmp, { recursive: true, force: true });
  return out;
}

export function writeWav(file: string, pcm: Float32Array, sr: number): void {
  const data = Buffer.alloc(pcm.length * 2);
  for (let i = 0; i < pcm.length; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, pcm[i])) * 32767), i * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(sr, 24);
  h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, data]));
}

// 16-bit PCM or 32-bit float WAV, any channel count, mixed down to mono.
export function decodeWav(b: Buffer): Pcm {
  if (b.toString('ascii', 0, 4) !== 'RIFF') throw new Error('The voice server returned something that is not a WAV');
  let o = 12, fmt = 1, ch = 1, sr = 24000, bits = 16;
  while (o + 8 <= b.length) {
    const id = b.toString('ascii', o, o + 4), size = b.readUInt32LE(o + 4), body = o + 8;
    if (id === 'fmt ') { fmt = b.readUInt16LE(body); ch = b.readUInt16LE(body + 2); sr = b.readUInt32LE(body + 4); bits = b.readUInt16LE(body + 14); }
    if (id === 'data') {
      const bytes = bits / 8, n = Math.floor(Math.min(size, b.length - body) / (bytes * ch)), out = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        let v = 0;
        for (let c = 0; c < ch; c++) {
          const at = body + (i * ch + c) * bytes;
          v += fmt === 3 ? b.readFloatLE(at) : b.readInt16LE(at) / 32768;
        }
        out[i] = v / ch;
      }
      return { audio: out, sr };
    }
    o = body + size + (size % 2);
  }
  throw new Error('WAV has no data chunk');
}
