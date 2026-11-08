// Runs in the browser. Boots a Scene on a canvas and exposes the render contract the renderer drives:
// window.render(f) draws frame f (pure), window.READY flips once fonts and assets are built.
import type { Runtime, Scene } from '../scene.ts';
import type { Timeline } from '../types.ts';

declare global {
  interface Window { READY: boolean; FPS: number; NF: number; render(f: number): void; TEXT: Runtime['text']; ERRORS: string[] }
}

export async function boot(scene: Scene, tl: Timeline): Promise<void> {
  window.ERRORS = [];
  const params = new URLSearchParams(location.search);
  const W = tl.width, H = tl.height, FPS = tl.fps, NF = Math.round(tl.duration * FPS);
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  document.body.appendChild(cv);
  const c = cv.getContext('2d', { willReadFrequently: true })!;

  for (const f of scene.fonts ?? []) {
    const face = new FontFace(f.family, `url(${f.url})`, { weight: f.weight ?? '400', style: f.style ?? 'normal' });
    document.fonts.add(await face.load());
  }
  await scene.setup?.({ W, H, tl, params });

  let shotIndex = 0;
  window.FPS = FPS;
  window.NF = NF;
  window.render = (f: number) => {
    const t = f / FPS;
    while (shotIndex > 0 && tl.shots[shotIndex].start > t) shotIndex--;
    while (shotIndex < tl.shots.length - 1 && tl.shots[shotIndex].end <= t) shotIndex++;
    const shot = tl.shots[shotIndex];
    const len = Math.max(1e-6, shot.end - shot.start);
    const rt: Runtime = {
      W, H, FPS, NF, f, t, tl, shot, shotIndex,
      local: t - shot.start, p: Math.min(1, Math.max(0, (t - shot.start) / len)),
      word: tl.words.find(w => w.start <= t && t < w.end) ?? null,
      text: [], params,
    };
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.filter = 'none';
    c.clearRect(0, 0, W, H);
    scene.render(c, rt);
    window.TEXT = rt.text;
  };
  window.READY = true;

  if (!params.has('render')) livePreview(cv, FPS, NF);
}

// Plays the piece in the tab, with the voiceover when there is one. Click to start, space to pause.
function livePreview(cv: HTMLCanvasElement, FPS: number, NF: number): void {
  cv.style.cssText = 'height:96vh;display:block;margin:2vh auto;cursor:pointer';
  document.body.style.cssText = 'margin:0;background:#111';
  const audio = new Audio('../voice.mp3');
  let t0 = 0, playing = false;
  window.render(0);
  const tick = () => {
    if (!playing) return;
    const f = Math.floor(((performance.now() - t0) / 1000) * FPS) % NF;
    window.render(f);
    requestAnimationFrame(tick);
  };
  const toggle = () => {
    playing = !playing;
    if (playing) { t0 = performance.now() - audio.currentTime * 1000; audio.play().catch(() => {}); tick(); } else audio.pause();
  };
  cv.addEventListener('click', toggle);
  addEventListener('keydown', e => { if (e.code === 'Space') toggle(); });
  audio.addEventListener('ended', () => { audio.currentTime = 0; t0 = performance.now(); });
}
