import fs from 'node:fs';
import path from 'node:path';
import { FFMPEG, ffmpeg, run } from './ffmpeg.ts';
import { loadEpisode, loadPack, readJson } from './paths.ts';
import type { Line, Source, Timeline, Word } from './types.ts';

// Final 1080x1920 MP4: picture + voice, score ducked under the voice, loudness at -14 LUFS.
export async function exportEpisode(dir: string): Promise<string[]> {
  const ep = loadEpisode(dir);
  const tl = readJson<Timeline>(path.join(dir, 'timeline.json'));
  const video = path.join(dir, 'video.mp4'), voice = path.join(dir, 'voice.mp3');
  // pack.json "musicBed": false (the default) leaves the synthesized music out, so the voice and effects sit under
  // a track you add on the platform. true mixes the style's music bed in.
  const musicBed = loadPack(ep.format).musicBed ?? false;
  const score = path.join(dir, musicBed || !fs.existsSync(path.join(dir, 'sfx.wav')) ? 'score.wav' : 'sfx.wav');
  for (const f of [video, voice]) if (!fs.existsSync(f)) throw new Error(`Missing ${path.basename(f)}`);
  const out = path.join(dir, `${ep.slug}.mp4`);

  const hasScore = fs.existsSync(score);
  const audio = hasScore
    // Trim and pad the voice to exactly the video's length: the ducker ends where its key input ends, and a
    // voice that runs past the bed stalls asplit (the ducker stops reading its copy) and hangs ffmpeg.
    ? `[1:a]aresample=48000,atrim=end=${tl.duration.toFixed(3)},apad=whole_dur=${tl.duration.toFixed(3)},asplit=2[vo][key];[2:a]aresample=48000,volume=0.6[bed];` +
      '[bed][key]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=300[duck];' +
      '[vo][duck]amix=inputs=2:duration=longest:normalize=0,loudnorm=I=-14:TP=-1.2:LRA=11[a]'
    : '[1:a]aresample=48000,apad,loudnorm=I=-14:TP=-1.2:LRA=11[a]';
  // Pass 1 measures the mix; pass 2 normalises with those numbers (one-pass undershoots on quiet mixes).
  const inputs = ['-i', video, '-i', voice, ...(hasScore ? ['-i', score] : [])];
  const report = await run(FFMPEG, ['-hide_banner', ...inputs, '-filter_complex', audio.replace('loudnorm=I=-14:TP=-1.2:LRA=11[a]', 'loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json[a]'), '-map', '[a]', '-f', 'null', '-']);
  const m = JSON.parse(report.slice(report.lastIndexOf('{'), report.lastIndexOf('}') + 1));
  const measured = `:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  await ffmpeg([
    ...inputs,
    '-filter_complex', audio.replace('loudnorm=I=-14:TP=-1.2:LRA=11[a]', `loudnorm=I=-14:TP=-1.2:LRA=11${measured}[a]`), '-map', '0:v', '-map', '[a]',
    '-vf', `scale=${tl.width}:${tl.height},fps=${tl.fps}`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-maxrate', '22M', '-bufsize', '44M', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-t', tl.duration.toFixed(3), '-movflags', '+faststart', out,
  ]);

  const srt = path.join(dir, `${ep.slug}.srt`);
  fs.writeFileSync(srt, toSrt(tl.lines, tl.words));

  const sources = fs.existsSync(path.join(dir, 'sources.json')) ? readJson<Source[]>(path.join(dir, 'sources.json')) : [];
  const cited = sources.filter(s => s.verdict !== 'killed');
  const caption = path.join(dir, 'caption.txt');
  const cites = [...new Set(cited.filter(s => !/own calculation/i.test(s.authors)).map(shortCite))];
  fs.writeFileSync(caption, [ep.caption.trim(), ...(cites.length ? ['', `Based on ${cites.join('; ')}.`] : [])].join('\n') + '\n');

  const hooks = path.join(dir, 'hooks.txt');
  fs.writeFileSync(hooks, [`A (posted): ${ep.hook}`, ...ep.altHooks.map((h, i) => `${String.fromCharCode(66 + i)}: ${h}`)].join('\n') + '\n');

  return [out, srt, caption, hooks];
}

export async function exportDraft(dir: string): Promise<string[]> {
  const ep = loadEpisode(dir);
  const tl = readJson<Timeline>(path.join(dir, 'timeline.json'));
  const video = path.join(dir, 'video.mp4'), score = path.join(dir, 'score.wav');
  if (!fs.existsSync(video)) throw new Error('Missing video.mp4; run render first');
  const srt = path.join(dir, `${ep.slug}-draft.srt`);
  fs.writeFileSync(srt, toSrt(tl.lines, tl.words));
  const out = path.join(dir, `${ep.slug}-draft.mp4`);
  const hasScore = fs.existsSync(score);
  await ffmpeg([
    '-i', video, ...(hasScore ? ['-i', score] : []), '-i', srt,
    '-map', '0:v', ...(hasScore ? ['-map', '1:a'] : []), '-map', `${hasScore ? 2 : 1}:s`,
    '-c:v', 'copy', ...(hasScore ? ['-c:a', 'aac', '-b:a', '192k', '-af', 'loudnorm=I=-16:TP=-1.5'] : []),
    '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng', '-t', tl.duration.toFixed(3), '-movflags', '+faststart', out,
  ]);
  return [out, srt];
}

// "Bond, C. F., Pitre, U., & Van Leeuwen" -> "Bond et al. (1991)"; "Brenner, M." -> "Brenner (1973)";
// organisations keep their name: "U.S. Bureau of Labor Statistics; Our World in Data" -> "U.S. Bureau of Labor Statistics et al. (2026)".
function shortCite(s: Source): string {
  let parts = s.authors.split(/;|&| and /).map(p => p.trim()).filter(Boolean);
  // "Elizabeth Arias, Jiaquan Xu, Kenneth Kochanek": full names separated by commas.
  if (!/, ([A-Z]\.\s?)+/.test(parts[0]) && /^([A-Z][a-z]+ )+[A-Z][a-z]+(, ([A-Z][a-z]+ )+[A-Z][a-z]+)+$/.test(parts[0])) parts = [...parts[0].split(', '), ...parts.slice(1)];
  const first = parts[0];
  const person = /^[^,]+, ([A-Z]\.\s?)+/.exec(first);          // "Surname, X. Y."
  const name = person ? first.split(',')[0] : /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(first) ? first.split(' ').at(-1)! : first;
  const many = parts.length > 1 || (person !== null && first.split(',').length > 2);
  return `${name}${many ? ' et al.' : ''} (${s.year})`;
}

const stamp = (s: number) => {
  const ms = Math.round(s * 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3_600_000))}:${p(Math.floor(ms / 60_000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

// One cue per script line, split at ~42 characters on word boundaries. A shown-not-spoken (speaker) line is one cue
// for its whole hold, labelled with the speaker ("MIA: ..."), since its word timings are only estimates.
export function toSrt(lines: Line[], words: Word[]): string {
  const cues: { text: string; start: number; end: number }[] = [];
  for (const line of lines) {
    if (line.speaker) { cues.push({ text: `${line.speaker.toUpperCase()}: ${line.text}`, start: line.start, end: Math.max(line.end, line.start + 1) }); continue; }
    const ws = words.filter(w => w.start >= line.start - 1e-3 && w.end <= line.end + 1e-3);
    let cur: Word[] = [];
    const flush = () => { if (cur.length) cues.push({ text: cur.map(w => w.text).join(' '), start: cur[0].start, end: cur.at(-1)!.end }); cur = []; };
    for (const w of ws) {
      if ([...cur, w].map(x => x.text).join(' ').length > 42) flush();
      cur.push(w);
    }
    flush();
  }
  return cues.map((c, i) => `${i + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`).join('\n');
}
