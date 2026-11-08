// Mechanical QA. Judgement calls (is it on-brand, does it look finished) stay with the /finish skill;
// this reports everything a script can measure, plus which shots to re-render.
import fs from 'node:fs';
import path from 'node:path';
import { ffmpeg, probe } from './ffmpeg.ts';
import { loadEpisode, readJson, readScript, writeJson } from './paths.ts';
import { Renderer, textAt } from './render.ts';
import { PLATFORM_UI as UI } from './platform.ts';
import type { PackConfig, Source, Timeline } from './types.ts';

export interface Issue { level: 'fail' | 'warn'; check: string; detail: string; shot?: string }

export const MIN_TEXT_PX = 44;

export async function qa(dir: string, pack: PackConfig): Promise<{ issues: Issue[]; rerender: string[]; strip?: string }> {
  const ep = loadEpisode(dir);
  const tl = readJson<Timeline>(path.join(dir, 'timeline.json'));
  const issues: Issue[] = [];
  const add = (level: Issue['level'], check: string, detail: string, shot?: string) => issues.push({ level, check, detail, shot });

  // Length and pacing.
  const { minSeconds, maxSeconds } = pack.video;
  if (tl.duration < minSeconds || tl.duration > maxSeconds) add('fail', 'length', `${tl.duration.toFixed(1)}s, pack wants ${minSeconds}-${maxSeconds}s`);
  const spoken = tl.lines.filter(l => !l.speaker);
  if (tl.lines[0] && tl.lines[0].end > 2.8) add('warn', 'hook', `first line ends at ${tl.lines[0].end.toFixed(2)}s; the hook should land fast (by ~2.8s)`);
  for (const s of tl.shots) {
    const len = s.end - s.start;
    // A new beat every 2-3 s: very short shots can't be read, long ones go dead.
    if (s.firstWord >= 0 && len > 3.5) add('warn', 'pacing', `${len.toFixed(2)}s on one visual (target a new beat every 2-3s)`, s.id);
    if (s.firstWord >= 0 && len < 0.8) add('warn', 'pacing', `${len.toFixed(2)}s is too fast to read`, s.id);
    if (!s.change?.trim()) add('fail', 'storyboard', 'no visible change written for this cut', s.id);
  }
  // Talking speed inside each line: a slow overall pace can hide fast bursts.
  // Unvoiced (speaker) lines are read, not heard: their hold comes from reading time, so only the voiceover is checked.
  for (const l of spoken) {
    const n = l.text.split(/\s+/).filter(Boolean).length, wps = n / Math.max(0.1, l.end - l.start);
    // A natural voice speed reads best, so only a real rush fails.
    if (n >= 4 && wps > 6.5) add('fail', 'pace', `"${l.text}" is spoken at ${wps.toFixed(1)} words/s (garbled? listen and regenerate)`);
    else if (n >= 4 && wps > 4.2) add('warn', 'pace', `"${l.text}" is spoken at ${wps.toFixed(1)} words/s (fast; consider cutting a word)`);
  }
  const clarityFile = path.join(dir, 'clarity.json');
  if (fs.existsSync(clarityFile)) {
    const takes = readJson<{ text: string; clarity: number; missed: string[] }[]>(clarityFile);
    const total = takes.reduce((n, t) => n + t.text.split(' ').length, 0);
    const missed = takes.reduce((n, t) => n + t.missed.length, 0);
    const overall = total ? 1 - missed / total : 1;
    if (overall < 0.9) add('fail', 'voice', `only ${(overall * 100).toFixed(0)}% of the script was heard in the voiceover; regenerate the voice`);
    for (const t of takes) {
      if (!t.missed.length) continue;
      const bad = t.missed.length >= 2 && t.clarity < 0.7;
      add(bad ? 'fail' : 'warn', 'voice', `"${t.text}": not heard clearly: ${t.missed.join(', ')}${bad ? '; regenerate this voice' : '; listen to it'}`);
    }
  } else if (!fs.existsSync(path.join(dir, 'words.estimated'))) {
    add('warn', 'voice', 'no clarity.json; this voice was made before the clarity check, so listen to it');
  }
  if (fs.existsSync(path.join(dir, 'words.estimated'))) add('fail', 'voice', 'words.json holds estimated timings; run `npm run studio -- voice <episode>`');

  const spokenShots = tl.shots.filter(s => s.firstWord >= 0);
  const avg = spokenShots.reduce((t, s) => t + s.end - s.start, 0) / Math.max(1, spokenShots.length);
  if (spokenShots.length && avg < 1.2) add('fail', 'pacing', `shots average ${avg.toFixed(2)}s; too many cuts to follow`);

  // Facts: every claim has a checked source, and no killed claim survived into the script.
  const sourcesFile = path.join(dir, 'sources.json');
  const script = readScript(dir).join(' ').toLowerCase();
  if (!fs.existsSync(sourcesFile)) add('fail', 'facts', 'sources.json missing; write [] if the script states no facts, else the checked sources');
  else {
    const sources = readJson<Source[]>(sourcesFile);
    if (!sources.some(s => s.verdict !== 'killed')) add('warn', 'facts', 'no study cited: make sure the script states no facts');
    for (const s of sources) {
      if (s.verdict !== 'killed' && (!s.url || !s.year || !s.authors)) add('fail', 'facts', `"${s.claim}" lacks author/year/link`);
      if (s.verdict === 'killed' && script.includes(s.claim.toLowerCase())) add('fail', 'facts', `killed claim still in script: "${s.claim}"`);
    }
  }
  if (!ep.gates.script) add('fail', 'gate', 'script + sources not approved');
  if (!ep.gates.look) add('fail', 'gate', 'look not approved');

  // Text: clear of the TikTok/Reels UI and large enough for a phone, checked 4 times a second.
  const bad = new Map<string, Issue>();
  const r = await Renderer.open(dir);
  try {
    const pg = await r.page();
    for (let f = 0; f < Math.round(tl.duration * tl.fps); f += Math.round(tl.fps / 4)) {
      const shot = tl.shots.find(s => s.start <= f / tl.fps && f / tl.fps < s.end)!;
      for (const b of await textAt(pg, f)) {
        const problems = [
          b.x0 < UI.side && 'left edge', b.x1 > tl.width - UI.side && 'right edge',
          b.y0 < UI.top && 'top tabs zone',
          b.y1 > tl.height - UI.bottom && `bottom ${UI.bottom}px (username/description)`,
          b.x1 > tl.width - UI.right && b.y1 > UI.rightFrom && 'right button column',
          b.size < MIN_TEXT_PX && `${Math.round(b.size)}px is too small for a phone`,
        ].filter(Boolean);
        if (problems.length && !bad.has(shot.id + b.text)) {
          bad.set(shot.id + b.text, { level: 'fail', check: 'text', detail: `"${b.text}" at ${(f / tl.fps).toFixed(2)}s: ${problems.join(', ')}`, shot: shot.id });
        }
      }
    }
  } finally { await r.close(); }
  issues.push(...bad.values());

  // The file itself.
  const final = path.join(dir, `${ep.slug}.mp4`);
  let strip: string | undefined;
  if (fs.existsSync(final)) {
    const p = await probe(final);
    if (p.width !== 1080 || p.height !== 1920) add('fail', 'file', `${p.width}x${p.height}, needs 1080x1920`);
    if (Math.abs(p.fps - 30) > 0.01) add('fail', 'file', `${p.fps} fps, needs 30`);
    if (!p.audio) add('fail', 'file', 'no audio track');
    else if (Math.abs(p.audioDuration - p.duration) > 0.1) add('fail', 'sync', `audio ${p.audioDuration.toFixed(2)}s vs video ${p.duration.toFixed(2)}s`);
    const voice = await probe(path.join(dir, 'voice.mp3'));
    if (voice.duration > tl.words.at(-1)!.end + 0.6) add('warn', 'sync', `voice file runs ${(voice.duration - tl.words.at(-1)!.end).toFixed(2)}s past the last word`);
    strip = path.join(dir, 'strip.jpg');
    await ffmpeg(['-i', final, '-vf', 'fps=3,scale=144:-1,tile=15x4', '-frames:v', '1', '-q:v', '3', strip]);
  } else add('warn', 'file', 'no final mp4 yet; run export, then qa again');

  const rerender = [...new Set(issues.filter(i => i.shot && i.level === 'fail' && i.check === 'text').map(i => i.shot!))];
  writeJson(path.join(dir, 'qa.json'), { at: new Date().toISOString(), issues, rerender });
  return { issues, rerender, strip };
}
