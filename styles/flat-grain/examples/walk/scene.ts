// "Walk". One night street: you walk with the phone at your ear, Mom on the line in a lit window. The thread is the
// gold tag over your head (the call timer, then what the walk is worth). At the end you reach the door and go round again.
import { defineScene } from '../../../../core/scene.ts';
import { tools, type Pt } from '../../components/ink.ts';
import { makeStreet, type StreetInks } from '../../components/street.ts';
import { bust, makeSkins, type Bust, type Skins } from '../../components/people.ts';
import { boxes, clearBoxes, H, irisOpen, irisShut, lamp, lerp, makeCaptions, phone, pop, say, ss, tableBand, tag, W, wordAt, world, type T } from '../../components/stage.ts';
import said from './words.json';

const at = wordAt(said), END = said[said.length - 1].end;
const A = {
  shoes: at('shoes'), step: at('step'), suddenly: at('suddenly'), ten: at('ten'), lot: at('lot'), say: at('say'),
  because: at('because'), walk: at('walk'), ending: at('ending'), im: at("i'm"), got: at('got', 2), so: at('so', 2),
  going: at('going'), long: at('long'), round: at('round'), block: at('block'), knows: at('knows'), big: at('big'),
  news: at('news'), last: at('last'), street: at('street'),
};

const captions = makeCaptions(said, [
  ['Why do you only call your mom', "when you're walking somewhere?"], ['You put your shoes on,'], ['step outside,'], ["and suddenly you've got"],
  ['ten minutes'], ['and a lot to say.'], ["And it's because a walk"], ['gives the call an ending,'], ['so you can always say'], ["I'm here, got to go."],
  ["So when it's going well,"], ['you take the long way'], ['round the block.'], ['And she knows,'], ['because she always saves'], ['the big news'], ['for the last street.'],
], new Set(['mom', 'walking', 'shoes', 'outside,', 'ten', 'minutes', 'ending,', "here,", 'go.', 'long', 'block.', 'knows,', 'big', 'news', 'last', 'street.']), 11);

const Y = 1040, S = 0.92, NECK = 170;
const stepped = (time: number) => Math.floor(time * 12) / 12;
const headTop = (s = S) => Y - (100 + NECK + 150) * s;

let I: StreetInks, K: Skins;

// The street scrolls by `cam`: far blocks with gold windows, the lamp, a door you left and the door you're heading to.
function street(c: CanvasRenderingContext2D, t: T, cam: number, home: number | null) {
  const poly = (l: [number, number][], ink: Parameters<T['fill']>[1], ph = 0) => t.fill(l.map(([x, y]) => [x, y, 1] as Pt), ink, ph);
  poly([[-200, -60], [1300, -60], [1300, 1300], [-200, 1300]], I.sky);
  c.beginPath(); c.arc(180, 240, 64, 0, 7); c.fillStyle = I.moon; c.fill();
  const span = 1500, shift = ((cam * 0.6) % span + span) % span;
  for (let rep = -1; rep < 2; rep++) {
    [[0, 640], [170, 760], [330, 560], [500, 700], [660, 600], [820, 740], [980, 620], [1150, 700], [1310, 580]].forEach(([bx, by], i) => {
      const x = bx + rep * span - shift;
      if (x < -320 || x > 1260) return;
      poly([[x, by], [x + 150, by], [x + 150, 1300], [x, 1300]], I.far, i);
      for (let r = 0; r < 4; r++) if ((i + r) % 2 === 0) poly([[x + 44, by + 60 + r * 104], [x + 86, by + 60 + r * 104], [x + 86, by + 112 + r * 104], [x + 44, by + 112 + r * 104]], I.gold, i + r);
    });
  }
  // the door at home, `home` px ahead in street space
  if (home !== null) {
    const x = home - cam;
    poly([[x - 20, 560], [x + 210, 560], [x + 210, 1300], [x - 20, 1300]], I.wallL, 30);
    t.part([[x + 30, 700, 1], [x + 160, 700, 1], [x + 160, 1240, 1], [x + 30, 1240, 1]], I.gold, 4, 31);
    c.beginPath(); c.arc(x + 140, 980, 11, 0, 7); c.fillStyle = I.black; c.fill();
  }
}

function you(c: CanvasRenderingContext2D, t: T, x: number, o: Partial<Bust> = {}, call = true) {
  const flip = !!o.flip, s = o.s ?? S;
  bust(c, t, I, K, { x, y: Y, s, neck: NECK, skin: 'crimson', hair: 'short', top: 'green', mouth: 'smile', ...o });
  if (call) {
    const ex = x + (flip ? 52 : -52) * s, ey = Y - (100 + NECK + 22) * s;
    c.beginPath(); c.arc(ex + (flip ? -10 : 10) * s, ey + 70 * s, 26 * s, 0, 7); c.fillStyle = I.skinMid as unknown as string; c.fill();
    phone(t, I, ex, ey, 0.62 * s, false);
  }
}

// Mom in her lit kitchen window, top right, on the phone too.
function momWindow(c: CanvasRenderingContext2D, t: T, p: number, o: Partial<Bust> = {}, x0 = 640, y0 = 120, w = 380, h = 330) {
  if (p <= 0) return;
  c.save(); c.translate(x0 + w / 2, y0 + h / 2); c.scale(p, p); c.translate(-(x0 + w / 2), -(y0 + h / 2));
  t.part([[x0 - 22, y0 - 22, 1], [x0 + w + 22, y0 - 22, 1], [x0 + w + 22, y0 + h + 22, 1], [x0 - 22, y0 + h + 22, 1]], I.wallL, 4, 40);
  t.fill([[x0, y0, 1], [x0 + w, y0, 1], [x0 + w, y0 + h, 1], [x0, y0 + h, 1]], I.gold, 41);
  c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip();
  const mx = x0 + w * 0.55, my = y0 + h + 62, ms = 0.62;
  bust(c, t, I, K, { x: mx, y: my, s: ms, flip: true, skin: 'tan', hair: 'bob', top: 'wine', bob: '#17121A', bobShade: '#2B2430', mouth: 'smile', ...o });
  const ex = mx + 40 * ms, ey = my - (100 + 190 + 2) * ms;
  phone(t, I, ex, ey, 0.62 * ms, false);
  c.restore();
  t.fill([[x0 + w / 2 - 6, y0, 1], [x0 + w / 2 + 6, y0, 1], [x0 + w / 2 + 6, y0 + h, 1], [x0 + w / 2 - 6, y0 + h, 1]], I.wallL, 42);
  c.restore();
}

// Top-down: one block, the route round it in gold, and you as a dot.
function blockMap(c: CanvasRenderingContext2D, t: T, time: number) {
  const poly = (l: [number, number][], ink: Parameters<T['fill']>[1], ph = 0) => t.fill(l.map(([x, y]) => [x, y, 1] as Pt), ink, ph);
  poly([[-200, -60], [1300, -60], [1300, 1300], [-200, 1300]], I.pave);
  poly([[260, 340], [700, 340], [700, 860], [260, 860]], I.far, 50);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) poly([[290 + k * 140, 370 + r * 165], [390 + k * 140, 370 + r * 165], [390 + k * 140, 480 + r * 165], [290 + k * 140, 480 + r * 165]], (r + k) % 2 ? I.wallR : I.wallRdeep, 51 + r * 3 + k);
  // home: a gold square on the near corner
  poly([[700, 960], [800, 960], [800, 1060], [700, 1060]], I.gold, 60);
  tag(c, t, I, 'HOME', 750, 1110, 44, 1, I.paper, I.black as string, 0);
  // the route: from the left, along the bottom, then (going well) all the way round
  const loop: [number, number][] = [[160, 920], [760, 920], [760, 280], [200, 280], [200, 920], [750, 920]];
  const lens = loop.slice(1).map((p, i) => Math.hypot(p[0] - loop[i][0], p[1] - loop[i][1])), total = lens.reduce((a, b) => a + b, 0);
  const prog = lerp(0.18, 1, ss(A.long - 0.2, A.block + 0.5, time)) * total;
  let left = prog, pts: [number, number][] = [loop[0]], head = loop[0];
  for (let i = 0; i < lens.length && left > 0; i++) {
    const k = Math.min(1, left / lens[i]); head = [lerp(loop[i][0], loop[i + 1][0], k), lerp(loop[i][1], loop[i + 1][1], k)]; pts.push(head); left -= lens[i];
  }
  c.lineWidth = 22; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#EDA93D'; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
  c.beginPath(); c.arc(head[0], head[1], 34, 0, 7); c.fillStyle = I.skin as unknown as string; c.fill();
  c.lineWidth = 6; c.strokeStyle = I.black; c.stroke();
  return head;
}

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

export default defineScene({
  fonts: [{ family: 'Inter', url: '/styles/flat-grain/fonts/Inter.ttf', weight: '100 900' }],
  setup() { I = makeStreet(); K = makeSkins(); },
  render(c, rt) {
    clearBoxes();
    const time = rt.t, tl = tools(c, { s: 1, ox: 0, oy: 0 }, W, H, I.black, I.noise, 2.2, (Math.floor(time * 6) % 3) * 1.3), d = stepped(time);
    const bob = 0.035 * Math.sin(d * 9);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = I.paper; c.fillRect(0, 0, W, H);
    const overHead = (text: string, x: number, p = 1, ink = I.gold) => tag(c, tl, I, text, x, headTop() - 40, 62, p, ink, I.black as string, 0);

    if (time < A.so) {
      // the walk: the street scrolls, you keep walking; the door home comes into view on "because"
      const cam = d * 140, X = 400;
      const home = time >= A.because - 0.3 ? 1250 + (A.because - 0.3) * 140 - lerp(0, 380, ss(A.because, A.got, time)) : null;
      c.save(); world(c);
      street(c, tl, cam, home);
      lamp(c, tl, I, 0.012 * Math.sin(d * 2));
      you(c, tl, X, { tilt: bob, mouth: time > A.lot && time < A.say + 0.4 ? 'laugh' : 'smile', eye: 'dot' });
      momWindow(c, tl, 1, { mouth: time > A.got && time < A.got + 0.6 ? 'flat' : 'smile' });
      tableBand(tl, I);
      // the thread: call timer, then what the walk gives you
      if (time < A.ten - 0.05) overHead(`MOM  ${mmss(12 + time)}`, X);
      else if (time < A.because) overHead('10 MIN', X, pop(A.ten - 0.05, 0.16, time));
      else overHead('THE END', X, pop(A.ending - 0.05, 0.16, time) || 0.0001, I.paper);
      // the moment
      const gone = 1 - ss(A.because - 0.2, A.because, time), early = 1 - ss(A.ten - 0.15, A.ten, time);
      tag(c, tl, I, 'SHOES ON', 300, 330, 54, early * pop(A.shoes, 0.16, time), I.paper, I.black as string, -0.06);
      tag(c, tl, I, 'OUTSIDE', 330, 450, 54, early * pop(A.step, 0.16, time), I.paper, I.black as string, 0.04);
      say(c, tl, I, 760, 560, 330, 104, gone * pop(A.lot - 0.05, 0.14, time), 'SO ANYWAY', [455, 815], 50);
      say(c, tl, I, 780, 700, 300, 104, gone * pop(A.lot + 0.15, 0.14, time), 'OH AND', [455, 825], 50);
      say(c, tl, I, 690, 820, 330, 100, gone * pop(A.say - 0.05, 0.14, time), 'GUESS WHO', [455, 835], 48);
      // the ending: you can always say you're here
      say(c, tl, I, 790, 560, 330, 112, pop(A.im - 0.05, 0.16, time) * (1 - ss(A.so - 0.3, A.so, time)), "I'M HERE!", [455, 815], 58);
      say(c, tl, I, 740, 720, 380, 112, pop(A.got - 0.05, 0.16, time) * (1 - ss(A.so - 0.3, A.so, time)), 'GOT TO GO!', [455, 830], 58);
      c.restore();
      irisShut(c, I, X, headTop() - 40, ss(A.so - 0.28, A.so, time));
    } else if (time < A.knows - 0.25) {
      // the long way round: the block from above
      c.save(); world(c);
      blockMap(c, tl, time);
      tag(c, tl, I, 'GOING WELL', 480, 200, 56, pop(A.going, 0.16, time), I.gold, I.black as string, -0.03);
      tag(c, tl, I, '+1 LAP', 480, 600, 58, pop(A.round, 0.16, time), I.paper, I.black as string, 0);
      tableBand(tl, I);
      c.restore();
      irisOpen(c, I, 540, 920, ss(A.so, A.so + 0.28, time));
      irisShut(c, I, 540, 920, ss(A.knows - 0.5, A.knows - 0.25, time));
    } else {
      // the last street: the door ahead, she saves the big news; you reach the door, then go round again
      const arrive = ss(A.knows, A.street + 0.4, time), turn = time > END + 1.0, away = ss(END + 1.0, END + 2.4, time);
      const cam = turn ? lerp(900, 760, away) : lerp(700, 900, arrive);
      const X = turn ? 520 : 400 + 120 * arrive;
      const walking = arrive < 1 || (turn && away < 1);
      c.save(); world(c);
      street(c, tl, cam, 1350);
      lamp(c, tl, I, 0.012 * Math.sin(d * 2));
      const big = time >= A.big - 0.05;
      you(c, tl, X, { flip: turn, tilt: walking ? bob : 0, mouth: big && !turn ? 'flat' : 'smile', eye: 'dot' });
      const grow = lerp(1, 1.15, ss(A.big - 0.3, A.big, time));
      momWindow(c, tl, grow, { mouth: big ? 'laugh' : 'smile' }, 640, 120);
      say(c, tl, I, 470, 210, 520, 112, pop(A.big - 0.05, 0.16, time), 'OH, ONE MORE THING', [700, 200], 50);
      tableBand(tl, I);
      if (time < A.last - 0.05) overHead('THE END', X, 1, I.paper);
      else if (!turn) overHead('LAST STREET', X, pop(A.last - 0.05, 0.16, time));
      else overHead('ONE MORE LAP', X, pop(END + 1.0, 0.18, time));
      c.restore();
      irisOpen(c, I, 400, headTop() - 40, ss(A.knows - 0.25, A.knows + 0.05, time));
    }
    captions(c, I, time);
    rt.text.push(...boxes);
  },
});
