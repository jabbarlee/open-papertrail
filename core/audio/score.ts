// Mixes cues into a stereo 48 kHz WAV: dry bus + reverb send, tanh soft-clip, peak normalise.
import fs from 'node:fs';
import { reverb, SR, voice } from './synth.ts';
import type { Cue } from './cues.ts';

// Tonal instruments make the music bed; everything else is a sound effect.
export const MUSICAL = new Set<Cue['inst']>(['pad', 'pluck', 'bell', 'synth']);
export const sfxOnly = (cues: Cue[]) => cues.filter(c => !MUSICAL.has(c.inst));

export function renderScore(cues: Cue[], seconds: number, file: string): void {
  if (!cues.length) throw new Error('Sound sheet returned no cues');
  const n = Math.ceil(seconds * SR);
  const L = new Float32Array(n), R = new Float32Array(n), send = new Float32Array(n);
  for (const c of cues) {
    const v = voice(c);
    const g = c.gain ?? 0.5, pan = c.pan ?? 0;
    const gl = g * Math.cos((pan + 1) * Math.PI / 4), gr = g * Math.sin((pan + 1) * Math.PI / 4);
    const start = Math.round(c.t * SR);
    for (let i = 0; i < v.length && start + i < n; i++) {
      if (start + i < 0) continue;
      const s = v[i];
      if (Number.isNaN(s)) throw new Error(`NaN from ${c.inst} at ${c.t}s (bad note?)`);
      L[start + i] += s * gl;
      R[start + i] += s * gr;
      send[start + i] += s * g * (c.send ?? 0.2);
    }
  }
  const wl = reverb(send, 0), wr = reverb(send, 1);
  let peak = 0;
  for (let i = 0; i < n; i++) {
    L[i] = Math.tanh((L[i] + wl[i]) * 1.2);
    R[i] = Math.tanh((R[i] + wr[i]) * 1.2);
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  if (peak < 1e-4) throw new Error('Score is silent');
  const k = 0.89 / peak;
  const data = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    data.writeInt16LE(Math.round(L[i] * k * 32767), i * 4);
    data.writeInt16LE(Math.round(R[i] * k * 32767), i * 4 + 2);
  }
  const head = Buffer.alloc(44);
  head.write('RIFF', 0); head.writeUInt32LE(36 + data.length, 4); head.write('WAVE', 8);
  head.write('fmt ', 12); head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(2, 22);
  head.writeUInt32LE(SR, 24); head.writeUInt32LE(SR * 4, 28); head.writeUInt16LE(4, 32); head.writeUInt16LE(16, 34);
  head.write('data', 36); head.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([head, data]));
}
