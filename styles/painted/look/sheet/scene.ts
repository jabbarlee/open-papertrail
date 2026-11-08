// Character sheet for Otto: turnaround, expressions, poses, palette. Render:
//   npm run studio -- stills series/painted/look/sheet --at 0.5
import { defineScene } from '../../../../core/scene.ts';
import { finish, prepareOverlay } from '../../components/overlay.ts';
import { brushLine, paintPlates, paintRect, shadowBlob } from '../../components/paint.ts';
import { S } from '../../components/ink.ts';
import { FONTS } from '../../components/props.ts';
import { OTTO, otto, type OttoOpts } from '../../components/cast/otto.ts';
import type { C } from '../../components/noise.ts';

const W = 2560, H = 1600;

function label(c: C, text: string, x: number, y: number, size = 44, align: CanvasTextAlign = 'center', color = '#3A2F26') {
  c.save(); c.font = `${size}px "Patrick Hand"`; c.fillStyle = color; c.textAlign = align; c.fillText(text, x, y); c.restore();
}
function fig(c: C, x: number, y: number, s: number, o: OttoOpts) {
  c.save(); c.translate(x, y); c.scale(s, s); S.inkw = 5 / s; otto(c, o); c.restore();
}

export default defineScene({
  fonts: FONTS,
  setup() { paintPlates(); prepareOverlay(W, H); },
  render(c, rt) {
    S.boil = 0;
    paintRect(c, 0, 0, W, H, '#D8D0BB', { seed: 1, ang: 0, angVar: 0.2, len: 380, bw: 70, var: 0.05, grime: 0.22, light: 0.25, scratches: 20 });
    // title
    c.save(); c.font = '150px "Caveat Brush"'; c.fillStyle = '#2A231D'; c.fillText('OTTO', 90, 175); c.restore();
    label(c, 'main character  ·  28  ·  deadpan  ·  always a little tired', 400, 160, 46, 'left', '#5A4A3C');

    // turnaround with height guides
    const base = 1430, s = 1.0, top = base - 962 * s;
    for (const [y, t] of [[top, 'beanie tip'], [base - 722 * s, 'eye line'], [base - 576 * s, 'shoulders'], [base - 330 * s, 'hips'], [base, '']] as [number, string][]) {
      brushLine(c, 70, y, 1360, y, 3, '#9C8F78', 10 + y, 0.6);
      if (t) label(c, t, 76, y - 10, 26, 'left', '#8A7C66');
    }
    const views: [OttoOpts['view'], string, number][] = [['front', 'FRONT', 250], ['three', '3/4', 570], ['side', 'SIDE', 890], ['back', 'BACK', 1215]];
    for (const [v, name, x] of views) {
      shadowBlob(c, x, base + 4, 120, 20, 20 + x, '#B9AF98');
      fig(c, x, base, s, { view: v, gaze: v === 'three' ? [0.5, 0] : [0, 0] });
      label(c, name, x, 1510, 46);
    }
    brushLine(c, 1400, 120, 1404, 1540, 6, '#9C8F78', 99, 0.7);

    // expressions: head-and-shoulders crops
    label(c, 'expressions', 1450, 260, 50, 'left', '#2A231D');
    const ex: [string, OttoOpts][] = [
      ['deadpan', { gaze: [0, 0], mouth: 'none' }],
      ['side-eye', { gaze: [0.95, 0.1], lid: 0.35, mouth: 'flat' }],
      ['oh no', { gaze: [0, 0], mouth: 'o' }],
      ['tired', { gaze: [0, 0.5], lid: 0.55, mouth: 'none' }],
      ['small win', { gaze: [0.2, -0.3], mouth: 'smile' }],
      ['unimpressed', { gaze: [-0.6, 0.2], lid: 0.45, mouth: 'frown' }],
    ];
    ex.forEach(([name, o], i) => {
      const cx = 1610 + (i % 3) * 330, cy = 300 + Math.floor(i / 3) * 370;
      paintRect(c, cx - 150, cy, 300, 310, '#C9BFA6', { seed: 200 + i, len: 140, bw: 40, grime: 0.25 });
      c.save(); c.beginPath(); c.rect(cx - 150, cy, 300, 310); c.clip();
      fig(c, cx, cy + 14 + 962 * 0.95, 0.95, { ...o, view: 'front', bag: false });
      c.restore();
      label(c, name, cx, cy + 352, 38);
    });

    // poses
    label(c, 'poses', 1450, 1090, 50, 'left', '#2A231D');
    const poses: [OttoOpts['pose'], string, number, OttoOpts][] = [
      ['phone', 'scrolling', 1570, { gaze: [0, 0.9], lid: 0.3 }],
      ['shrug', 'whatever', 1830, { gaze: [0, 0], mouth: 'flat', lid: 0.3 }],
      ['point', 'that one', 2080, { view: 'three', gaze: [0.8, -0.1], mouth: 'o' }],
    ];
    for (const [p, name, x, o] of poses) {
      shadowBlob(c, x, 1530, 80, 12, 300 + x, '#B9AF98');
      fig(c, x, 1530, 0.42, { view: 'front', ...o, pose: p });
      label(c, name, x, 1580, 34);
    }
    // palette
    const pal: [string, string][] = [[OTTO.beanie, 'beanie'], [OTTO.sweater, 'sweater'], [OTTO.trousers, 'cords'], [OTTO.bag, 'tote'], [OTTO.bagPrint, 'moon'], ['#E5E2D7', 'skin']];
    pal.forEach(([col, name], i) => {
      const y = 1130 + i * 72;
      c.save(); c.fillStyle = col; c.beginPath(); c.arc(2300, y, 26, 0, 7); c.fill(); c.lineWidth = 3; c.strokeStyle = '#151317'; c.stroke(); c.restore();
      label(c, `${name} ${col.toUpperCase()}`, 2340, y + 10, 26, 'left', '#3A2F26');
    });

    finish(c, rt.f, { vignette: 0.6 });
  },
});
