// Camera moves inside a shot. Between shots it's always a HARD CUT; these are the moves within one.
//   locked      the default: nothing moves
//   push        auto zoom: slow, constant creep in (or out with to < from) over the whole shot
//   punch       punch-in: an instant jump in scale at time `at` (a cut inside the shot, same angle, tighter)
//   snap        snap zoom: a fast zoom that overshoots and settles, for a realisation or a sting
//   drift       slow pan toward a point (reveal), eased
//   shake       a short impact shake at `at` (a slam, a drop, a stamp)
// Usage inside a shot:  withCamera(c, t, dur, [{ kind: 'push', to: 1.06 }, { kind: 'punch', at: 1.8, to: 1.35, focus: [540, 760] }], () => draw(c));
import { outBack, ramp, rng, type C, type P } from './noise.ts';

export type Move =
  | { kind: 'locked' }
  | { kind: 'push'; from?: number; to: number; focus?: P }
  | { kind: 'punch'; at: number; to: number; focus?: P }
  | { kind: 'snap'; at: number; to: number; dur?: number; focus?: P }
  | { kind: 'drift'; from?: number; until?: number; by: P }
  | { kind: 'shake'; at: number; amp?: number; dur?: number };

export function cameraAt(t: number, dur: number, moves: Move[], W = 1080, H = 1920) {
  let z = 1, fx = W / 2, fy = H * 0.45, dx = 0, dy = 0;
  for (const m of moves) {
    if (m.kind === 'push') { const from = m.from ?? 1; z *= from + (m.to - from) * Math.min(1, t / dur); if (m.focus) [fx, fy] = m.focus; }
    if (m.kind === 'punch' && t >= m.at) { z *= m.to; if (m.focus) [fx, fy] = m.focus; }
    if (m.kind === 'snap' && t >= m.at) { const k = outBack(t, m.at, m.at + (m.dur ?? 0.25)); z *= 1 + (m.to - 1) * k; if (m.focus) [fx, fy] = m.focus; }
    if (m.kind === 'drift') { const k = ramp(t, m.from ?? 0, m.until ?? dur); dx += m.by[0] * k; dy += m.by[1] * k; }
    if (m.kind === 'shake' && t >= m.at && t < m.at + (m.dur ?? 0.3)) {
      const r = rng(Math.floor(t * 24) + 7), a = (m.amp ?? 14) * (1 - (t - m.at) / (m.dur ?? 0.3));
      dx += (r() - 0.5) * 2 * a; dy += (r() - 0.5) * 2 * a;
    }
  }
  return { z, fx, fy, dx, dy };
}

export function withCamera(c: C, t: number, dur: number, moves: Move[], draw: () => void) {
  const { z, fx, fy, dx, dy } = cameraAt(t, dur, moves, c.canvas.width, c.canvas.height);
  c.save();
  c.translate(fx - dx, fy - dy); c.scale(z, z); c.translate(-fx, -fy);
  draw();
  c.restore();
}
