// Bundles a piece (scene.ts + timeline.json), serves it, and drives headless Chrome frame by frame.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { build } from 'esbuild';
import puppeteer, { type Browser, type Page } from 'puppeteer-core';
import { ffmpeg, FFMPEG } from './ffmpeg.ts';
import { ROOT, readJson } from './paths.ts';
import { shotFrames } from './timeline.ts';
import type { TextBox } from './scene.ts';
import type { Timeline } from './types.ts';

// Installed Chrome/Edge, or the headless Chrome that `npm run setup:chrome` downloads into .cache/.
function findCachedChrome(): string | undefined {
  const stack = [path.join(ROOT, '.cache', 'chrome-headless-shell'), '/opt/chrome', '/opt/pw-browsers'].filter(d => fs.existsSync(d));
  while (stack.length) {
    const d = stack.pop()!;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.name === 'chrome-headless-shell' || e.name === 'headless_shell') return p;   // Chrome for Testing / Playwright builds
    }
  }
}

export const CHROME = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  findCachedChrome(),
].find(p => p && fs.existsSync(p));

// Containers (cloud runs) need these; a desktop Chrome doesn't.
// STUDIO_SWIFTSHADER=1 swaps --disable-gpu for software WebGL, for 3D packs on a machine without a GPU.
const SOFT_GL = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const CHROME_ARGS = process.env.STUDIO_SWIFTSHADER === '1'
  ? [...(process.platform === 'linux' ? ['--no-sandbox', '--disable-dev-shm-usage'] : []), ...SOFT_GL]
  : process.platform === 'linux' ? ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] : [];

const TYPES: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
};

// A piece directory holds scene.ts and timeline.json (an episode folder, or a design-direction folder).
export async function bundle(dir: string): Promise<string> {
  const out = path.join(dir, 'build');
  fs.mkdirSync(out, { recursive: true });
  await build({
    stdin: {
      contents: [
        `import scene from './scene.ts';`,
        `import tl from './timeline.json';`,
        `import { boot } from ${JSON.stringify(path.join(ROOT, 'core/canvas/runtime.ts'))};`,
        `boot(scene, tl).catch(e => { (window.ERRORS ||= []).push(String(e && e.stack || e)); console.error(e); });`,
      ].join('\n'),
      resolveDir: dir, loader: 'ts', sourcefile: 'entry.ts',
    },
    bundle: true, format: 'iife', target: 'chrome120', outfile: path.join(out, 'bundle.js'), logLevel: 'warning', sourcemap: 'inline',
  });
  fs.writeFileSync(path.join(out, 'piece.html'),
    `<!doctype html><meta charset="utf-8"><title>${path.basename(dir)}</title><style>body{margin:0}</style><body><script src="bundle.js"></script></body>\n`);
  return path.join(out, 'piece.html');
}

function serve(): Promise<{ port: number; close(): void }> {
  const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(new URL(req.url!, 'http://x').pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ port: (server.address() as any).port, close: () => server.close() })));
}

export class Renderer {
  private browser: Browser;
  private server: { port: number; close(): void };
  private url: string;
  private constructor(browser: Browser, server: { port: number; close(): void }, url: string) {
    this.browser = browser; this.server = server; this.url = url;
  }

  static async open(dir: string): Promise<Renderer> {
    if (!CHROME) throw new Error('No Chrome or Edge found; set CHROME_PATH');
    const html = await bundle(dir);
    const server = await serve();
    const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 900_000, args: CHROME_ARGS });
    return new Renderer(browser, server, `http://127.0.0.1:${server.port}/${path.relative(ROOT, html)}?render=1`);
  }

  async page(): Promise<Page> {
    const pg = await this.browser.newPage();
    const errors: string[] = [];
    pg.on('pageerror', e => errors.push((e as Error).message));
    await pg.goto(this.url);
    await pg.waitForFunction('window.READY === true || (window.ERRORS && window.ERRORS.length > 0)', { timeout: 300_000 });
    const pageErrors = await pg.evaluate(() => window.ERRORS);
    if (pageErrors.length || errors.length) throw new Error(`Scene failed to boot:\n${[...pageErrors, ...errors].join('\n')}`);
    return pg;
  }

  async close(): Promise<void> { await this.browser.close(); this.server.close(); }
}

export async function frame(pg: Page, f: number, type: 'png' | 'jpeg' = 'png'): Promise<{ img: Buffer; text: TextBox[] }> {
  const r = await pg.evaluate((f, type) => {
    window.render(f);
    return { url: document.querySelector('canvas')!.toDataURL(`image/${type}`, 0.92), text: window.TEXT };
  }, f, type);
  return { img: Buffer.from(r.url.split(',')[1], 'base64'), text: r.text };
}

// Only the text boxes, without pixels: cheap enough to check every few frames.
export async function textAt(pg: Page, f: number): Promise<TextBox[]> {
  return pg.evaluate(f => { window.render(f); return window.TEXT; }, f);
}

export interface StillsResult { files: string[]; sheet: string; text: Record<string, TextBox[]> }

// Key frames at the given seconds. `preview` keeps them small (540 px wide) to save time and tokens.
export async function stills(dir: string, at: number[], opts: { preview?: boolean; name?: string } = {}): Promise<StillsResult> {
  const tl = readJson<Timeline>(path.join(dir, 'timeline.json'));
  const outDir = path.join(dir, opts.preview ? 'preview' : 'stills');
  fs.mkdirSync(outDir, { recursive: true });
  const r = await Renderer.open(dir);
  const files: string[] = [];
  const text: StillsResult['text'] = {};
  try {
    const pg = await r.page();
    for (const s of at) {
      const f = Math.min(Math.round(s * tl.fps), Math.round(tl.duration * tl.fps) - 1);
      const { img, text: boxes } = await frame(pg, f);
      const file = path.join(outDir, `${opts.name ?? 's'}_${s.toFixed(2)}.${opts.preview ? 'jpg' : 'png'}`);
      if (opts.preview) {
        const tmp = file + '.png';
        fs.writeFileSync(tmp, img);
        await ffmpeg(['-i', tmp, '-vf', 'scale=540:-1', '-q:v', '3', file]);
        fs.rmSync(tmp);
      } else fs.writeFileSync(file, img);
      files.push(file);
      text[s.toFixed(2)] = boxes;
    }
  } finally { await r.close(); }
  const sheet = path.join(outDir, `${opts.name ?? 's'}_sheet.jpg`);
  await contactSheet(files, sheet);
  return { files, sheet, text };
}

export async function contactSheet(files: string[], out: string, width = 360): Promise<void> {
  const inputs = files.flatMap(f => ['-i', f]);
  const scaled = files.length === 1 ? `[0]scale=${width}:-1` : files.map((_, i) => `[${i}]scale=${width}:-1[v${i}]`).join(';');
  const stack = files.length > 1 ? `;${files.map((_, i) => `[v${i}]`).join('')}hstack=inputs=${files.length}` : '';
  await ffmpeg([...inputs, '-filter_complex', scaled + stack, '-frames:v', '1', '-q:v', '3', out]);
}

// Renders shots into segments/<id>.mp4 (all, or just the ids given), then joins them into video.mp4.
export async function renderVideo(dir: string, opts: { shots?: string[]; workers?: number } = {}): Promise<string> {
  const tl = readJson<Timeline>(path.join(dir, 'timeline.json'));
  const segDir = path.join(dir, 'segments');
  fs.mkdirSync(segDir, { recursive: true });
  const todo = tl.shots.filter(s => !opts.shots || opts.shots.includes(s.id) || !fs.existsSync(path.join(segDir, `${s.id}.mp4`)));
  const r = await Renderer.open(dir);
  try {
    const queue = [...todo];
    const worker = async () => {
      const pg = await r.page();
      for (let s = queue.shift(); s; s = queue.shift()) {
        const [f0, f1] = shotFrames(s, tl.fps);
        await encode(pg, f0, f1, tl.fps, path.join(segDir, `${s.id}.mp4`));
        console.log(`  shot ${s.id}: frames ${f0}-${f1 - 1}`);
      }
      await pg.close();
    };
    await Promise.all(Array.from({ length: Math.min(opts.workers ?? 3, Math.max(1, todo.length)) }, worker));
  } finally { await r.close(); }

  const list = path.join(segDir, 'list.txt');
  fs.writeFileSync(list, tl.shots.map(s => `file '${s.id}.mp4'`).join('\n') + '\n');
  const video = path.join(dir, 'video.mp4');
  await ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', video]);
  return video;
}

async function encode(pg: Page, f0: number, f1: number, fps: number, out: string): Promise<void> {
  const { spawn } = await import('node:child_process');
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise<void>((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error(`ffmpeg exited ${c} on ${out}`))));
  for (let f = f0; f < f1; f++) {
    const { img } = await frame(pg, f);
    if (!ff.stdin.write(img)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await done;
}
