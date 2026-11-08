// The painted overlay: what turns flat 2D into "painted". One physical surface over every pixel, characters included.
// Order: soft bleed → canvas tooth (soft-light) → boiling brush layer (soft-light) → warm grade → vignette →
// lifted warm blacks → moving grain. Call finish(c, f) last in render(). Draw the handwritten captions BEFORE it,
// so they sit in the paint like the reference's "Sir,".
import { bristle } from './paint.ts';
import { cl, fbm, hash2, plate, rng, type C } from './noise.ts';

interface Plates { tooth: HTMLCanvasElement; strokes: HTMLCanvasElement[]; grain: HTMLCanvasElement; soft: HTMLCanvasElement }
const cache = new Map<string, Plates>();

function build(W: number, H: number): Plates {
  const tooth = plate(W, H, (d, i, x, y) => {
    const v = 128 + (fbm(x / 2.5, y / 7, 51, 2) - 0.5) * 60 + (fbm(x / 120, y / 120, 52, 3) - 0.5) * 70 + (hash2(x, y, 53) - 0.5) * 16;
    d[i] = d[i + 1] = d[i + 2] = cl(v); d[i + 3] = 255;
  });
  const strokes: HTMLCanvasElement[] = [];
  for (let k = 0; k < 3; k++) {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d')!, r = rng(900 + k);
    g.fillStyle = '#808080'; g.fillRect(0, 0, W, H);
    const n = Math.round(520 * W * H / (1080 * 1920));
    for (let i = 0; i < n; i++) {
      bristle(g, r() * W * 1.2 - 100, r() * H, (r() - 0.5) * 0.9 + (r() < 0.3 ? Math.PI / 2 : 0), 120 + r() * 260, 30 + r() * 50, r() < 0.5 ? '#B4B4B4' : '#505050', r, 0.35);
    }
    strokes.push(cv);
  }
  const grain = plate(540, 540, (d, i, x, y) => {
    const v = hash2(x, y, 77);
    d[i] = d[i + 1] = d[i + 2] = v > 0.5 ? 255 : 0; d[i + 3] = cl(Math.abs(v - 0.5) * 2 * 22);
  });
  const soft = document.createElement('canvas'); soft.width = W; soft.height = H;
  return { tooth, strokes, grain, soft };
}

// Build the plates during setup so the first frame isn't slow.
export function prepareOverlay(W: number, H: number) { const k = `${W}x${H}`; if (!cache.has(k)) cache.set(k, build(W, H)); return cache.get(k)!; }

export interface OverlayOpts { strength?: number; warmth?: number; vignette?: number; boilEvery?: number }
export function finish(c: C, f: number, o: OverlayOpts = {}) {
  const W = c.canvas.width, H = c.canvas.height, P = prepareOverlay(W, H);
  const s = o.strength ?? 1;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.filter = 'none';
  const sg = P.soft.getContext('2d')!;
  sg.clearRect(0, 0, W, H); sg.filter = 'blur(1.4px)'; sg.drawImage(c.canvas, 0, 0); sg.filter = 'none';
  c.globalAlpha = 0.45; c.drawImage(P.soft, 0, 0);
  c.globalCompositeOperation = 'soft-light';
  c.globalAlpha = 0.6 * s; c.drawImage(P.tooth, 0, 0);
  c.globalAlpha = 0.75 * s; c.drawImage(P.strokes[Math.floor(f / (o.boilEvery ?? 4)) % 3], 0, 0);
  c.globalCompositeOperation = 'multiply';
  c.globalAlpha = 0.28 * (o.warmth ?? 1); c.fillStyle = '#E9D3AE'; c.fillRect(0, 0, W, H);
  const v = c.createRadialGradient(W / 2, H * 0.48, Math.min(W, H) * 0.55, W / 2, H * 0.5, Math.max(W, H) * 0.75);
  v.addColorStop(0, '#ffffff'); v.addColorStop(1, '#BBA88E');
  c.globalAlpha = 0.7 * (o.vignette ?? 1); c.fillStyle = v; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'lighten';
  c.globalAlpha = 1; c.fillStyle = '#221C17'; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'source-over';
  const gx = -((f * 137) % 300), gy = -((f * 71) % 300);
  for (let y = gy; y < H; y += 540) for (let x = gx; x < W; x += 540) c.drawImage(P.grain, x, y);
  c.restore();
}
