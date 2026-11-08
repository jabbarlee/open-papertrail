import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Episode, PackConfig } from './types.ts';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// One folder per style: styles/<id>/ holds pack.json, the style's docs, components/ and fonts/, plus your own
// episodes/ (gitignored renders) and pitches/, and the worked examples/ that ship with the repo.
export const STYLES = path.join(ROOT, 'styles');

export function packDir(id: string): string {
  const dir = path.join(STYLES, id);
  if (!fs.existsSync(path.join(dir, 'pack.json'))) throw new Error(`No style "${id}" (expected styles/${id}/pack.json). Styles: ${allStyles().join(', ')}`);
  return dir;
}

export const episodesDir = (format: string) => path.join(packDir(format), 'episodes');
export const pitchesDir = (format: string) => path.join(packDir(format), 'pitches');

export const allStyles = (): string[] =>
  fs.existsSync(STYLES) ? fs.readdirSync(STYLES).filter(s => fs.existsSync(path.join(STYLES, s, 'pack.json'))).sort() : [];

// Every styles/<id>/episodes/<date>-<slug>/ folder, then the shipped styles/<id>/examples/<slug>/ folders.
function allEpisodeDirs(): string[] {
  return ['episodes', 'examples'].flatMap(kind => allStyles().flatMap(s => {
    const dir = path.join(STYLES, s, kind);
    return fs.existsSync(dir) ? fs.readdirSync(dir).map(d => path.join(dir, d)).filter(d => fs.existsSync(path.join(d, 'episode.json'))) : [];
  }));
}

export function loadPack(id: string): PackConfig {
  return readJson<PackConfig>(path.join(packDir(id), 'pack.json'));
}

// Accepts "2026-10-18-next-in-line", a path, or a bare slug when only one episode has it.
export function episodeDir(ref: string): string {
  if (fs.existsSync(path.join(ref, 'episode.json'))) return path.resolve(ref);
  const all = allEpisodeDirs();
  const direct = all.find(d => path.basename(d) === ref);
  if (direct) return direct;
  const matches = all.filter(d => path.basename(d).endsWith(`-${ref}`) && d.includes(`${path.sep}episodes${path.sep}`));
  if (matches.length === 1) return matches[0];
  throw new Error(matches.length ? `"${ref}" matches several episodes: ${matches.map(d => path.basename(d)).join(', ')}` : `No episode "${ref}" in styles/*/episodes or styles/*/examples`);
}

export function loadEpisode(dir: string): Episode {
  return readJson<Episode>(path.join(dir, 'episode.json'));
}

export function readJson<T>(file: string): T {
  if (!fs.existsSync(file)) throw new Error(`Missing ${path.relative(ROOT, file)}`);
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

export function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

// Script lines as spoken: one sentence or phrase per line, blank lines and # notes ignored.
// A line may end with delivery notes for the voice, e.g. `{pause=0.6 say="eight fourteen"}`:
// - pause is the silence after the line (seconds); say="..." respells it for the voice (the captions keep the text);
// - speaker="<name>" marks a line that is shown, never spoken (on-screen dialogue): it isn't synthesized, the voice
//   track holds silence for its reading time (or hold=<seconds>), and its words still get timings so shots and
//   captions can sync to it. A line without a speaker is the voiceover, exactly as before.
// Bracketed tags such as [laugh] or [sigh] are sent to the voice but are not spoken words.
export interface ScriptLine { text: string; say: string; speed?: number; pause?: number; gain?: number; join?: boolean; speaker?: string; hold?: number }

export const isVoiced = (l: { speaker?: string }) => !l.speaker;

const TAG = /\[[a-z _-]+\]/gi;

export function readScriptLines(dir: string): ScriptLine[] {
  return fs.readFileSync(path.join(dir, 'script.txt'), 'utf8')
    .split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
    .map(l => {
      const m = /\{([^}]*)\}\s*$/.exec(l);
      const say = (m ? l.slice(0, m.index) : l).trim();
      const line: ScriptLine = { say, text: say.replace(TAG, ' ').replace(/\s+/g, ' ').trim() };
      const notes = m?.[1] ?? '';
      for (const [, k, v] of notes.matchAll(/(speed|pause|gain|hold)\s*=\s*([\d.]+)/g)) line[k as 'speed'] = Number(v);
      if (/(^|\s)join(\s|$)/.test(notes)) line.join = true;
      const respell = /say\s*=\s*"([^"]*)"/.exec(notes);
      if (respell) line.say = respell[1];
      const speaker = /speaker\s*=\s*"?([\w-]+)"?/.exec(notes);
      if (speaker) line.speaker = speaker[1].toLowerCase();
      return line;
    });
}

// Script lines as spoken (delivery notes removed).
export function readScript(dir: string): string[] {
  return readScriptLines(dir).map(l => l.text);
}
