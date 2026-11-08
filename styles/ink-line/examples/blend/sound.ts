// Blend: pencil scratches on write-ons, a pluck per shot, quick ticks as the counter climbs, one beat of silence,
// a low bell under her number, and a warm pad as the circles close.
import { defineSound } from '../../../../core/scene.ts';
import type { Cue } from '../../../../core/audio/cues.ts';
import { snd } from '../../components/sound.ts';

export default defineSound(tl => {
  const shot = (id: string) => tl.shots.find(s => s.id === id)!;
  const at = (id: string, dt = 0) => shot(id).start + dt;
  const len = (id: string) => shot(id).end - shot(id).start;
  const word = (w: string, from: string) => tl.words.find(x => x.start >= shot(from).start && x.text.toLowerCase().replace(/[^a-z-]/g, '') === w)?.start ?? at(from);
  const cues: Cue[] = [];
  const add = (...c: Cue[][]) => c.forEach(x => cues.push(...x));

  add(snd.pad(0, at('s06'), 'D3', 0.05));
  tl.shots.forEach((s, i) => { if (s.id !== 's06') add(snd.write(s.start + 0.02, 0.3, 0.07), snd.pluck(s.start, i % 6, 0.1)); });
  add(snd.rustle(word('mixes', 's02')));
  const play = word('played', 's04');
  for (let k = 0; k < 14; k++) add(snd.tick(play + 2.4 * Math.sqrt(k / 14), 0.08));
  add(snd.bonk(at('s05', 0.3), 0.12));
  add(snd.bell(word('forty-one', 's06'), 0.12), snd.pad(at('s06'), len('s06'), 'D2', 0.06));
  add(snd.thump(word('match', 's07') + 0.2, 0.22), snd.pad(word('match', 's07'), tl.duration - word('match', 's07'), 'A3', 0.05));
  return cues;
});
