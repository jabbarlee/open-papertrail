// Plain-TypeScript synthesis into stereo float buffers at 48 kHz. No packages.
import { hz, type Cue } from './cues.ts';

export const SR = 48_000;

function rand(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) / 4294967296) * 2 - 1; };
}

const env = (i: number, n: number, a: number, r: number) => {
  const t = i / SR, len = n / SR;
  return Math.min(1, t / Math.max(a, 1e-4)) * Math.min(1, Math.max(0, (len - t) / Math.max(r, 1e-4)));
};

// Mono voice for one cue.
export function voice(c: Cue): Float32Array {
  const dur = c.dur ?? defaults[c.inst];
  const n = Math.max(1, Math.round(dur * SR));
  const out = new Float32Array(n);
  const r = rand(c.seed ?? Math.round(c.t * 1000) + 1);
  const f0 = c.note !== undefined ? hz(c.note) : 220;

  switch (c.inst) {
    case 'pluck': {
      const len = Math.max(2, Math.round(SR / f0));
      const buf = Float32Array.from({ length: len }, () => r());
      for (let i = 0, p = 0; i < n; i++, p = (p + 1) % len) {
        const nx = (p + 1) % len;
        out[i] = buf[p];
        buf[p] = 0.996 * 0.5 * (buf[p] + buf[nx]);
      }
      break;
    }
    case 'bell': {
      const parts = [[1, 1, 1], [2.76, 0.5, 1.6], [5.4, 0.25, 2.6], [8.93, 0.12, 4]];
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        let s = 0;
        for (const [m, g, d] of parts) s += g * Math.sin(2 * Math.PI * f0 * m * t) * Math.exp(-t * d * 3 / dur);
        out[i] = s * Math.min(1, t / 0.002) * 0.6;
      }
      break;
    }
    case 'pad': {
      const det = [-0.6, -0.2, 0.2, 0.6].map(c => f0 * Math.pow(2, c / 100 * 8));
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        out[i] = det.reduce((s, f) => s + Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t), 0) / 5 * env(i, n, dur * 0.35, dur * 0.4);
      }
      break;
    }
    case 'synth': {
      let lp = 0, ph = 0;
      for (let i = 0; i < n; i++) {
        ph = (ph + f0 / SR) % 1;
        const raw = c.wave === 'square' ? (ph < 0.5 ? 1 : -1) : ph * 2 - 1;
        const cut = glide(c, i / n, 2400);
        lp += (1 - Math.exp(-2 * Math.PI * cut / SR)) * (raw - lp);
        out[i] = lp * env(i, n, 0.005, Math.min(0.12, dur / 2)) * 0.5;
      }
      break;
    }
    case 'noise': {
      // Chamberlin state-variable filter with a gliding cutoff.
      let low = 0, band = 0;
      const q = 1 / (c.q ?? 1.4);
      for (let i = 0; i < n; i++) {
        const f = 2 * Math.sin(Math.PI * Math.min(glide(c, i / n, 1800), SR / 6) / SR);
        const high = r() - low - q * band;
        band += f * high; low += f * band;
        const pick = c.band === 'low' ? low : c.band === 'high' ? high : band;
        out[i] = pick * env(i, n, dur * 0.3, dur * 0.5);
      }
      break;
    }
    case 'sweep': {
      const a = f0, b = c.to !== undefined ? hz(c.to) : f0 / 4;
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const k = i / n;
        ph += 2 * Math.PI * (a * Math.pow(b / a, k)) / SR;
        out[i] = Math.sin(ph) * env(i, n, 0.003, dur * 0.6);
      }
      break;
    }
    case 'kick': {
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        ph += 2 * Math.PI * (45 + 110 * Math.exp(-t * 30)) / SR;
        out[i] = Math.sin(ph) * Math.exp(-t * 9) * 0.9;
      }
      break;
    }
    case 'clap': {
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        const bursts = [0, 0.011, 0.022].reduce((s, o) => s + (t >= o ? Math.exp(-(t - o) * 90) : 0), 0) + Math.exp(-t * 18) * 0.4;
        out[i] = r() * bursts * 0.5;
      }
      break;
    }
    case 'hat': {
      let prev = 0;
      for (let i = 0; i < n; i++) {
        const x = r();
        out[i] = (x - prev) * Math.exp(-(i / SR) * 60) * 0.4;
        prev = x;
      }
      break;
    }
  }
  return out;
}

const defaults: Record<Cue['inst'], number> = {
  pluck: 1.2, bell: 2.2, pad: 4, synth: 0.4, noise: 0.5, sweep: 0.5, kick: 0.5, clap: 0.35, hat: 0.12,
};

function glide(c: Cue, k: number, fallback: number): number {
  const a = c.cutoff ?? fallback, b = c.cutoffTo ?? a;
  return a * Math.pow(b / a, k);
}

// Freeverb-style reverb (8 combs + 4 allpasses per side).
export function reverb(input: Float32Array, side: 0 | 1): Float32Array {
  const spread = side ? 23 : 0;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map(d => ({ buf: new Float32Array(Math.round((d + spread) * SR / 44100)), i: 0, f: 0 }));
  const alls = [556, 441, 341, 225].map(d => ({ buf: new Float32Array(Math.round((d + spread) * SR / 44100)), i: 0 }));
  const out = new Float32Array(input.length);
  for (let n = 0; n < input.length; n++) {
    const x = input[n] * 0.015;
    let s = 0;
    for (const c of combs) {
      const y = c.buf[c.i];
      c.f = y * 0.8 + c.f * 0.2;
      c.buf[c.i] = x + c.f * 0.84;
      c.i = (c.i + 1) % c.buf.length;
      s += y;
    }
    for (const a of alls) {
      const y = a.buf[a.i];
      a.buf[a.i] = s + y * 0.5;
      a.i = (a.i + 1) % a.buf.length;
      s = y - s;
    }
    out[n] = s;
  }
  return out;
}
