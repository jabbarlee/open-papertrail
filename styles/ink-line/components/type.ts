// Text that writes on left to right, recorded for QA through core drawText.
import { clamp, drawText, type TextOpts } from '../../../core/canvas/kit.ts';
import type { Runtime } from '../../../core/scene.ts';
import { FONT, P } from './palette.ts';

export function writeOn(c: CanvasRenderingContext2D, rt: Runtime, text: string, x: number, y: number, o: TextOpts, p: number): void {
  p = clamp(p);
  if (p <= 0) return;
  c.save();
  if (p < 1) {
    c.font = `${o.weight ?? '400'} ${o.size}px "${o.font}"`;
    const w = Math.max(...text.split('\n').map(l => c.measureText(l).width));
    const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    const lines = text.split('\n').length;
    c.beginPath();
    c.rect(x0 - 20, y - o.size * 1.3, (w + 40) * p, o.size * 1.6 + (lines - 1) * o.size * (o.lineHeight ?? 1.1));
    c.clip();
  }
  drawText(c, rt, text, x, y, o);
  c.restore();
}

export const serif = (size: number, color = P.ink): TextOpts => ({ font: FONT.serif, size, color, maxWidth: 940, minSize: 70 });
export const hand = (size: number, color = P.ink): TextOpts => ({ font: FONT.hand, weight: '700', size, color });
