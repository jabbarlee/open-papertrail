import { defineSound } from '../../../../core/scene.ts';
import type { Cue } from '../../../../core/audio/cues.ts';

// Quiet and close, like the sound of a painting: soft room tones per place (a lab, a church, a shop, a kitchen) and
// small low touches for the actions (a block dropping, a page, slips falling, a box tipping, notes landing).
export default defineSound(tl => {
  const at = (id: string, p = 0) => { const s = tl.shots.find(x => x.id === id); return s ? s.start + (s.end - s.start) * p : -1; };
  const end = (id: string) => at(id, 1);
  const word = (w: string, id: string, fb: number) => tl.words.find(x => x.text.toLowerCase().replace(/[^a-z0-9]/g, '') === w && x.start >= at(id) - 0.3)?.start ?? at(id) + fb;
  const cues: Cue[] = [];
  const add = (...c: Cue[]) => cues.push(...c.filter(q => q.t >= 0));
  const tone = (t0: number, t1: number, cutoff: number, gain: number) => add({ t: t0, inst: 'noise', dur: t1 - t0, cutoff, q: 0.5, band: 'low', gain, send: 0.3 });
  const touch = (t: number, gain = 0.03, cutoff = 900) => add({ t, inst: 'noise', dur: 0.09, cutoff, cutoffTo: cutoff * 0.6, q: 0.9, band: 'band', gain, send: 0.25 });
  const thud = (t: number, gain = 0.05) => add({ t, inst: 'noise', dur: 0.16, cutoff: 220, cutoffTo: 120, q: 0.7, band: 'low', gain, send: 0.2 });
  const swish = (t: number, dur = 0.45, gain = 0.03) => add({ t, inst: 'noise', dur, cutoff: 300, cutoffTo: 1600, q: 0.8, band: 'band', gain, send: 0.35 });
  const shimmer = (t: number, gain = 0.018) => add({ t, inst: 'noise', dur: 0.8, cutoff: 7000, cutoffTo: 9500, q: 6, band: 'band', gain, send: 0.7 });

  tone(at('s01'), end('s05'), 450, 0.014);
  thud(word('failed', 's01', 4.8) + 0.5, 0.07); touch(word('failed', 's01', 4.8) + 0.62, 0.04);
  swish(word('peel', 's03', 1.6), 0.4, 0.03); touch(word('stick', 's03', 2.6) + 0.3, 0.04, 1200);
  for (let i = 0; i < 4; i++) touch(at('s05') + i * 0.7, 0.02, 500);
  tone(at('s06'), end('s09'), 300, 0.018);
  for (let i = 0; i < 4; i++) swish(at('s07') + 0.2 + i * 0.55, 0.35, 0.02);
  swish(word('coated', 's08', 0.5), 1.0, 0.02);
  swish(word('peeled', 's09', 1.2), 0.4, 0.03);
  tone(at('s10'), end('s11'), 500, 0.016);
  thud(word('flopped', 's10', 3.2) + 0.2, 0.06); touch(word('flopped', 's10', 3.2) + 0.35, 0.03);
  const pn = word('postit', 's12', 1.4);
  for (let i = 0; i < 10; i++) touch(pn - 0.9 + i * 0.12, 0.025, 1400);
  shimmer(pn);
  tone(at('s13'), end('s13'), 450, 0.014);
  tone(at('s14'), tl.duration, 350, 0.014);
  touch(word('always', 's14', 1.2) - 0.1, 0.03, 1200);
  return cues;
});
