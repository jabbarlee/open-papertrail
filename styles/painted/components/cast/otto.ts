// OTTO, the series lead. 28, lanky, deadpan, always a little tired. Silhouette at thumbnail size:
// a too-tall teal beanie flopping to one side + an oversized mustard sweater whose sleeves swallow his hands.
// Origin = between his feet on the ground; he's ~980 units tall to the beanie tip at scale 1.
// Set S.inkw = 5 / scale before drawing him scaled.
import { type C, type P } from '../noise.ts';
import { INK, S, SKIN, ell, eyes, limb, line, scribbleHair, shape, type Gaze } from '../ink.ts';

export const OTTO = {
  beanie: '#2F4E4A', sweater: '#C4943A', cuffHole: '#2A2118', collar: '#E6E0CC',
  trousers: '#4A3F38', shoe: '#E9E5DA', sole: '#3A332E', bag: '#D8CFB4', bagPrint: '#B4553A', phone: '#2B2A30', screen: '#A9BCCB',
};

export type View = 'front' | 'three' | 'side' | 'back';
export type Pose = 'stand' | 'phone' | 'shrug' | 'point' | 'hold';
export type Mouth = 'none' | 'flat' | 'o' | 'smile' | 'frown';
export interface OttoOpts { view?: View; pose?: Pose; gaze?: Gaze; lid?: number; mouth?: Mouth; bag?: boolean; seed?: number; noBeanie?: boolean; tufts?: boolean; step?: number }

export function otto(c: C, o: OttoOpts = {}) {
  const view = o.view ?? 'front', pose = o.pose ?? 'stand', sd = (o.seed ?? 0) * 1000;
  const k = { front: 1, three: 0.86, side: 0.62, back: 1 }[view];
  const fo = { front: 0, three: 16, side: 30, back: 0 }[view];
  const X = (pts: P[]): P[] => pts.map(([x, y]) => [x * k, y]);
  const lift = pose === 'shrug' ? -16 : 0;
  const w = S.inkw;

  // tote bag behind him in side view
  if (o.bag !== false && view === 'side') toteBag(c, -64, -282, sd);

  // legs (corduroy) + shoes
  const st = (o.step ?? 0) * 34;
  for (const [li, leg0] of ([[[-58, -330], [-6, -330], [-10, -26], [-54, -26]], [[6, -330], [58, -330], [54, -26], [10, -26]]] as P[][]).entries()) {
    const off = (li ? -st : st) / k;
    const leg = leg0.map(([x, y], j) => [j > 1 ? x + off : x, y] as P);
    const p = shape(c, X(leg), OTTO.trousers, sd + 1 + leg[0][0]);
    c.save(); c.clip(p); c.strokeStyle = 'rgba(20,14,10,0.28)'; c.lineWidth = 2;
    for (let x = leg[0][0] * k; x < leg[1][0] * k; x += 9) { c.beginPath(); c.moveTo(x, -330); c.lineTo(x - 2, -26); c.stroke(); }
    c.restore();
  }
  if (view === 'side') {
    for (const [li, dx0] of [-10, 12].entries()) { const dx = dx0 + (li ? -st : st) * 0.62; shape(c, [[-34 + dx, 0], [-32 + dx, -30], [26 + dx, -30], [50 + dx, -12], [48 + dx, 0]], OTTO.shoe, sd + 5 + dx0); }
  } else {
    shape(c, X([[-74, 0], [-70, -32], [-8, -32], [-6, 0]]), OTTO.shoe, sd + 5);
    shape(c, X([[6, 0], [8, -32], [70, -32], [74, 0]]), OTTO.shoe, sd + 6);
  }
  c.fillStyle = OTTO.sole; c.fillRect(-76 * k, -7, 152 * k, 7);

  // neck, sweater, collar
  shape(c, [[-17 + fo * 0.4, -652], [17 + fo * 0.4, -652], [16 + fo * 0.4, -576], [-16 + fo * 0.4, -576]], SKIN, sd + 8);
  const sw = shape(c, X([[-62, -582 + lift], [62, -582 + lift], [100, -560 + lift], [112, -440], [106, -300], [-106, -300], [-112, -440], [-100, -560 + lift]]), OTTO.sweater, sd + 9, { amp: 1.4 });
  c.save(); c.clip(sw);
  line(c, X([[-110, -328], [0, -324], [110, -328]]), sd + 10, w * 0.8);
  for (let x = -104; x <= 104; x += 14) line(c, X([[x, -326], [x, -304]]), sd + 11 + x, w * 0.45);
  c.restore();
  if (view !== 'back' && view !== 'side') {
    shape(c, [[-34 + fo * 0.5, -590 + lift], [-2 + fo * 0.5, -560 + lift], [-6 + fo * 0.5, -598 + lift]], OTTO.collar, sd + 12, { w: w * 0.8 });
    shape(c, [[34 + fo * 0.5, -590 + lift], [2 + fo * 0.5, -560 + lift], [6 + fo * 0.5, -598 + lift]], OTTO.collar, sd + 13, { w: w * 0.8 });
  }

  // bag strap + bag (front / 3/4 on his left = screen right; back view = screen left)
  if (o.bag !== false && view !== 'side' && pose !== 'shrug') {
    const m = view === 'back' ? -1 : 1;
    line(c, X([[m * 76, -574], [m * 112, -480], [m * 142, -406]]), sd + 14, w * 1.6, '#8F8569');
    toteBag(c, m * 150 * k, -282, sd, view === 'back');
  }

  // arms: sleeves too long, hands swallowed
  const arms = ARMS[pose];
  for (const [i, a] of arms.entries()) {
    const pts = X(a.map(([x, y]) => [x, y + (y < -540 ? lift : 0)] as P));
    shape(c, limb(pts, 44, 52), OTTO.sweater, sd + 20 + i, { amp: 1.2 });
    const [ex, ey] = pts[pts.length - 1], [px, py] = pts[pts.length - 2];
    const ang = Math.atan2(ey - py, ex - px);
    shape(c, ell(ex, ey, 12, 23, 16, 0, Math.PI * 2, ang), OTTO.cuffHole, sd + 24 + i, { w: w * 0.8 });
    if (pose === 'shrug' || (pose === 'point' && i === 1)) {
      // fingertips poke out of the cuff
      const n = pose === 'point' ? 1 : 3;
      for (let f = 0; f < n; f++) {
        const off = (f - (n - 1) / 2) * 12;
        const fx = ex + Math.cos(ang) * 22 - Math.sin(ang) * off, fy = ey + Math.sin(ang) * 22 + Math.cos(ang) * off;
        shape(c, ell(fx, fy, pose === 'point' ? 22 : 9, 7, 12, 0, Math.PI * 2, ang), SKIN, sd + 26 + f + i, { w: w * 0.7 });
      }
    }
  }
  if (pose === 'phone') {
    const px = fo * 0.3;
    shape(c, [[-30 + px, -548], [30 + px, -548], [30 + px, -452], [-30 + px, -452]], OTTO.phone, sd + 30, { w: w * 0.9 });
    c.fillStyle = OTTO.screen; c.fillRect(-23 + px, -541, 46, 80);
    for (const s of [-1, 1]) for (const fy of [-520, -496]) shape(c, ell(px + s * 32, fy, 8, 7, 10), SKIN, sd + 31 + fy + s, { w: w * 0.6 });
  }

  ottoHead(c, { ...o, view }, fo, sd);
}

const ARMS: Record<Pose, P[][]> = {
  stand: [[[-94, -556], [-116, -430], [-122, -282]], [[94, -556], [116, -430], [122, -282]]],
  phone: [[[-94, -556], [-112, -430], [-40, -470]], [[94, -556], [112, -430], [40, -470]]],
  hold: [[[-94, -556], [-112, -430], [-40, -470]], [[94, -556], [112, -430], [40, -470]]],
  shrug: [[[-94, -562], [-170, -470], [-212, -548]], [[94, -562], [170, -470], [212, -548]]],
  point: [[[-94, -556], [-116, -430], [-122, -282]], [[94, -556], [180, -560], [250, -616]]],
};

function toteBag(c: C, x: number, y: number, sd: number, plain = false) {
  shape(c, [[x - 42, y - 130], [x + 40, y - 130], [x + 48, y], [x - 48, y]], OTTO.bag, sd + 40);
  if (plain) return;
  // the print on his bag: a small crescent moon, his only "logo"
  c.save(); c.fillStyle = OTTO.bagPrint; c.beginPath(); c.arc(x, y - 66, 20, 0, 7); c.fill();
  c.fillStyle = OTTO.bag; c.beginPath(); c.arc(x + 9, y - 72, 17, 0, 7); c.fill(); c.restore();
}

export function ottoHead(c: C, o: OttoOpts & { view: View }, fo: number, sd: number) {
  const view = o.view, w = S.inkw, hx = fo, hy = -722;
  const flop = view === 'back' || view === 'side' ? -1 : 1;
  // ears
  if (view === 'front' || view === 'back') { shape(c, ell(-70, -712, 13, 20, 16), SKIN, sd + 50); shape(c, ell(70, -712, 13, 20, 16), SKIN, sd + 51); }
  if (view === 'three') shape(c, ell(hx - 64, -712, 12, 20, 16), SKIN, sd + 50);
  // head
  const rx = view === 'side' ? 62 : 70;
  const head = ell(hx, hy, rx, 80, 40).map(([x, y]) => [hx + (x - hx) * (y > hy ? 1 - 0.14 * ((y - hy) / 80) : 1), y] as P);
  shape(c, head, SKIN, sd + 52);
    // hair: tufts under the beanie (a full mass at the nape from behind)
  if (view === 'back') scribbleHair(c, [[-72, -752], [72, -752], [68, -706], [56, -680], [30, -664], [8, -672], [-14, -660], [-40, -670], [-58, -684], [-68, -708]], sd + 53, -1.2, true);
  else {
    if (o.tufts !== false) scribbleHair(c, [[hx - rx - 8, -770], [hx - rx - 14, -726], [hx - rx + 4, -738], [hx - rx + 12, -762]], sd + 54, -1.0);
    if (view === 'side') scribbleHair(c, [[hx - rx - 4, -760], [hx - rx - 2, -700], [hx - rx + 18, -712], [hx - rx + 20, -756]], sd + 57, -1.0);
    if (view === 'front' && o.tufts !== false) scribbleHair(c, [[hx + rx + 8, -770], [hx + rx + 14, -730], [hx + rx - 4, -742], [hx + rx - 12, -764]], sd + 55, -1.0);
    scribbleHair(c, [[hx - 40, -766], [hx - 20, -742], [hx - 4, -760], [hx + 14, -740], [hx + 28, -764]], sd + 56, -1.0, false);
  }
  // face
  if (view !== 'back') {
    const g = o.gaze ?? [0, 0];
    if (view === 'front') eyes(c, [hx - 27, -722], [hx + 27, -724], 24, 15, g, sd + 60, o.lid ?? 0);
    if (view === 'three') eyes(c, [hx - 18, -722], [hx + 32, -724], 23, 15, g, sd + 60, o.lid ?? 0);
    if (view === 'side') {
      eyes(c, [hx + 36, -722], [hx + 36, -722], 13, 15, [0.6, g[1]], sd + 60, o.lid ?? 0);
    }
    // the tired lines under his eyes: his permanent look
    const ex = view === 'side' ? [hx + 36] : view === 'three' ? [hx - 18, hx + 32] : [hx - 27, hx + 27];
    for (const [i, x] of ex.entries()) line(c, [[x - 12, -700], [x, -697], [x + 12, -700]], sd + 62 + i, w * 0.55);
    const mx = view === 'side' ? hx + 40 : view === 'three' ? hx + 8 : hx;
    const m = o.mouth ?? 'none';
    if (m === 'flat') line(c, [[mx - 10, -668], [mx + 10, -669]], sd + 64, w * 0.75);
    if (m === 'o') shape(c, ell(mx, -666, 7, 9, 14), INK, sd + 65, { w: 2 });
    if (m === 'smile') line(c, [[mx - 12, -670], [mx, -664], [mx + 12, -671]], sd + 66, w * 0.75);
    if (m === 'frown') line(c, [[mx - 12, -664], [mx, -670], [mx + 12, -663]], sd + 67, w * 0.75);
  }
  // beanie: rolled cuff + a tall body that flops over
  if (!o.noBeanie) beanie(c, view === 'side' ? hx - 6 : hx * 0.3, flop, sd);
}

// The beanie on its own (so it can come off). bx = centre x, dy lifts it, flop = 1 flops screen-right.
export function beanie(c: C, bx: number, flop: number, sd: number, dy = 0, tilt = 0) {
  const w = S.inkw;
  c.save(); c.translate(bx, -768 + dy); c.rotate(tilt); c.translate(-bx, 768);
  const F = (pts: P[]): P[] => pts.map(([x, y]) => [bx + x * flop, y]);
  shape(c, F([[-72, -786], [-58, -862], [-24, -922], [20, -954], [70, -962], [114, -942], [126, -904], [104, -888], [76, -900], [58, -858], [70, -786]]), OTTO.beanie, sd + 70, { amp: 1.3 });
  const cuff = shape(c, F([[-80, -748], [0, -744], [80, -748], [78, -790], [0, -796], [-78, -790]]), shadeBeanie(), sd + 71, { amp: 1.2 });
  c.save(); c.clip(cuff);
  for (let x = -76; x <= 76; x += 13) line(c, F([[x, -790], [x, -748]]), sd + 72 + x, w * 0.45);
  c.restore();
  c.restore();
}
const shadeBeanie = () => '#35574F';
