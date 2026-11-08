// Bone paper and film grain, baked once in setup.
import { rng } from '../../../core/canvas/kit.ts';
import { P } from './palette.ts';

let paper: HTMLCanvasElement, grain: HTMLCanvasElement[] = [];

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  return [cv, cv.getContext('2d')!];
}

export function makePaper(W: number, H: number): void {
  const [cv, c] = canvas(W, H), r = rng(3);
  c.fillStyle = P.paper; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(120,100,70,${r() * 0.014})`; c.beginPath(); c.arc(r() * W, r() * H, 60 + r() * 220, 0, 7); c.fill(); }
  for (let i = 0; i < 1600; i++) { c.fillStyle = `rgba(60,50,30,${r() * 0.12})`; c.fillRect(r() * W, r() * H, 1 + r() * 2, 1); }
  for (let i = 0; i < 160; i++) {
    c.strokeStyle = `rgba(90,75,50,${0.04 + r() * 0.05})`; c.lineWidth = 0.8;
    const x = r() * W, y = r() * H, a = r() * Math.PI;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10 + 3, x + Math.cos(a) * 24, y + Math.sin(a) * 24); c.stroke();
  }
  paper = cv;
  grain = [1, 2, 3, 4].map(s => {
    const [g, gc] = canvas(540, 960), rr = rng(50 + s), img = gc.createImageData(540, 960);
    for (let i = 0; i < img.data.length; i += 4) { const v = 100 + rr() * 155; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    gc.putImageData(img, 0, 0);
    return g;
  });
}

export function drawPaper(c: CanvasRenderingContext2D): void { c.drawImage(paper, 0, 0); }

// The same paper, redrawn over a horizontal strip (to knock the picture back to bare paper).
export function drawPaperRegion(c: CanvasRenderingContext2D, y: number, h: number, alpha = 1): void {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = alpha;
  c.drawImage(paper, 0, y, paper.width, h, 0, y, paper.width, h);
  c.restore();
}

export function drawGrain(c: CanvasRenderingContext2D, f: number, W: number, H: number): void {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.08;
  c.drawImage(grain[Math.floor(f / 2) % 4], 0, 0, W, H);
  c.restore();
}
