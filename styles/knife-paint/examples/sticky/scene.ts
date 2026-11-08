// The Weak Glue: a 3M chemist tries to make a super-strong glue in 1968 and makes the weakest one; a colleague's hymn
// book bookmarks give it a use; it flops as Press 'n Peel, comes back as Post-it Notes, and ends up on your fridge.
// Every beat is timed from the narrator's words; figures are body + head + arm sprites, so they walk, gesture and look.
import { knifeEpisode, camera, sprite, outCubic, inOut, ease, W, type Frame } from '../../components/studio.ts';
import { backdrop, shadow } from '../../components/sets.ts';
import { man, lady, drawFig, handAt, walk, idle, CLOTH, SKINS, HAIRS, type FigPose } from '../../components/cast.ts';
import { bottle, bench, counter } from '../../components/props.ts';
import { rng, line, fillPoly, ribbon, knife, pick, type C, type P } from '../../components/paint.ts';

const push = (f: Frame, from: number, to: number, fx: number, fy: number) => camera(f.c, from + (to - from) * ease(f.t / f.dur), fx, fy);
const add = (a: FigPose, b: FigPose): FigPose => ({ dx: (a.dx ?? 0) + (b.dx ?? 0), dy: (a.dy ?? 0) + (b.dy ?? 0), lean: (a.lean ?? 0) + (b.lean ?? 0), head: (a.head ?? 0) + (b.head ?? 0), arm: (a.arm ?? 0) + (b.arm ?? 0), alpha: b.alpha ?? a.alpha });
const YELLOW = ['#E9C640', '#EDCC4C', '#E3BE38', '#F0D35A'];

// ---------- props ----------
/** A square sticky note, painted with the knife; (x, y) is its centre. */
function note(key: string, x: number, y: number, w: number, cols = YELLOW) {
  return sprite(`note:${key}`, [x - w / 2 - 14, y - w / 2 - 14, x + w / 2 + 14, y + w / 2 + 14], sp => {
    const r = rng(x * 3 + y + w);
    sp.pass({ dry: 0.3, relief: 0.5, soften: 1 }, g => {
      fillPoly(g, [[x - w / 2, y - w / 2], [x + w / 2, y - w / 2 + 2], [x + w / 2 - 2, y + w / 2], [x - w / 2 + 2, y + w / 2 - 2]], cols[0]);
      for (let i = 0; i < 9; i++) knife(g, r, x + (r() - 0.5) * w * 0.7, y - w / 2 + (i + 0.5) * w / 9, (r() - 0.5) * 0.08, w * 0.8, w * 0.14, pick(r, cols), { load: 0.8 });
      line(g, [[x - w / 2 + 4, y + w / 2 - 2], [x + w / 2 - 4, y + w / 2]], 4, 2, '#A88A2A', 0.6);
    });
  });
}
/** A paper slip (a bookmark): long and narrow, cream or yellow. */
function slip(key: string, x: number, y: number, w: number, h: number, col = '#EDE5D2') {
  return sprite(`slip:${key}`, [x - w / 2 - 10, y - h / 2 - 10, x + w / 2 + 10, y + h / 2 + 10], sp => {
    const r = rng(w + h + x);
    sp.pass({ dry: 0.3, relief: 0.4, soften: 1 }, g => {
      fillPoly(g, [[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]], col);
      for (let i = 0; i < 5; i++) knife(g, r, x, y - h / 2 + (i + 0.5) * h / 5, Math.PI / 2 + (r() - 0.5) * 0.1, h * 0.25, w * 0.8, col, { load: 0.6 });
    });
  });
}
/** A wooden block; (x, y) is the centre of its base. */
function block(key: string, x: number, y: number, w: number, h: number) {
  return sprite(`block:${key}`, [x - w / 2 - 12, y - h - 12, x + w / 2 + 12, y + 12], sp => {
    const r = rng(x + y);
    sp.pass({ dry: 0.3, relief: 0.6, soften: 1 }, g => {
      fillPoly(g, [[x - w / 2, y], [x + w / 2, y], [x + w / 2, y - h], [x - w / 2, y - h]], '#B07A48');
      for (let i = 0; i < 10; i++) ribbon(g, r, [[x - w / 2, y - h + (i + 0.5) * h / 10], [x + w / 2, y - h + (i + 0.5) * h / 10 + (r() - 0.5) * 6]], h / 12, pick(r, ['#A4703F', '#BC8752', '#986636']), { load: 0.7, fade: 0.3 });
      fillPoly(g, [[x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2 - 6, y - h - 10], [x - w / 2 + 6, y - h - 10]], '#C9935E');
    });
  });
}
/** The hymn book, open; (x, y) is the spine's foot. */
function hymnBook(x: number, y: number, w: number) {
  return sprite(`hymn:${x}`, [x - w - 30, y - w * 1.35 - 30, x + w + 30, y + 40], sp => {
    const r = rng(x + 7);
    sp.pass({ dry: 0.3, relief: 0.6, soften: 1 }, g => {
      fillPoly(g, [[x - w - 18, y + 20], [x + w + 18, y + 20], [x + w + 18, y - w * 1.32], [x - w - 18, y - w * 1.32]], '#6E2026');
      for (const side of [-1, 1]) {
        const x0 = side < 0 ? x - w : x, x1 = side < 0 ? x : x + w;
        fillPoly(g, [[x0, y], [x1, y], [x1, y - w * 1.28], [x0, y - w * 1.28]], '#EAE0C8');
        for (let i = 0; i < 12; i++) ribbon(g, r, [[x0 + 30, y - w * 1.15 + i * w * 0.09], [x1 - 30, y - w * 1.15 + i * w * 0.09 + (r() - 0.5) * 4]], 6, '#6E655A', { load: 0.5, fade: 0.5 });
      }
      line(g, [[x, y], [x, y - w * 1.28]], 6, 4, '#4A3A2E', 0.8);
    });
  });
}
/** A box of notes for the shop; label printed on the front. */
function packBox(key: string, x: number, y: number, w: number, label: boolean) {
  const h = w * 0.62;
  return sprite(`pack:${key}`, [x - w / 2 - 14, y - h - 24, x + w / 2 + 14, y + 12], sp => {
    const r = rng(x + y + w);
    sp.pass({ dry: 0.3, relief: 0.6, soften: 1 }, g => {
      fillPoly(g, [[x - w / 2, y], [x + w / 2, y], [x + w / 2, y - h], [x - w / 2, y - h]], '#E3C24A');
      fillPoly(g, [[x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2 - 14, y - h - 16], [x - w / 2 + 14, y - h - 16]], '#F1D766');
      for (let i = 0; i < 6; i++) knife(g, r, x + (r() - 0.5) * w * 0.6, y - h * (0.15 + i * 0.14), 0, w * 0.6, h * 0.12, pick(r, YELLOW), { load: 0.6 });
      fillPoly(g, [[x - w * 0.42, y - h * 0.72], [x + w * 0.42, y - h * 0.72], [x + w * 0.42, y - h * 0.28], [x - w * 0.42, y - h * 0.28]], '#F4EEDD');
    });
    if (label) sp.raw(g => {
      g.fillStyle = '#7B2E22'; g.textAlign = 'center';
      g.font = `italic ${Math.round(h * 0.26)}px "Instrument Serif"`; g.fillText("Press 'n Peel", x, y - h * 0.42);
      g.textAlign = 'left';
    });
  });
}
function fridge(x: number, floor: number) {
  return sprite('fridge', [x - 260, floor - 1260, x + 260, floor + 20], sp => {
    const r = rng(1980);
    sp.pass({ dry: 0.3, relief: 0.5, soften: 1.2 }, g => {
      fillPoly(g, [[x - 240, floor], [x + 240, floor], [x + 240, floor - 1180], [x + 200, floor - 1240], [x - 200, floor - 1240], [x - 240, floor - 1180]], '#E8E2D2');
      for (let i = 0; i < 40; i++) knife(g, r, x + (r() - 0.5) * 420, floor - 40 - r() * 1150, Math.PI / 2 + (r() - 0.5) * 0.1, 200, 40, pick(r, ['#ECE6D8', '#E2DCCB', '#F1ECE0']), { load: 0.6 });
      ribbon(g, r, [[x - 238, floor - 760], [x + 238, floor - 760]], 10, '#B8B0A0', { load: 0.9 });
      ribbon(g, r, [[x + 170, floor - 1000], [x + 170, floor - 820]], 22, '#A8A090', { load: 1 });
      ribbon(g, r, [[x + 170, floor - 680], [x + 170, floor - 500]], 22, '#A8A090', { load: 1 });
    });
  });
}
const NOTE_SPOTS: P[] = [[400, 820], [560, 760], [700, 860], [430, 1010], [600, 980], [720, 1110], [470, 1240], [640, 1300], [380, 1420], [560, 1480]];

// ---------- the cast ----------
const SILVER = (x: number, feetY: number, s: number, key = 'a') => man(`silver:${key}`, x, feetY, s, { pal: CLOTH.linen, trousers: CLOTH.slate, skin: SKINS.fair, hair: HAIRS.brown, seed: 501 });
const FRY = (x: number, s: number) => man(`fry:${x}`, x, 1640, s, { pal: CLOTH.ochre, trousers: CLOTH.grey, skin: SKINS.fair, hair: HAIRS.grey, seed: 601 });
const PASSER = (i: number) => i % 2
  ? lady(`passer${i}`, 0, 1660, 0.95, { pal: CLOTH.sage, cut: 'aline', skin: SKINS.tan, hair: HAIRS.black, seed: 700 + i, flip: true })
  : man(`passer${i}`, 0, 1660, 0.95, { pal: CLOTH.coat, trousers: CLOTH.slate, skin: SKINS.olive, hair: HAIRS.black, seed: 700 + i, flip: true });

// The lab bench with the blocks and the bottle; `drop` 0..1 lets the top block fall off.
function labBench(f: Frame, drop: number, pressing: number) {
  bench(1300).put(f.c);
  bottle('glue', 760, 1270, 380, '#8C6A3C', { text: 'Adhesive', sub: '1968', paper: '#EFE6D4', ink: '#24161B' }).put(f.c);
  block('base', 420, 1270, 220, 120).put(f.c);
  block('top', 420, 1150, 220, 110).put(f.c, { dx: drop * 140, dy: -20 * pressing + drop * drop * 160, rot: drop * 0.9, px: 420, py: 1150 });
}

const SHOTS: Record<string, (f: Frame) => void> = {
  // In 1968, a 3M chemist tried to make an extremely strong glue, and failed.
  s01(f) {
    push(f, 1.0, 1.08, 540, 1150);
    backdrop('office').put(f.c);
    const fl = f.word('failed', 4.8), drop = outCubic(f.t, fl, fl + 0.6), press = inOut(f.t, 0.8, 1.6) * (1 - inOut(f.t, fl - 0.3, fl));
    const F = SILVER(230, 1700, 1.0);
    shadow('s01', 230, 1700, 300).put(f.c);
    const pose = add(idle(f.t, 1), { arm: -1.35 - 0.1 * press, head: 0.2 + 0.25 * drop, lean: 0.03 * press });
    drawFig(f.c, F, pose);
    labBench(f, drop, press);
  },
  // Spencer Silver had made the opposite.
  s02(f) {
    push(f, 1.05, 1.12, 480, 900);
    backdrop('office').put(f.c);
    const op = f.word('opposite', 1.4), look = inOut(f.t, op - 0.2, op + 0.4);
    const F = SILVER(420, 1940, 1.45, 'close');
    const pose = add(idle(f.t, 2), { arm: -1.25, head: 0.3 * look });
    drawFig(f.c, F, pose);
    const h = handAt(F, pose);
    block('held', h[0] + 70, h[1] + 30, 200, 110).put(f.c);
  },
  // A glue so weak, you could peel it off and stick it back again.
  s03(f) {
    push(f, 1.0, 1.06, 540, 900);
    backdrop('insert').put(f.c);
    const pl = f.word('peel', 1.6), st = f.word('stick', 2.6);
    const lift = inOut(f.t, pl, pl + 0.4) * (1 - inOut(f.t, st, st + 0.35));
    note('big', 540, 900, 440).put(f.c, { rot: -lift * 0.5, dy: -lift * 40, px: 540, py: 680 });
  },
  // Nobody wanted it.
  s04(f) {
    backdrop('office').put(f.c);
    const F = SILVER(260, 1680, 1.0, 'office');
    drawFig(f.c, F, add(idle(f.t, 3), { arm: -1.45, head: 0.05 }));
    bottle('glue-small', 0, 0, 160, '#8C6A3C', { text: 'Adhesive', paper: '#EFE6D4', ink: '#24161B' }).put(f.c, { dx: handAt(F, { arm: -1.45 })[0] + 40, dy: handAt(F, { arm: -1.45 })[1] + 140 });
    const P0 = PASSER(0);
    drawFig(f.c, P0, add(walk(f.t, 0, f.dur + 0.4, 1250, 380), { head: 0 }));
  },
  // For five years, he showed it to anyone who'd listen.
  s05(f) {
    backdrop('office').put(f.c);
    const F = SILVER(260, 1680, 1.0, 'office');
    const lift = Math.abs(Math.sin(f.t * 2.2));
    const pose = add(idle(f.t, 4), { arm: -1.25 - 0.3 * lift });
    drawFig(f.c, F, pose);
    const h = handAt(F, pose);
    bottle('glue-small', 0, 0, 160, '#8C6A3C', { text: 'Adhesive', paper: '#EFE6D4', ink: '#24161B' }).put(f.c, { dx: h[0] + 40, dy: h[1] + 140 });
    for (let i = 1; i <= 3; i++) {
      const t0 = (i - 1) * f.dur / 3.2;
      drawFig(f.c, PASSER(i), walk(f.t, t0, t0 + 1.6, 1250, -350));
    }
    const year = 1968 + Math.min(5, Math.floor(5 * f.t / Math.max(0.1, f.dur - 0.3)));
    f.c.save(); f.c.font = 'italic 150px "Instrument Serif"'; f.c.fillStyle = '#3A2A20'; f.c.textAlign = 'right'; f.c.fillText(String(year), 900, 640); f.c.restore();
    f.rt.text.push({ text: String(year), x0: 560, y0: 530, x1: 900, y1: 660, size: 150 });
  },
  // Then a colleague, Art Fry, had a problem in church.
  s06(f) {
    push(f, 1.0, 1.05, 540, 1100);
    backdrop('church').put(f.c);
    const F = FRY(0, 1.0), wk = walk(f.t, 0, 1.4, 1150, 560);
    const pose = add(add(idle(f.t, 5), wk), { arm: -1.1 });
    shadow('fry', 560, 1640, 300).put(f.c, { dx: wk.dx - 560 });
    drawFig(f.c, F, pose);
    const h = handAt(F, pose);
    hymnBook(0, 0, 80).put(f.c, { dx: h[0] + 30, dy: h[1] + 80 });
  },
  // His paper bookmarks kept falling out of his hymn book.
  s07(f) {
    backdrop('insert').put(f.c);
    hymnBook(540, 1150, 320).put(f.c);
    const r = rng(7);
    for (let i = 0; i < 4; i++) {
      const t0 = 0.2 + i * 0.55, k = Math.max(0, f.t - t0), x0 = 380 + r() * 320;
      const y = 560 + Math.min(1, k / 0.25) * 60 + Math.max(0, k - 0.25) ** 2 * 1400;
      if (y > 2100) continue;
      slip(`b${i}`, 0, 0, 70, 300).put(f.c, { dx: x0 + Math.sin(k * 6 + i) * 30, dy: y, rot: k * (i % 2 ? 1.6 : -1.4), px: 0, py: 0 });
    }
  },
  // So he coated them in Silver's weak glue.
  s08(f) {
    push(f, 1.0, 1.08, 540, 980);
    backdrop('insert').put(f.c);
    slip('yellow-big', 540, 1000, 300, 760, '#E9C640').put(f.c);
    const ct = f.word('coated', 0.5), drag = inOut(f.t, ct, ct + 1.0);
    if (drag > 0) {
      f.c.save(); f.c.globalAlpha = 0.55; f.c.fillStyle = '#F7F1DC'; f.c.fillRect(398, 640, 284 * drag, 70); f.c.restore();
      const kx = 380 + 300 * drag;
      f.c.save(); f.c.translate(kx, 660); f.c.rotate(-0.5);
      fillPoly(f.c, [[0, 0], [24, -10], [40, -220], [16, -228], [-8, -10]], '#9DA2A6'); fillPoly(f.c, [[16, -228], [40, -220], [52, -420], [28, -430]], '#5A3A26');
      f.c.restore();
    }
  },
  // They stayed, and they peeled off clean.
  s09(f) {
    push(f, 1.0, 1.05, 540, 1000);
    backdrop('insert').put(f.c);
    hymnBook(540, 1300, 360).put(f.c);
    const pl = f.word('peeled', 1.2), lift = inOut(f.t, pl, pl + 0.5);
    slip('stuck', 640, 880, 120, 300, '#E9C640').put(f.c, { rot: -lift * 0.7, dy: -lift * 160, dx: lift * 60, px: 640, py: 1030 });
  },
  // But the first time 3M sold them, in four cities, they flopped.
  s10(f) {
    backdrop('street').put(f.c);
    drawFig(f.c, PASSER(4), add(walk(f.t, 0.2, f.dur, 1300, -300), { head: 0 }));
    counter(1420).put(f.c);
    const fl = f.word('flopped', 3.2), tip = outCubic(f.t, fl, fl + 0.4);
    for (let i = 0; i < 3; i++) packBox(`row${i}`, 360 + i * 180, 1420, 170, false).put(f.c);
    for (let i = 0; i < 2; i++) packBox(`mid${i}`, 450 + i * 180, 1300, 170, false).put(f.c);
    packBox('top', 540, 1180, 170, false).put(f.c, { rot: tip * 1.2, dx: tip * 160, dy: tip * tip * 240, px: 625, py: 1180 });
  },
  // They were called Press 'n Peel.
  s11(f) {
    push(f, 1.0, 1.1, 540, 1000);
    backdrop('insert').put(f.c);
    packBox('label', 540, 1220, 680, true).put(f.c);
  },
  // In 1980, they came back as Post-it Notes.
  s12(f) {
    push(f, 1.04, 1.0, 540, 1000);
    backdrop('insert').put(f.c);
    const pn = f.word('post-it', 1.4);
    NOTE_SPOTS.forEach(([x, y], i) => {
      const t0 = pn - 0.9 + i * 0.12, k = outCubic(f.t, t0, t0 + 0.2);
      if (k <= 0) return;
      note(`wall${i}`, x, y, 170 + (i % 3) * 14).put(f.c, { s: 0.6 + 0.4 * k, rot: ((i * 37) % 9 - 4) * 0.02, px: x, py: y });
    });
  },
  // He was trying to make glue that never lets go.
  s13(f) {
    push(f, 1.08, 1.0, 540, 1150);
    backdrop('office').put(f.c);
    const press = inOut(f.t, 0.4, 1.2);
    const F = SILVER(230, 1700, 1.0);
    shadow('s01', 230, 1700, 300).put(f.c);
    drawFig(f.c, F, add(idle(f.t, 6), { arm: -1.35 - 0.1 * press, head: 0.2, lean: 0.03 * press }));
    labBench(f, 0, press);
  },
  // It's on your fridge because it always does.
  s14(f) {
    push(f, 1.0, 1.05, 540, 1100);
    backdrop('kitchen').put(f.c);
    shadow('fridge', 540, 1640, 520, '#8E897C').put(f.c);
    fridge(540, 1640).put(f.c);
    const al = f.word('always', 1.2), fall = inOut(f.t, al - 0.6, al - 0.1) * (1 - inOut(f.t, al + 0.1, al + 0.5));
    NOTE_SPOTS.forEach(([x, y], i) => {
      if (i === 3) note(`wall${i}`, x, y, 170 + (i % 3) * 14).put(f.c, { dy: fall * 180, rot: fall * 0.6, px: x, py: y - 80 });
      else note(`wall${i}`, x, y, 170 + (i % 3) * 14).put(f.c, { rot: ((i * 37) % 9 - 4) * 0.02, px: x, py: y });
    });
  },
  // The loop: the fridge, still.
  s15(f) {
    push(f, 1.05, 1.1, 540, 1100);
    backdrop('kitchen').put(f.c);
    shadow('fridge', 540, 1640, 520, '#8E897C').put(f.c);
    fridge(540, 1640).put(f.c);
    NOTE_SPOTS.forEach(([x, y], i) => note(`wall${i}`, x, y, 170 + (i % 3) * 14).put(f.c, { rot: ((i * 37) % 9 - 4) * 0.02, px: x, py: y }));
  },
};

export default knifeEpisode(SHOTS);
