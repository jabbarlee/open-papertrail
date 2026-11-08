import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// Bundled binaries, so a broken system ffmpeg never stops a render.
export const FFMPEG: string = process.env.FFMPEG_PATH || require('ffmpeg-static');

export function run(bin: string, args: string[], opts: { quiet?: boolean } = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { err += d; });
    p.on('close', code => code === 0 ? resolve(out + (opts.quiet ? '' : err)) : reject(new Error(`${bin.split('/').pop()} ${args.slice(0, 6).join(' ')}… failed:\n${err.slice(-2000)}`)));
  });
}

export const ffmpeg = (args: string[]) => run(FFMPEG, ['-y', '-loglevel', 'error', ...args]);

export interface Probe { width: number; height: number; fps: number; duration: number; audio: boolean; audioDuration: number }

// Reads stream facts from ffmpeg's own banner, and the audio length by decoding it,
// so no separate ffprobe binary is needed.
export async function probe(file: string): Promise<Probe> {
  const info = await new Promise<string>(resolve => {
    const p = spawn(FFMPEG, ['-hide_banner', '-i', file]);
    let err = '';
    p.stderr.on('data', d => { err += d; });
    p.on('close', () => resolve(err));
  });
  const dur = /Duration: (\d+):(\d+):([\d.]+)/.exec(info);
  const video = /Stream.*Video:.*?(\d{2,5})x(\d{2,5}).*?([\d.]+) fps/.exec(info);
  const audio = /Stream.*Audio:/.test(info);
  let audioDuration = 0;
  if (audio) {
    const out = await run(FFMPEG, ['-hide_banner', '-i', file, '-map', '0:a:0', '-f', 'null', '-']);
    const times = [...out.matchAll(/time=(\d+):(\d+):([\d.]+)/g)].at(-1);
    if (times) audioDuration = +times[1] * 3600 + +times[2] * 60 + +times[3];
  }
  return {
    width: video ? +video[1] : 0, height: video ? +video[2] : 0, fps: video ? +video[3] : 0,
    duration: dur ? +dur[1] * 3600 + +dur[2] * 60 + +dur[3] : 0, audio, audioDuration,
  };
}
