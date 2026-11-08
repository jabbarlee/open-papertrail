// A cue is one sound event on the picture's timeline. Packs decide which cues an event gets;
// the core only knows how to synthesise and mix them.

export type Instrument =
  | 'pluck'   // Karplus-Strong string
  | 'bell'    // inharmonic partials
  | 'pad'     // detuned sines, slow attack
  | 'synth'   // saw/square through a one-pole low-pass
  | 'noise'   // filtered noise, cutoff can glide: whoosh, scratch, paper, wind
  | 'sweep'   // pitch sweep: blip, riser, sub-drop
  | 'kick' | 'clap' | 'hat';

export interface Cue {
  t: number;              // seconds
  inst: Instrument;
  dur?: number;           // seconds
  note?: string | number; // "A4", "C#3" or Hz
  to?: string | number;   // sweep end pitch
  gain?: number;          // linear, 1 = full
  pan?: number;           // -1..1
  send?: number;          // reverb send 0..1
  cutoff?: number;        // Hz, noise/synth
  cutoffTo?: number;      // Hz, glide target over dur
  q?: number;             // noise filter resonance
  band?: 'low' | 'band' | 'high';
  wave?: 'saw' | 'square';
  seed?: number;
}

const NOTES: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };

export function hz(n: string | number): number {
  if (typeof n === 'number') return n;
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
  if (!m) throw new Error(`Unknown note "${n}"`);
  const semis = NOTES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12;
  return 440 * Math.pow(2, semis / 12);
}
