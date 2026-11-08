import { defineSound } from '../../../../core/scene.ts';
import type { Cue } from '../../../../core/audio/cues.ts';
import { snd } from '../../components/sfx.ts';

// Candles: bakery room tone, close foley (candle on the counter, the till key and its ding, the second candle landing,
// a match strike at home), one soft sting when the small cactus gets its candle. No music under the narration.
export default defineSound(tl => {
  const at = (id: string, p = 0) => { const s = tl.shots.find(x => x.id === id); return s ? s.start + (s.end - s.start) * p : -1; };
  const from = (id: string, sec: number) => at(id) + sec;
  const word = (w: string, id: string, fb: number) => tl.words.find(x => x.text.toLowerCase().replace(/[^a-z0-9]/g, '') === w && x.start >= at(id) - 0.3)?.start ?? from(id, fb);
  const cues: Cue[] = [];
  const add = (...c: Cue[][]) => c.forEach(x => cues.push(...x.filter(q => q.t >= 0)));
  const strike = (t: number) => add([{ t, inst: 'noise', dur: 0.25, cutoff: 2500, cutoffTo: 6000, q: 2, band: 'band', gain: 0.1 }]);
  // bakery room tone, then a quieter one at home
  add([{ t: 0, inst: 'noise', dur: at('s08'), cutoff: 500, q: 0.5, band: 'low', gain: 0.025 }]);
  add([{ t: at('s08'), inst: 'noise', dur: tl.duration - at('s08'), cutoff: 350, q: 0.5, band: 'low', gain: 0.018 }]);
  add(snd.soft(0.05, 'E5', 0.12), snd.soft(0.3, 'B4', 0.08));
  // the candle rolls on the counter and stops
  add([{ t: from('s02', 0.05), inst: 'noise', dur: 0.6, cutoff: 900, cutoffTo: 500, q: 1.2, band: 'band', gain: 0.05 }], snd.thump(from('s02', 0.65), 0.08));
  // the till: key, drawer ding
  add([{ t: from('s04', 0.3), inst: 'hat', gain: 0.2 }], snd.ding(word('forty', 's04', 1.4), 0.2), snd.thump(word('forty', 's04', 1.4) + 0.05, 0.15));
  // the second candle lands
  add(snd.thump(word('two', 's05', 1.2) + 0.25, 0.18), snd.soft(word('two', 's05', 1.2), 'A4', 0.1));
  add([{ t: from('s06', 0.2), inst: 'sweep', note: 'A5', to: 'E5', dur: 0.35, gain: 0.06 }]);
  // home: a match strike for the candle
  strike(from('s08', 0.1));
  add(snd.soft(word('small', 's09', 0.9), 'D5', 0.12));
  // the second candle lights: the sting
  const one = word('one', 's10', 0.6);
  strike(one - 0.2);
  add(snd.soft(one + 0.1, 'G5', 0.16), snd.soft(one + 0.3, 'C6', 0.12), snd.pad(at('s11'), at('s11', 1) - at('s11'), 'C4', 0.05));
  return cues;
});
