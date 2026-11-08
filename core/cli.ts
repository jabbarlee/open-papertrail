// studio <command> [episode] [--flags]
// The skills call these; each step reads and writes files in styles/<style>/episodes/<date>-<slug>/.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { renderScore, sfxOnly } from './audio/score.ts';
import { exportDraft, exportEpisode } from './export.ts';
import { allStyles, episodeDir, episodesDir, isVoiced, loadEpisode, loadPack, packDir, readJson, readScriptLines, ROOT, writeJson } from './paths.ts';
import { qa } from './qa.ts';
import { bundle, renderVideo, stills } from './render.ts';
import { buildTimeline } from './timeline.ts';
import { estimateWords, generateVoice } from './voice.ts';
import { alignTake } from './align.ts';
import { FFMPEG, run as exec } from './ffmpeg.ts';
import { qwenAvailable, qwenUrl } from './tts.ts';
import type { SoundSheet } from './scene.ts';
import type { Cue } from './audio/cues.ts';
import type { Episode, HookVersion, StoryboardShot, Timeline } from './types.ts';

const { positionals: [cmd, ref], values: o } = parseArgs({
  allowPositionals: true,
  options: {
    style: { type: 'string' }, format: { type: 'string' }, slug: { type: 'string' }, title: { type: 'string' }, date: { type: 'string' },
    at: { type: 'string' }, preview: { type: 'boolean' }, shots: { type: 'string' }, workers: { type: 'string' },
    gate: { type: 'string' }, note: { type: 'string' }, takes: { type: 'string' }, provider: { type: 'string' },
  },
});

const rel = (p: string) => path.relative(ROOT, p);
const ep = () => episodeDir(need(ref, 'episode'));
function need<T>(v: T | undefined, what: string): T { if (v === undefined) throw new Error(`Missing ${what}`); return v; }

const commands: Record<string, () => Promise<void>> = {
  // Creates styles/<style>/episodes/<date>-<slug>/ and copies the style's episode template into it.
  async new() {
    const format = need(o.style ?? o.format, '--style'), slug = need(o.slug, '--slug');
    const date = o.date ?? new Date().toISOString().slice(0, 10);
    const dir = path.join(episodesDir(format), `${date}-${slug}`);
    if (fs.existsSync(dir)) throw new Error(`${rel(dir)} already exists`);
    const template = path.join(packDir(format), 'template');
    if (fs.existsSync(template)) fs.cpSync(template, dir, { recursive: true });
    else fs.mkdirSync(dir, { recursive: true });
    const episode: Episode = { format, slug, date, title: o.title ?? slug, hook: '', altHooks: [], caption: '', endCard: true, gates: {} };
    writeJson(path.join(dir, 'episode.json'), episode);
    for (const [f, body] of [['script.txt', '# One spoken line per row.\n'], ['sources.json', '[]\n'], ['storyboard.json', '{ "shots": [] }\n']]) {
      if (!fs.existsSync(path.join(dir, f))) fs.writeFileSync(path.join(dir, f), body);
    }
    console.log(rel(dir));
  },

  async voice() {
    const dir = ep();
    const words = await generateVoice(dir, loadPack(loadEpisode(dir).format), { takes: o.takes ? Number(o.takes) : undefined, provider: o.provider as never });
    console.log(`voice.mp3 + words.json: ${words.length} words, ends at ${words.at(-1)!.end.toFixed(2)}s`);
  },

  // Re-checks an existing voice.mp3 against the script with Whisper.
  async clarity() {
    const dir = ep();
    const raw = path.join(dir, 'voice.f32');
    await exec(FFMPEG, ['-y', '-loglevel', 'error', '-i', path.join(dir, 'voice.mp3'), '-ac', '1', '-ar', '16000', '-f', 'f32le', raw]);
    const buf = fs.readFileSync(raw); fs.rmSync(raw);
    const audio = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
    const lines = readScriptLines(dir).filter(isVoiced).map(l => l.text.split(/\s+/).filter(Boolean));
    const take = await alignTake(lines.flat(), audio);
    let k = 0;
    const rows = lines.map(words => {
      const heard = words.map(() => take.heard[k++]);
      const missed = words.filter((_, i) => !heard[i]);
      return { text: words.join(' '), clarity: +(1 - missed.length / words.length).toFixed(3), missed };
    });
    writeJson(path.join(dir, 'clarity.json'), rows);
    console.log(`${path.basename(dir)}: ${(take.clarity * 100).toFixed(0)}% heard${take.missed.length ? `; missed: ${take.missed.join(', ')}` : ''}`);
    if (take.missed.length) console.log(`heard: ${take.transcript}`);
  },

  // Is everything installed? Node, ffmpeg, Chrome, the voice server, the styles and voices.
  async doctor() {
    const { FFMPEG: ff } = await import('./ffmpeg.ts');
    const { CHROME } = await import('./render.ts');
    const ok = (b: unknown, label: string, fix = '') => console.log(`${b ? 'ok  ' : 'MISS'} ${label}${!b && fix ? `\n     -> ${fix}` : ''}`);
    ok(Number(process.versions.node.split('.')[0]) >= 20, `Node ${process.versions.node}`, 'install Node 20 or newer');
    ok(ff && fs.existsSync(ff), `ffmpeg ${ff ?? ''}`, 'run npm install again (ffmpeg-static), or set FFMPEG_PATH');
    ok(CHROME, `Chrome ${CHROME ?? ''}`, 'npm run setup:chrome (downloads a headless Chrome into .cache/), or set CHROME_PATH');
    const q = await qwenAvailable();
    ok(q, `Qwen voice server at ${qwenUrl()}`, 'optional: SETUP.md "Better voices" (without it, Kokoro speaks)');
    const voices = fs.existsSync(path.join(ROOT, 'voices')) ? fs.readdirSync(path.join(ROOT, 'voices')).filter(f => f.endsWith('.wav')).map(f => f.slice(0, -4)) : [];
    console.log(`styles: ${allStyles().join(', ')}\nvoices: ${voices.join(', ') || '(none)'}`);
  },

  async variants() {
    const dir = ep(), base = loadEpisode(dir);
    const hooks = readJson<HookVersion[]>(path.join(dir, 'hooks.json'));
    const script = fs.readFileSync(path.join(dir, 'script.txt'), 'utf8').split('\n');
    const first = script.findIndex(l => l.trim() && !l.trim().startsWith('#'));
    const board = readJson<{ shots: StoryboardShot[] }>(path.join(dir, 'storyboard.json'));
    const out: string[] = [];
    for (const h of hooks) {
      const slug = `${base.slug}-${h.id}`, vdir = path.join(path.dirname(dir), `${base.date}-${slug}`);
      fs.mkdirSync(vdir, { recursive: true });
      const lines = [...script]; lines[first] = h.line;
      fs.writeFileSync(path.join(vdir, 'script.txt'), lines.join('\n'));
      writeJson(path.join(vdir, 'storyboard.json'), { shots: [h.shot, ...board.shots.slice(1)] });
      const say = h.line.replace(/\{[^}]*\}\s*$/, '').replace(/\[[a-z _-]+\]/gi, ' ').replace(/\s+/g, ' ').trim();
      writeJson(path.join(vdir, 'episode.json'), { ...base, slug, hook: say, onScreenHook: h.shot.title ?? '', hookMechanic: h.mechanic, altHooks: [], variantOf: base.slug } satisfies Episode);
      const rel = path.basename(dir);
      for (const f of ['scene.ts', 'sound.ts']) fs.writeFileSync(path.join(vdir, f), `export { default } from '../${rel}/${f}';\n`);
      fs.copyFileSync(path.join(dir, 'sources.json'), path.join(vdir, 'sources.json'));
      out.push(slug);
    }
    console.log(`hook versions: ${out.join(', ')}`);
  },

  // Estimated word timings from the script, for building the picture before the voice.
  async pace() {
    const dir = ep();
    const words = estimateWords(dir, loadPack(loadEpisode(dir).format));
    console.log(`words.json (estimated): ${words.length} words, ends at ${words.at(-1)!.end.toFixed(2)}s`);
  },

  async timeline() {
    const dir = ep();
    const tl = buildTimeline(dir, loadPack(loadEpisode(dir).format));
    console.log(`timeline.json: ${tl.duration.toFixed(2)}s, ${tl.shots.length} shots`);
    for (const s of tl.shots) console.log(`  ${s.id.padEnd(10)} ${s.start.toFixed(2)}-${s.end.toFixed(2)}  ${s.words || '(no words)'}`);
  },

  // Works on any folder with scene.ts + timeline.json, including design directions.
  async stills() {
    const dir = fs.existsSync(path.join(need(ref, 'folder'), 'scene.ts')) ? path.resolve(ref!) : ep();
    const tl = readJson<Timeline>(path.join(dir, 'timeline.json'));
    const at = o.at ? o.at.split(',').map(Number) : tl.shots.map(s => +(s.start + (s.end - s.start) * 0.6).toFixed(2));
    const r = await stills(dir, at, { preview: o.preview });
    console.log(r.files.map(rel).join('\n') + `\nsheet: ${rel(r.sheet)}`);
  },

  async build() {
    const dir = fs.existsSync(path.join(need(ref, 'folder'), 'scene.ts')) ? path.resolve(ref!) : ep();
    console.log(rel(await bundle(dir)));
  },

  async render() {
    const dir = ep();
    const t0 = Date.now();
    const out = await renderVideo(dir, { shots: o.shots?.split(','), workers: o.workers ? Number(o.workers) : undefined });
    console.log(`${rel(out)} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  },

  async score() {
    const dir = ep();
    const tl = readJson<Timeline>(path.join(dir, 'timeline.json'));
    // sound.ts default-exports a SoundSheet (tl => cues), or exports a ready `cues` array.
    const mod = await import(pathToFileURL(path.join(dir, 'sound.ts')).href) as { default?: SoundSheet; cues?: Cue[] };
    const cues = mod.default ? mod.default(tl) : mod.cues ?? [], sfx = sfxOnly(cues);
    renderScore(cues, tl.duration, path.join(dir, 'score.wav'));
    // Without the music bed: what export uses when pack.json "musicBed" is false (you add your own track).
    if (sfx.length) renderScore(sfx, tl.duration, path.join(dir, 'sfx.wav'));
    console.log(`score.wav: ${cues.length} cues; sfx.wav: ${sfx.length} sound effects, no music; over ${tl.duration.toFixed(2)}s`);
  },

  // Picture + score, no voice, with the script as a subtitle track: for approving the video first.
  async draft() {
    const files = await exportDraft(ep());
    console.log(files.map(rel).join('\n'));
  },

  async export() {
    const files = await exportEpisode(ep());
    console.log(files.map(rel).join('\n'));
  },

  async qa() {
    const dir = ep();
    const r = await qa(dir, loadPack(loadEpisode(dir).format));
    for (const i of r.issues) console.log(`${i.level.toUpperCase()} ${i.check}${i.shot ? ` [${i.shot}]` : ''}: ${i.detail}`);
    console.log(r.issues.some(i => i.level === 'fail') ? `\nFAILED. Re-render shots: ${r.rerender.join(',') || '(none, fix the inputs)'}` : '\nPASSED');
    if (r.strip) console.log(`strip: ${rel(r.strip)}`);
  },

  // Lists your episodes and the shipped examples.
  async list() {
    for (const style of allStyles()) {
      const mine = fs.existsSync(episodesDir(style)) ? fs.readdirSync(episodesDir(style)).filter(d => fs.existsSync(path.join(episodesDir(style), d, 'episode.json'))) : [];
      const ex = path.join(packDir(style), 'examples');
      const examples = fs.existsSync(ex) ? fs.readdirSync(ex).filter(d => fs.existsSync(path.join(ex, d, 'episode.json'))) : [];
      console.log(`${style}\n  episodes: ${mine.join(', ') || '(none yet)'}\n  examples: ${examples.join(', ') || '(none)'}`);
    }
  },

  // Records an approval: studio gate <episode> --gate pitch|script|look --note "..."
  async gate() {
    const dir = ep();
    const e = loadEpisode(dir);
    const g = need(o.gate, '--gate') as keyof Episode['gates'];
    if (!['pitch', 'script', 'look'].includes(g)) throw new Error('--gate must be pitch, script or look');
    e.gates[g] = `${new Date().toISOString()}${o.note ? ` ${o.note}` : ''}`;
    writeJson(path.join(dir, 'episode.json'), e);
    console.log(`gate ${g} approved`);
  },
};

const run = commands[cmd ?? ''];
if (!run) {
  console.log(`usage: npm run studio -- <${Object.keys(commands).join('|')}> [episode] [flags]`);
  process.exit(cmd ? 1 : 0);
}
run().catch(e => { console.error(`studio ${cmd}: ${e.message}`); process.exit(1); });
