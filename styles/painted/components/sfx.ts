import type { Cue } from '../../../core/audio/cues.ts';

export const snd = {
  paper: (t: number, gain = 0.16): Cue[] => [{ t, inst: 'noise', dur: 0.18, cutoff: 1200, cutoffTo: 3800, q: 1.2, band: 'band', gain, send: 0.08 }],
  pop: (t: number, gain = 0.22): Cue[] => [{ t, inst: 'sweep', note: 'C6', to: 'G6', dur: 0.07, gain, send: 0.1 }],
  sent: (t: number, gain = 0.2): Cue[] => [{ t, inst: 'noise', dur: 0.22, cutoff: 600, cutoffTo: 5000, q: 1.5, band: 'band', gain, send: 0.15 }, { t: t + 0.05, inst: 'sweep', note: 'A5', to: 'E6', dur: 0.1, gain: gain * 0.8 }],
  ding: (t: number, gain = 0.26): Cue[] => [{ t, inst: 'bell', note: 'E6', dur: 0.9, gain, send: 0.3 }, { t: t + 0.08, inst: 'bell', note: 'B6', dur: 0.8, gain: gain * 0.6, send: 0.3 }],
  thump: (t: number, gain = 0.55): Cue[] => [{ t, inst: 'kick', gain, send: 0.05 }],
  boing: (t: number, gain = 0.2): Cue[] => [{ t, inst: 'sweep', note: 'C4', to: 'C6', dur: 0.12, gain }, { t: t + 0.12, inst: 'sweep', note: 'C6', to: 'G4', dur: 0.18, gain: gain * 0.7 }],
  scratch: (t: number, gain = 0.3): Cue[] => [{ t, inst: 'noise', dur: 0.32, cutoff: 3000, cutoffTo: 300, q: 4, band: 'band', gain }, { t, inst: 'sweep', note: 'E5', to: 'C3', dur: 0.3, gain: gain * 0.6 }],
  typing: (t: number, dur: number, gain = 0.09): Cue[] => Array.from({ length: Math.floor(dur / 0.11) }, (_, i) => ({ t: t + i * 0.11 + (i % 3) * 0.015, inst: 'hat' as const, gain, send: 0.02 })),
  backspace: (t: number, n = 6, gain = 0.1): Cue[] => Array.from({ length: n }, (_, i) => ({ t: t + i * 0.06, inst: 'hat' as const, gain: gain * (1 - i * 0.08), send: 0.02 })),
  heart: (t: number, gain = 0.5): Cue[] => [{ t, inst: 'kick', gain }, { t: t + 0.22, inst: 'kick', gain: gain * 0.7 }],
  whoosh: (t: number, gain = 0.14): Cue[] => [{ t, inst: 'noise', dur: 0.3, cutoff: 300, cutoffTo: 4000, q: 1, band: 'band', gain, send: 0.2 }],
  soft: (t: number, note = 'A4', gain = 0.18): Cue[] => [{ t, inst: 'pluck', note, dur: 1.4, gain, send: 0.4 }],
  pad: (t: number, dur: number, note = 'D3', gain = 0.1): Cue[] => [{ t, inst: 'pad', note, dur, gain, send: 0.5 }],
};
