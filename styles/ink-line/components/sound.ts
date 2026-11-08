// This pack's sound palette (Node side). Sparse, D-major-ish, built from core instruments.
import type { Cue } from '../../../core/audio/cues.ts';

const SCALE = ['D4', 'E4', 'F#4', 'A4', 'B4', 'D5', 'E5', 'F#5', 'A5'];

export const snd = {
  // A pencil writing: filtered noise with a scratchy glide, a little longer than the write-on.
  write: (t: number, dur = 0.35, gain = 0.16): Cue[] => [
    { t, inst: 'noise', dur, cutoff: 2600, cutoffTo: 4200, q: 3, band: 'band', gain, send: 0.05 },
  ],
  // A soft reveal note; `step` walks up the scale across an episode.
  pluck: (t: number, step = 0, gain = 0.28): Cue[] => [
    { t, inst: 'pluck', note: SCALE[step % SCALE.length], dur: 1.1, gain, pan: (step % 3 - 1) * 0.25, send: 0.3 },
  ],
  // Paper rustle on a scale change.
  rustle: (t: number, gain = 0.14): Cue[] => [
    { t, inst: 'noise', dur: 0.32, cutoff: 900, cutoffTo: 3000, q: 1, band: 'band', gain, send: 0.15 },
  ],
  // The effect's name.
  bell: (t: number, gain = 0.32): Cue[] => [
    { t, inst: 'bell', note: 'D5', dur: 2.4, gain, send: 0.45 },
    { t, inst: 'bell', note: 'A4', dur: 2.4, gain: gain * 0.5, send: 0.45 },
  ],
  // A hard flip.
  thump: (t: number, gain = 0.5): Cue[] => [{ t, inst: 'kick', gain, send: 0.05 }],
  // Something bounces off: a short downward blip.
  bonk: (t: number, gain = 0.2): Cue[] => [{ t, inst: 'sweep', note: 'A5', to: 'D5', dur: 0.12, gain, send: 0.15 }],
  // A clock tick.
  tick: (t: number, gain = 0.12): Cue[] => [{ t, inst: 'hat', gain, send: 0.05 }],
  // A warm bed under a section.
  pad: (t: number, dur: number, note = 'D3', gain = 0.12): Cue[] => [
    { t, inst: 'pad', note, dur, gain, send: 0.4 },
    { t, inst: 'pad', note: note.replace(/\d/, d => String(+d + 1)).replace('D', 'A'), dur, gain: gain * 0.6, send: 0.4 },
  ],
  // A riser into a transition.
  riser: (t: number, dur = 0.6, gain = 0.1): Cue[] => [
    { t, inst: 'noise', dur, cutoff: 400, cutoffTo: 6000, q: 2, band: 'band', gain, send: 0.3 },
  ],
};
