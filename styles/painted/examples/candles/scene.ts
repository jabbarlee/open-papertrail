// Candles. Every Saturday Otto buys one birthday candle at the bakery. Today he asks for two. At home, his cactus gets
// a candle every week, and this week it grew a pup. Third person: a deadpan narrator; the baker's one line is a caption.
import type { Runtime } from '../../../../core/scene.ts';
import { brushLine, paintRect, shadowBlob, paint } from '../../components/paint.ts';
import { S, SKIN, ell, hand, limb, line, shape } from '../../components/ink.ts';
import { caption } from '../../components/props.ts';
import { blinkAt, outBack, outCubic, ramp, type C, type P } from '../../components/noise.ts';
import { L, W, H, cam, wordT, ottoAt, ottoHeadAt, maeAt, paintedEpisode, type Shot } from '../../components/episode.ts';

const WALL = '#C9B48E', SHELF = '#5A3A26', TOP = '#4A3020', WOOD = '#7A5236', CREAM = '#E6DCC4', HOME = '#8C9A7A';

// ---------------- props ----------------
// A striped birthday candle standing on its base at (x, yB); lit draws an inked flame that flickers on twos.
function candle(c: C, x: number, yB: number, s: number, t: number, lit: boolean, seed: number, ang = 0) {
  c.save(); c.translate(x, yB); c.rotate(ang); c.scale(s, s); S.inkw = 4 / s;
  shape(c, [[-12, 0], [-12, -150], [12, -150], [12, 0]], '#E9DCC8', seed);
  for (let k = 0; k < 5; k++) line(c, [[-12, -14 - k * 30], [12, -34 - k * 30]], seed + 1 + k, 6 / s, '#B4553A');
  line(c, [[0, -150], [2, -176]], seed + 9, 3 / s);
  if (lit) {
    const fl = Math.sin(t * 23 + seed) * 4;
    shape(c, [[0, -230 + fl], [16, -196], [12, -178], [0, -172], [-12, -178], [-16, -196]], '#E8A63A', seed + 10);
    shape(c, [[0, -208 + fl * 0.6], [7, -190], [0, -180], [-7, -190]], '#F4E3B0', seed + 11, { noInk: true });
  }
  c.restore();
}
// A clay pot with a ribbed cactus; pup 0..1 grows the small one out of its side.
function cactus(c: C, x: number, yB: number, s: number, seed: number, pup = 0) {
  c.save(); c.translate(x, yB); c.scale(s, s); S.inkw = 5 / s;
  const body: P[] = [[-70, -150], [-78, -330], [-58, -440], [0, -478], [58, -440], [78, -330], [70, -150]];
  shape(c, body, '#5E7A4E', seed);
  for (const bx of [-38, 0, 38]) line(c, [[bx, -160], [bx * 1.1, -330], [bx * 0.7, -450]], seed + 1 + bx, 3 / s, '#3E5636');
  for (let k = 0; k < 12; k++) { const sx = -70 + (k % 4) * 46, sy = -200 - Math.floor(k / 4) * 90; line(c, [[sx, sy], [sx - 10, sy - 12]], seed + 10 + k, 2.5 / s); }
  if (pup > 0) {
    c.save(); c.translate(76, -260); c.scale(pup, pup);
    shape(c, ell(40, -40, 42, 56, 24), '#6E8A58', seed + 30);
    line(c, [[40, -10], [40, -86]], seed + 31, 3 / s, '#3E5636');
    c.restore();
  }
  shape(c, [[-110, -150], [110, -150], [86, 40], [-86, 40]], '#B25F3E', seed + 40);
  shape(c, [[-122, -176], [122, -176], [122, -140], [-122, -140]], '#A4542F', seed + 41);
  shape(c, ell(0, -150, 98, 12, 20), '#3A2A1E', seed + 42);
  c.restore();
}

// ---------------- sets ----------------
function bakeryBack(g: C, k = 1) {
  paintRect(g, 0, 0, W, H, WALL, { seed: 1, ang: Math.PI / 2, angVar: 0.1, len: 320 * k, bw: 64 * k, var: 0.08, grime: 0.45, light: 0.3 });
}
function loaf(g: C, x: number, y: number, s: number, seed: number) {
  const p = new Path2D(); p.ellipse(x, y, 90 * s, 46 * s, 0, 0, Math.PI * 2);
  paint(g, p, [x - 90 * s, y - 46 * s, 180 * s, 92 * s], '#B4743A', { seed, len: 60 * s, bw: 14 * s, grime: 0.4, light: 0.5 });
  for (let i = -1; i <= 1; i++) brushLine(g, x + i * 40 * s - 14 * s, y - 20 * s, x + i * 40 * s + 14 * s, y + 10 * s, 5 * s, '#E4C48A', seed + 2 + i, 0.8);
}
function shelves(g: C, y0: number, k: number, seed: number) {
  for (let r = 0; r < 2; r++) {
    const y = y0 + r * 260 * k;
    paintRect(g, 0, y, W, 34 * k, SHELF, { seed: seed + r, len: 260, bw: 20 });
    for (let i = 0; i < 4; i++) loaf(g, 140 + i * 250 + (r % 2) * 90, y - 44 * k, k, seed + 10 + r * 10 + i);
  }
}
function sign(g: C, x: number, y: number, w: number, h: number, text: string, seed: number) {
  paintRect(g, x, y, w, h, CREAM, { seed, len: 120, bw: 30, grime: 0.35 });
  g.save(); g.font = `${h * 0.6}px "Caveat Brush"`; g.fillStyle = '#7B3E2A'; g.textAlign = 'center'; g.fillText(text, x + w / 2, y + h * 0.7); g.restore();
}
function counterFront(g: C, x0: number, x1: number, top: number, bottom: number, seed: number) {
  S.inkw = 5;
  shape(g, [[x0, top], [x1, top], [x1, top + 50], [x0, top + 50]], TOP, seed);
  const f = shape(g, [[x0, top + 50], [x1, top + 50], [x1, bottom], [x0, bottom]], WOOD, seed + 1, { noInk: true });
  paint(g, f, [x0, top + 50, x1 - x0, bottom - top - 50], WOOD, { seed: seed + 2, ang: Math.PI / 2, len: 200, bw: 30, grime: 0.5 });
  for (let x = x0 + 60; x < x1; x += 90) brushLine(g, x, top + 60, x + 2, bottom, 6, '#4A3020', seed + 3 + x, 0.6);
  shape(g, [[x0, top + 50], [x1, top + 50], [x1, bottom], [x0, bottom]], null, seed + 1);
}
function otsBack(g: C) {
  bakeryBack(g, 1.3);
  shelves(g, 760, 1.1, 20);
  sign(g, 600, 470, 400, 140, 'CANDLES 40¢', 40);
  paintRect(g, 0, 1100, W, 60, TOP, { seed: 41, len: 260, bw: 24 });
}
function otsFront(g: C) { counterFront(g, -10, W + 10, 1360, H + 10, 53); }
function wide(g: C) {
  bakeryBack(g);
  shelves(g, 560, 0.8, 60);
  sign(g, 660, 420, 300, 110, 'CANDLES 40¢', 70);
  paintRect(g, 0, 1440, W, 480, '#A39C84', { seed: 71, ang: 0, len: 260, bw: 40, grime: 0.45 });
  for (let x = -400; x < W + 400; x += 140) brushLine(g, x, 1440, x + (x - 540) * 0.8, H, 5, '#857E66', 72 + x, 0.5);
  brushLine(g, 0, 1440, W, 1438, 14, '#3A2A1E', 73);
}
function counterTop(g: C) {
  paintRect(g, 0, 0, W, H, TOP, { seed: 81, ang: 0, len: 420, bw: 60, var: 0.12, grime: 0.55, light: 0.35 });
  for (let y = 140; y < H; y += 220) brushLine(g, 0, y, W, y + 6, 6, '#2E1E12', 82 + y, 0.6);
}
function tillSet(g: C) {
  bakeryBack(g, 1.6);
  paintRect(g, 0, 1500, W, 420, TOP, { seed: 91, ang: 0, len: 420, bw: 50, grime: 0.55, light: 0.35 });
  brushLine(g, 0, 1500, W, 1498, 16, '#2A1D14', 92);
}
function sill(g: C) {
  paintRect(g, 0, 0, W, H, HOME, { seed: 101, ang: Math.PI / 2, angVar: 0.1, len: 320, bw: 64, var: 0.08, grime: 0.45, light: 0.25 });
  // the window: evening sky, a frame and mullions
  paintRect(g, 150, 420, 780, 800, '#7F95AE', { seed: 102, ang: 0, len: 300, bw: 60, var: 0.1, light: 0.4 });
  paintRect(g, 150, 940, 780, 280, '#C99A6A', { seed: 103, ang: 0, len: 300, bw: 50, var: 0.1, light: 0.3 });
  for (const [x, y, w, h] of [[130, 400, 820, 34], [130, 400, 34, 840], [916, 400, 34, 840], [524, 400, 30, 840], [130, 800, 820, 26]]) paintRect(g, x, y, w, h, CREAM, { seed: 104 + x + y, len: 200, bw: 20, grime: 0.35 });
  paintRect(g, 60, 1230, 960, 70, CREAM, { seed: 110, len: 300, bw: 30, grime: 0.4 });
  paintRect(g, 0, 1300, W, 620, HOME, { seed: 111, ang: Math.PI / 2, len: 300, bw: 60, grime: 0.5 });
  brushLine(g, 60, 1300, 1020, 1298, 12, '#3A3A30', 112);
}
const wallClose = (g: C) => bakeryBack(g, 1.8);

// The till: a painted box with a little window that shows the price.
function till(c: C, t: number, price: string, press: number) {
  S.inkw = 6;
  shape(c, [[260, 860], [820, 860], [880, 1500], [200, 1500]], '#7C6E3E', 200);
  shape(c, [[360, 920], [720, 920], [720, 1080], [360, 1080]], '#1E1C1A', 201);
  c.save(); c.font = '130px "Patrick Hand"'; c.fillStyle = '#E8A63A'; c.textAlign = 'center'; c.fillText(price, 540, 1050); c.restore();
  for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) {
    const down = r === 1 && k === 2 ? press * 10 : 0;
    shape(c, [[300 + k * 130, 1160 + r * 100 + down], [400 + k * 130, 1160 + r * 100 + down], [400 + k * 130, 1230 + r * 100 + down], [300 + k * 130, 1230 + r * 100 + down]], CREAM, 210 + r * 4 + k);
  }
  // her finger comes in from the right on the key
  const hx = 650 + (1 - press) * 120, hy = 1250 + (1 - press) * -60;
  shape(c, limb([[1300, 900], [hx + 60, hy - 40]], 120, 96), SKIN, 230);
  shape(c, limb([[1500, 800], [1150, 960]], 150, 140), '#E2D6BC', 231);
  hand(c, hx, hy, 2.2, 2.5, SKIN, 232);
}

const SHOTS: Record<string, Shot> = {
  // HOOK: over Otto's shoulder, one candle held up big; the baker watching.
  s01(c, t, rt) {
    cam(c, t, rt, [{ kind: 'snap', at: 0, to: 1.1, dur: 0.3, focus: [600, 1000] }, { kind: 'push', to: 1.06, focus: [600, 1000] }], () => {
      c.drawImage(L('ots-back', otsBack), 0, 0);
      maeAt(c, 760, 660, 1.5, { gaze: [-0.7, 0.4], lid: 0.3, mouth: 'flat', legs: false });
      c.drawImage(L('ots-front', otsFront), 0, 0);
      ottoAt(c, 160, 1060 + 722 * 2.4, 2.4, { view: 'back', bag: false });
      candle(c, 520, 1330, 3.2, t, false, 300, -0.08);
      hand(c, 520, 1350, 2.6, -1.4, SKIN, 301);
    });
  },
  // Just one. Top-down, the candle on the empty counter.
  s02(c, t, rt) {
    const roll = outCubic(t, 0, 0.7);
    c.drawImage(L('counter-top', counterTop), 0, 0);
    shadowBlob(c, 540, 1010, 260, 26, 310, '#2A1C12');
    candle(c, 260 + 220 * roll, 1000, 3.6, t, false, 311, Math.PI / 2 - 0.1);
    S.inkw = 5; shape(c, ell(800, 1300, 60, 60, 24), '#C9A44A', 312); shape(c, ell(800, 1300, 44, 44, 24), null, 313);
  },
  // The baker has never asked who it's for.
  s03(c, t, rt) {
    const look = wordT(rt, 'asked', 0.5);
    cam(c, t, rt, [{ kind: 'push', to: 1.08, focus: [540, 900] }], () => {
      c.drawImage(L('wall-close', wallClose), 0, 0);
      maeAt(c, 540, 700, 2.2, { gaze: t < look ? [0, 0.9] : [-0.9, 0.2], lid: 0.35, mouth: 'flat', legs: false });
      c.drawImage(L('counter-close', g => counterFront(g, -10, W + 10, 1500, H + 10, 320)), 0, 0);
    });
  },
  // She just rings it up. Forty cents.
  s04(c, t, rt) {
    const ft = wordT(rt, 'forty', 1.4), press = ramp(t, 0.2, 0.45) * (1 - ramp(t, 0.7, 0.9));
    cam(c, t, rt, [{ kind: 'punch', at: ft, to: 1.25, focus: [540, 1000] }], () => {
      c.drawImage(L('till', tillSet), 0, 0);
      till(c, t, t < ft ? '0.00' : '0.40', press);
    });
  },
  // Today, Otto asks for two. Wide; a second candle lands on the counter.
  s05(c, t, rt) {
    const tw = wordT(rt, 'two', 1.2);
    cam(c, t, rt, [{ kind: 'punch', at: tw, to: 1.3, focus: [560, 1180] }], () => {
      c.drawImage(L('wide', wide), 0, 0);
      maeAt(c, 330, 860, 1.05, { gaze: [0.8, 0.3], lid: 0.2, legs: false });
      shadowBlob(c, 760, 1650, 110, 16, 330, '#7E7864');
      ottoAt(c, 760, 1646, 0.98, { view: 'three', pose: 'point', gaze: [-0.6, 0.2] }, true);
      c.drawImage(L('counter-wide', g => counterFront(g, -10, 640, 1180, 1560, 331)), 0, 0);
      candle(c, 470, 1185, 0.75, t, false, 332);
      const land = outBack(t, tw, tw + 0.3);
      if (t > tw) candle(c, 530, 1185 - (1 - land) * 60, 0.75, t, false, 333);
    });
  },
  // "Whose birthday?" Her only line, as a handwritten caption.
  s06(c, t, rt) {
    cam(c, t, rt, [{ kind: 'push', to: 1.05, focus: [540, 900] }], () => {
      c.drawImage(L('wall-close', wallClose), 0, 0);
      maeAt(c, 540, 760, 2.3, { gaze: [-0.4, 0.1], lid: Math.max(0.45, blinkAt(t, 1.2)), mouth: t < 0.8 ? 'o' : 'flat', legs: false });
      c.drawImage(L('counter-close', g => counterFront(g, -10, W + 10, 1500, H + 10, 320)), 0, 0);
    });
    caption(c, 'Whose birthday?', 80, 300, 104);
    rt.text.push({ text: 'Whose birthday?', x0: 80, y0: 220, x1: 760, y1: 320, size: 104 });
  },
  // Otto doesn't explain. He never does.
  s07(c, t, rt) {
    cam(c, t, rt, [{ kind: 'push', to: 1.06, focus: [540, 900] }], () => {
      c.drawImage(L('ots-back-plain', g => bakeryBack(g, 1.8)), 0, 0);
      ottoHeadAt(c, 540, 860, 2.6, { view: 'front', gaze: [0, 0], lid: Math.max(0.3, blinkAt(t, 1.4, 1.6)), mouth: 'none', bag: false });
    });
  },
  // At home, his cactus gets one candle every Saturday.
  s08(c, t, rt) {
    cam(c, t, rt, [{ kind: 'push', to: 1.07, focus: [540, 1000] }], () => {
      c.drawImage(L('sill', sill), 0, 0);
      shadowBlob(c, 540, 1250, 170, 20, 340, '#9A8E70');
      cactus(c, 540, 1230, 1.3, 341, 0);
      candle(c, 470, 1230 - 152 * 1.3, 0.9, t, true, 342, -0.1);
    });
  },
  // This week, a small cactus grew out of the side.
  s09(c, t, rt) {
    const sm = wordT(rt, 'small', 0.9);
    cam(c, t, rt, [{ kind: 'punch', at: sm, to: 1.6, focus: [700, 900] }], () => {
      c.drawImage(L('sill', sill), 0, 0);
      shadowBlob(c, 540, 1250, 170, 20, 340, '#9A8E70');
      cactus(c, 540, 1230, 1.3, 341, 1);
      candle(c, 470, 1230 - 152 * 1.3, 0.9, t, true, 342, -0.1);
    });
  },
  // So it gets one too. Otto rises into frame to watch.
  s10(c, t, rt) {
    const one = wordT(rt, 'one', 0.6), up = outCubic(t, 0.05, 0.6);
    c.drawImage(L('sill', sill), 0, 0);
    shadowBlob(c, 540, 1250, 170, 20, 340, '#9A8E70');
    cactus(c, 540, 1230, 1.3, 341, 1);
    candle(c, 470, 1230 - 152 * 1.3, 0.9, t, true, 342, -0.1);
    const pupY = 1230 + (-260 - 40 - 56) * 1.3 + 30;
    candle(c, 540 + (76 + 40) * 1.3, pupY + (t < one ? -40 : 0), 0.55, t, t >= one, 343, 0.12);
    ottoHeadAt(c, 830, 2050 - 330 * up, 1.9, { view: 'three', gaze: [-0.8, -0.3], lid: 0.3, bag: false }, true);
  },
  // Button: both flames, Otto deadpan, a slow blink.
  s11(c, t, rt) {
    c.drawImage(L('sill', sill), 0, 0);
    shadowBlob(c, 540, 1250, 170, 20, 340, '#9A8E70');
    cactus(c, 540, 1230, 1.3, 341, 1);
    candle(c, 470, 1230 - 152 * 1.3, 0.9, t, true, 342, -0.1);
    candle(c, 540 + (76 + 40) * 1.3, 1230 + (-260 - 40 - 56) * 1.3 + 30, 0.55, t, true, 343, 0.12);
    ottoHeadAt(c, 830, 1720, 1.9, { view: 'three', gaze: [-0.8, -0.3], lid: Math.max(0.3, blinkAt(t, 0.9)), bag: false }, true);
  },
};

export default paintedEpisode(SHOTS);
