// Episode: Blend. Two old roommates who stopped speaking still share a playlist that mixes their songs every
// morning. Ink line: no characters, only the objects. Cobalt = the narrator's own songs and acts; hers are ink.
import type { Runtime } from '../../../../core/scene.ts';
import { ease, inv, lerp } from '../../../../core/canvas/kit.ts';
import { P } from '../../components/palette.ts';
import { ink, inkBox, inkCircle, wash } from '../../components/ink.ts';
import { hand, serif, writeOn } from '../../components/type.ts';
import { inkEpisode, spoken, wordT } from '../../components/episode.ts';
import { phone, rule } from '../../components/screen.ts';

type C = CanvasRenderingContext2D;

// The Blend badge: two circles, hers (ink, left) and mine (cobalt, right). overlap 0 = apart, 1 = one circle.
function badge(c: C, f: number, x: number, y: number, r: number, overlap: number, p = 1, seed = 10): void {
  const d = lerp(r * 1.25, r * 0.08, overlap);
  inkCircle(c, f, x - d / 2, y, r, { width: Math.max(7, r * 0.1), seed, progress: p });
  inkCircle(c, f, x + d / 2, y, r, { width: Math.max(7, r * 0.1), seed: seed + 1, progress: inv(0.2, 1, p), color: P.cobalt });
  const lens = new Path2D();
  lens.arc(x - d / 2, y, r, 0, Math.PI * 2);
  c.save(); c.clip(lens);
  wash(c, new Path2D(`M${x + d / 2 - r} ${y - r} h${2 * r} v${2 * r} h${-2 * r} Z`), inv(0.5, 1, p) * 0.9);
  c.restore();
}

// A song row: a play triangle, two strokes for the title, an optional label on the right.
function row(c: C, rt: Runtime, x: number, y: number, w: number, color: string, p: number, seed: number, label = ''): void {
  if (p <= 0) return;
  const f = rt.f;
  ink(c, f, [[x, y - 26], [x + 34, y], [x, y + 26], [x, y - 26]], { width: 7, seed, progress: inv(0, 0.4, p), per: 5, color });
  ink(c, f, [[x + 70, y - 8], [x + 70 + w * 0.48, y - 10]], { width: 9, seed: seed + 1, progress: inv(0.2, 0.7, p), color });
  ink(c, f, [[x + 70, y + 22], [x + 70 + w * 0.3, y + 21]], { width: 5, seed: seed + 2, progress: inv(0.4, 0.9, p), color: P.soft });
  if (label) writeOn(c, rt, label, x + w, y + 14, { ...hand(46, color === P.cobalt ? P.cobalt : P.soft), align: 'right' }, inv(0.5, 1, p));
}

function title(c: C, rt: Runtime): void {
  writeOn(c, rt, 'two years,', 540, 300, { ...serif(118), align: 'center' }, 1);
  writeOn(c, rt, 'one playlist', 540, 420, { ...serif(118, P.cobalt), align: 'center' }, 1);
}

// The opening (and the loop's landing): a phone with the playlist header and rows writing on.
function playlist(c: C, rt: Runtime, overlap: number, draw: number): void {
  const f = rt.f;
  phone(c, f, 250, 500, 580, 720, lerp(0.55, 1, draw), 20);
  badge(c, f, 540, 650, 80, overlap, ease.out(inv(0.1, 0.6, draw)), 30);
  for (let i = 0; i < 4; i++) row(c, rt, 310, 820 + i * 95, 440, i % 2 ? P.cobalt : P.ink, inv(0.3 + i * 0.12, 0.6 + i * 0.12, draw + rt.local * 0.25), 40 + i * 3);
}

const shots: Record<string, (c: C, rt: Runtime) => void> = {
  s01(c, rt) {
    title(c, rt);
    // Frame 0: the phone half drawn, still drawing; the circles slide into overlap.
    playlist(c, rt, ease.inOut(inv(0.2, 2.2, rt.local)) * 0.55, lerp(0.45, 1, ease.out(inv(0, 0.8, rt.local))));
  },
  s02(c, rt) {
    const sp = spoken(rt), f = rt.f;
    const mixAt = wordT(rt, 'mixes', 0.6) / (rt.shot.end - rt.shot.start);
    const mix = ease.inOut(inv(mixAt - 0.05, mixAt + 0.3, rt.p));
    // A small sun: every morning.
    inkCircle(c, f, 540, 300, 46, { width: 9, seed: 60, progress: ease.out(inv(0, 0.25, sp)) });
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      ink(c, f, [[540 + Math.cos(a) * 66, 300 + Math.sin(a) * 66], [540 + Math.cos(a) * 92, 300 + Math.sin(a) * 92]], { width: 6, seed: 61 + i, progress: inv(0.1, 0.3, sp) });
    }
    for (let i = 0; i < 6; i++) {
      const hers = i % 2 === 0, k = i >> 1;
      const enter = ease.out(inv(0.05 + k * 0.08, 0.25 + k * 0.08, sp));
      const fromX = hers ? lerp(-500, 80, enter) : lerp(1100, 560, enter);
      const x = lerp(fromX, 200, mix), y = lerp(520 + k * 150, 470 + i * 112, mix);
      row(c, rt, x, y, hers ? 380 : 380, hers ? P.ink : P.cobalt, enter, 70 + i * 3);
    }
  },
  s03(c, rt) {
    const sp = spoken(rt), f = rt.f;
    // A thin moon.
    ink(c, f, [[600, 220], [520, 300], [600, 380], [560, 300], [600, 220]], { width: 9, seed: 90, progress: ease.out(inv(0, 0.3, sp)), per: 8 });
    const times = ['3:04 am', '3:11 am', '3:26 am', '3:40 am', '3:52 am'];
    times.forEach((t, i) => {
      const k = inv(0.08 + i * 0.12, 0.3 + i * 0.12, sp);
      const fade = i < 2 ? P.ink : P.soft;
      row(c, rt, 140, 450 + i * 110, 740, fade, k, 100 + i * 3, t);
    });
  },
  s04(c, rt) {
    const f = rt.f, L = rt.local;
    const playAt = wordT(rt, 'played', 0.5);
    // The message field: empty, cursor blinking, nothing sent.
    inkBox(c, f, 110, 300, 860, 150, { width: 10, seed: 120, progress: ease.out(inv(0, 0.3, L)) });
    writeOn(c, rt, 'to: her', 140, 260, hand(50, P.soft), inv(0.1, 0.4, L));
    if (Math.floor(L * 2.2) % 2 === 0) ink(c, f, [[160, 335], [160, 415]], { width: 8, seed: 121, color: P.cobalt });
    // The road: one cobalt line running off across the frame.
    const run = ease.out(inv(playAt - 0.2, playAt + 1.6, L));
    ink(c, f, [[60, 1150], [300, 1090], [560, 1130], [820, 1040], [1100, 1000]], { width: 12, seed: 130, progress: run, color: P.cobalt, per: 10 });
    ink(c, f, [[60, 1215], [300, 1160], [560, 1200], [820, 1110], [1100, 1070]], { width: 7, seed: 131, progress: run * 0.95, color: P.soft, per: 10 });
    // The play counter ticking to 40.
    const n = Math.min(40, Math.round(ease.out(inv(playAt, playAt + 1.6, L)) * 40));
    if (L > playAt - 0.1) {
      ink(c, f, [[380, 620], [470, 680], [380, 740], [380, 620]], { width: 11, seed: 140, color: P.cobalt, per: 5 });
      writeOn(c, rt, `× ${n}`, 520, 735, { ...serif(150, P.cobalt) }, 1);
    }
  },
  s05(c, rt) {
    const sp = spoken(rt), f = rt.f;
    badge(c, f, 540, 300, 70, 0.55, 1, 150);
    const land = ease.back(inv(0.05, 0.35, sp));
    const y0 = lerp(380, 520, Math.min(1, land));
    wash(c, new Path2D(`M120 ${y0 - 70} L960 ${y0 - 70} L960 ${y0 + 70} L120 ${y0 + 70} Z`), ease.out(inv(0.3, 0.7, sp)));
    row(c, rt, 160, y0, 760, P.cobalt, Math.min(1, land * 1.4), 160, 'our song');
    for (let i = 1; i < 5; i++) row(c, rt, 160, 520 + i * 130, 760, i % 2 ? P.ink : P.cobalt, inv(0.2 + i * 0.08, 0.5 + i * 0.08, sp), 170 + i * 3);
    rule(c, f, 120, 960, 600, inv(0.3, 0.6, sp), 180);
  },
  s06(c, rt) {
    const L = rt.local, f = rt.f;
    const herAt = wordT(rt, 'forty-one', 0.45);
    writeOn(c, rt, 'me', 270, 470, { ...hand(64, P.cobalt), align: 'center' }, 1);
    writeOn(c, rt, '40', 270, 720, { ...serif(200, P.cobalt), align: 'center' }, 1);
    const k = ease.out(inv(herAt - 0.4, herAt + 0.2, L));
    writeOn(c, rt, 'her', 770, 470, { ...hand(64), align: 'center' }, k);
    const n = Math.round(lerp(1, 41, ease.out(inv(herAt - 0.4, herAt + 0.4, L))));
    if (k > 0.6) writeOn(c, rt, String(n), 770, 760, { ...serif(260), align: 'center' }, 1);
    rule(c, f, 120, 960, 860, inv(0, 0.4, L), 190, P.soft);
  },
  s07(c, rt) {
    const f = rt.f, L = rt.local;
    const matchAt = wordT(rt, 'match', 0.6);
    // The empty chat.
    inkBox(c, f, 150, 200, 780, 420, { width: 10, seed: 200, progress: ease.out(inv(0, 0.3, L)) });
    writeOn(c, rt, 'no messages', 540, 440, { ...hand(64, P.soft), align: 'center' }, inv(0.1, 0.6, L));
    // The two circles slide almost into one, and the number writes on.
    const o = ease.inOut(inv(matchAt - 0.6, matchAt + 0.6, L));
    badge(c, f, 540, 880, 150, lerp(0.55, 0.96, o), ease.out(inv(0, 0.4, L)), 210);
    writeOn(c, rt, '98% match', 540, 1170, { ...serif(110), align: 'center' }, inv(matchAt, matchAt + 0.5, L));
  },
  s08(c, rt) {
    title(c, rt);
    playlist(c, rt, 0.96, 1);
  },
};

export default inkEpisode(shots);
