// Sound for "Walk": soft footsteps under the walk, a pop per tag, a door click on "I'm here", a whoosh into the map and
// a pluck for each corner of the lap, one bell on the big news, footsteps again as you go round once more.
import type { Cue } from '../../../../core/audio/cues.ts';
import said from './words.json';
import { wordAt } from '../../components/stage.ts';

const at = wordAt(said), END = said[said.length - 1].end;
export const cues: Cue[] = [];
const pad = (t: number, dur: number, notes: string[], gain: number) => notes.forEach(note => cues.push({ t, inst: 'pad', note, dur, gain, send: 0.5 }));
const ping = (t: number, note: string, gain = 0.1) => cues.push({ t, inst: 'pluck', note, gain, send: 0.2 });
const whoosh = (t: number, dur = 0.5, gain = 0.14) => cues.push({ t, inst: 'noise', dur, cutoff: 300, cutoffTo: 3600, band: 'band', gain, send: 0.3 });
const step = (t: number, gain = 0.05) => cues.push({ t, inst: 'noise', dur: 0.06, cutoff: 500, cutoffTo: 300, band: 'band', gain });
const click = (t: number, gain = 0.2) => cues.push({ t, inst: 'hat', gain, send: 0.05 });

pad(0, at('so', 2), ['D3', 'A3'], 0.03);
for (let t = 0.1; t < at('so', 2) - 0.3; t += 0.5) step(t);
ping(at('shoes'), 'D5'); ping(at('step'), 'F#5'); ping(at('ten'), 'A5', 0.12);
['lot', 'say'].forEach((w, i) => ping(at(w), ['B4', 'D5'][i], 0.08));
ping(at('ending'), 'A4', 0.12);
click(at("i'm")); click(at('got', 2), 0.16);
whoosh(at('so', 2) - 0.3, 0.5);
['long', 'way', 'round', 'block'].forEach((w, i) => ping(at(w), ['D5', 'E5', 'F#5', 'A5'][i], 0.09));
whoosh(at('knows') - 0.4, 0.45);
for (let t = at('knows'); t < at('street') + 0.4; t += 0.5) step(t);
cues.push({ t: at('big'), inst: 'bell', note: 'D5', dur: 2.2, gain: 0.12, send: 0.45 });
pad(at('big'), END - at('big') + 3, ['D3', 'F#3'], 0.035);
for (let t = END + 1.0; t < END + 2.6; t += 0.5) step(t);
