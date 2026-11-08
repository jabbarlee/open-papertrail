// The cast of "Alone": one bust that takes a hair, a skin and an expression, and a full-length taxi. Facing right by
// default. Local origin is the chest; the face uses the coordinates it was designed in, centred on (325, 512).
import { field, tile, type Ink, type Pt, tools } from './ink.ts';
import type { StreetInks } from './street.ts';

export type T = ReturnType<typeof tools>;
export type Skin = 'crimson' | 'tan' | 'deep';
export type Hair = 'short' | 'bob' | 'cap' | 'afro';
export type Top = 'green' | 'wine' | 'shirt' | 'blue' | 'bare';
export interface Bust {
  x: number; y: number; s: number; flip?: boolean; skin: Skin; hair: Hair; top: Top;
  mouth?: 'flat' | 'smile' | 'laugh' | 'forced'; eye?: 'dot' | 'happy' | 'lens' | 'down' | 'roll'; tilt?: number; dot?: number; ghost?: boolean; neck?: number; bob?: Ink; bobShade?: Ink; lines?: boolean;
}

export function makeSkins() {
  const f = field(31), g = field(43);
  return {
    tan: { base: tile(f, '#BC722A', 8), lit: tile(g, '#CE8638', 8), mid: tile(f, '#8A5E29', 5), deep: tile(g, '#3A2410', 2) },
    deep: { base: tile(f, '#6E2230', 6), lit: tile(g, '#84303D', 6), mid: tile(f, '#42141D', 4), deep: tile(g, '#1E0A0F', 2) },
  };
}
export type Skins = ReturnType<typeof makeSkins>;

export function bust(c: CanvasRenderingContext2D, t: T, I: StreetInks, K: Skins, o: Bust) {
  const { fill, part, pen, edge } = t, G = o.ghost;
  const sk = G ? { base: I.paper, lit: I.paper, mid: I.paper, deep: I.paper } as Record<string, Ink>
    : o.skin === 'crimson' ? { base: I.skin, lit: I.skinLit, mid: I.skinMid, deep: I.skinDeep } : K[o.skin];
  const tops: Record<Top, [Ink, Ink]> = { green: [I.green, I.greenDeep], wine: [I.wallL, I.wallLdeep], shirt: [I.paper, I.grey], blue: [I.wallR, I.wallRdeep], bare: [sk.base, sk.mid] };
  const [top, topDeep] = G ? [I.paper, I.paper] : tops[o.top];
  const neck = o.neck ?? 190, ny = -100 - neck;
  c.save(); c.translate(o.x, o.y); c.scale(o.flip ? -o.s : o.s, o.s);

  // torso
  const torso: Pt[] = [[-140, 230, 1], [-136, -30], [-100, -82], [-36, -104], [36, -104], [100, -82], [136, -30], [140, 230, 1]];
  edge(torso, 4, 1); fill(torso, top, 1);
  fill([[36, -104, 1], [100, -82], [136, -30], [140, 230, 1], [60, 230, 1], [70, -20, 1]], topDeep, 2);
  // neck: three flat steps of light
  fill([[-30, -92, 1], [-20, ny, 1], [34, ny, 1], [30, -92, 1]], sk.lit, 3);
  fill([[-20, ny, 1], [34, ny, 1], [32, ny + neck * 0.5, 1], [-26, ny + neck * 0.34, 1]], sk.mid, 3);
  fill([[12, ny, 1], [34, ny, 1], [30, -92, 1], [12, -92, 1]], sk.deep, 4);
  pen([[-20, ny], [-30, -92]], [3, 3], 5); pen([[34, ny], [30, -92]], [3, 3], 6);
  if ((o.top !== 'shirt' && o.top !== 'bare') || G) { fill([[-46, -110, 1], [0, -76], [44, -110, 1], [40, -92], [0, -60], [-42, -92]], G ? I.paper : I.paper, 7); pen([[-46, -108], [0, -62], [44, -108]], [2, 3, 2], 8); }

  // head
  c.save(); c.translate(4, ny - 10); c.rotate(o.tilt ?? 0); c.translate(-325, -512);
  const hairInk = G ? I.paper : o.hair === 'bob' ? I.paper : I.black;
  if (o.hair === 'bob') {
    const b: Pt[] = [[300, 368], [346, 380], [380, 420], [384, 470], [352, 500], [316, 520], [262, 550], [214, 530], [186, 480], [192, 420], [226, 384], [262, 366]];
    edge(b, 3.5, 20); fill(b, o.bob ?? I.paper, 20);
    if (!G) fill([[186, 480], [214, 530], [262, 550], [288, 530, 1], [262, 490], [222, 492]], o.bobShade ?? I.grey, 21);
  }
  if (o.hair === 'afro') {
    const b: Pt[] = [[320, 356], [376, 372], [410, 420], [392, 470], [340, 520], [290, 590], [226, 580], [184, 520], [176, 450], [206, 390], [262, 356]];
    edge(b, 3.5, 20); fill(b, hairInk, 20);
  }
  const face: Pt[] = [[286, 434], [330, 424], [362, 438], [376, 462, 1], [420, 526, 1], [386, 536, 1], [394, 552], [380, 562], [386, 576], [362, 602], [316, 600], [284, 568], [268, 522], [270, 472]];
  edge(face, 3.2, 22); fill(face, sk.base, 22);
  fill([[376, 462, 1], [420, 526, 1], [386, 536, 1], [364, 502, 1]], sk.mid, 23);
  fill([[284, 568], [316, 600], [362, 602], [376, 588, 1], [330, 572], [294, 526, 1], [270, 510, 1]], sk.mid, 24);
  // eye
  const eye = o.eye ?? 'dot';
  if (eye === 'lens') {
    c.beginPath(); c.arc(336, 484, 30, 0, 7); c.fillStyle = G ? I.paper : I.gold; c.fill();
    c.beginPath(); c.arc(336, 484, 23, 0, 7); c.fillStyle = I.black; c.fill();
    pen([[306, 478], [270, 470]], [4, 4], 26);
  } else if (eye === 'happy') pen([[322, 492], [340, 476], [358, 492]], [3, 7, 3], 26);
  else if (eye === 'down') pen([[322, 486], [340, 492], [358, 486]], [3, 7, 3], 26);
  else if (eye === 'roll') { c.beginPath(); c.arc(346, 472, 10, 0, 7); c.fillStyle = I.black; c.fill(); pen([[318, 452], [344, 442], [366, 452]], [2, 8, 3], 27); }
  else { c.beginPath(); c.arc(342, 484, 10, 0, 7); c.fillStyle = I.black; c.fill(); pen([[320, 460], [344, 454], [364, 462]], [2, 8, 3], 27); }
  if (o.lines) { pen([[368, 500], [382, 508]], [1.5, 3, 1.5], 25); pen([[300, 526], [318, 548], [336, 552]], [1.5, 3, 1.5], 25); pen([[318, 438], [352, 436]], [1.5, 2.5, 1.5], 25); }
  // mouth
  const m = o.mouth ?? 'flat';
  if (m === 'laugh') {
    fill([[394, 544, 1], [340, 548, 1], [350, 586], [374, 584], [388, 566]], I.black, 28);
    fill([[390, 546, 1], [346, 549, 1], [350, 560, 1], [388, 557, 1]], I.paper, 28);
  } else if (m === 'smile') pen([[390, 552], [370, 564], [346, 552]], [2, 5, 2], 28);
  else if (m === 'forced') {
    fill([[394, 546, 1], [330, 546, 1], [346, 568], [376, 568]], I.paper, 28);
    pen([[394, 546], [362, 548], [330, 546]], [2, 3, 2], 29); pen([[394, 546], [376, 569], [346, 569], [330, 546]], [2, 3, 3, 2], 30);
    pen([[364, 548], [364, 568]], [1.5, 1.5], 31); pen([[348, 548], [350, 566]], [1.5, 1.5], 32);
  } else pen([[390, 560], [354, 562]], [2, 4], 28);
  // hair over the face
  if (o.hair === 'bob') {
    fill([[364, 436], [330, 412], [284, 426], [262, 470], [262, 512], [236, 500], [228, 420], [290, 372], [346, 384]], o.bob ?? I.paper, 27);
    pen([[364, 436], [330, 412], [284, 426], [262, 470], [262, 512]], [1, 3, 3, 3, 1], 28);
  }
  if (o.hair === 'short') {
    const h: Pt[] = [[318, 402], [360, 416], [378, 456, 1], [336, 444], [296, 452], [282, 500], [288, 566], [258, 536], [244, 462], [268, 416]];
    edge(h, 3, 33); fill(h, hairInk, 33);
  }
  if (o.hair === 'afro') { fill([[372, 440], [330, 416], [284, 432], [268, 480], [262, 530], [232, 470], [262, 396], [340, 384]], hairInk, 33); }
  if (o.hair === 'cap') {
    fill([[388, 540], [352, 546], [318, 578], [356, 568], [396, 562]], I.paper, 34);
    edge([[276, 456, 1], [288, 412], [338, 394], [376, 416], [386, 456, 1]], 3, 35);
    fill([[276, 456, 1], [288, 412], [338, 394], [376, 416], [386, 456, 1]], G ? I.paper : I.green, 35);
    fill([[380, 448, 1], [442, 460], [446, 472], [378, 464, 1]], G ? I.paper : I.black, 36);
    edge([[264, 500], [276, 490], [288, 506], [280, 530], [266, 526]], 2.6, 37); fill([[264, 500], [276, 490], [288, 506], [280, 530], [266, 526]], sk.base, 37);
  }
  if (o.hair === 'bob' || o.hair === 'afro') { c.beginPath(); c.arc(286, 582, 11, 0, 7); c.fillStyle = G ? I.paper : I.gold; c.fill(); }
  c.restore();

  // the feeling
  if ((o.dot ?? 0) > 0) {
    c.beginPath(); c.arc(4, -6, o.dot! + 3, 0, 7); c.fillStyle = I.paper; c.fill();
    c.beginPath(); c.arc(4, -6, o.dot!, 0, 7); c.fillStyle = I.black; c.fill();
  }
  c.restore();
}

// The whole taxi, nose to the left. Local origin: the ground, middle of the car.
export function taxi(c: CanvasRenderingContext2D, t: T, I: StreetInks, o: { x: number; y: number; s: number; flip?: boolean; spin: number; inside?: () => void }) {
  const { fill, pen } = t;
  const poly = (l: [number, number][], ink: Ink) => fill(l.map(([x, y]) => [x, y, 1] as Pt), ink);
  c.save(); c.translate(o.x, o.y); c.scale(o.flip ? -o.s : o.s, o.s);
  c.beginPath(); c.ellipse(0, 6, 820, 26, 0, 0, 7); c.fillStyle = I.black; c.fill();
  const body: Pt[] = [[-770, -230, 1], [-640, -286], [-450, -306], [-310, -326], [-270, -376], [-150, -566], [-120, -582], [470, -582], [530, -552], [640, -340], [740, -310], [776, -230], [770, -60, 1], [-770, -60, 1]];
  t.edge(body, 5, 2); fill(body, I.gold, 2);
  fill([[-770, -150, 1], [770, -160, 1], [770, -60, 1], [-770, -60, 1]], I.goldShade, 3);
  poly([[-770, -84], [770, -84], [770, -56], [-770, -56]], I.goldDeep);
  poly([[-262, -344], [-140, -546], [120, -546], [120, -336]], I.black);
  poly([[160, -546], [462, -546], [590, -336], [160, -336]], I.black);
  o.inside?.();
  // sill, so whoever sits inside stays inside
  poly([[-300, -336], [640, -336], [640, -318], [-300, -318]], I.gold);
  for (let i = 0; i < 30; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2 === 0) { const x = -270 + i * 30, y = -256 + j * 28; poly([[x, y], [x + 30, y], [x + 30, y + 28], [x, y + 28]], I.black); }
  pen([[140, -560], [140, -70]], [10, 5], 5); pen([[-280, -330], [-284, -70]], [4, 4], 6);
  poly([[-230, -660], [30, -660], [44, -582], [-244, -582]], I.paper);
  c.save(); c.translate(-100, -620); c.scale(o.flip ? -1 : 1, 1); c.fillStyle = I.black; c.font = '900 58px Inter'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TAXI', 0, 0); c.restore();
  fill([[-750, -224], [-696, -252], [-672, -216], [-722, -184]], I.moon, 7);
  for (const x of [-480, 480]) {
    c.beginPath(); c.arc(x, -120, 126, Math.PI, 0); c.fillStyle = I.black; c.fill();
    c.beginPath(); c.arc(x, -96, 96, 0, 7); c.fillStyle = '#16121A'; c.fill();
    c.beginPath(); c.arc(x, -96, 50, 0, 7); c.fillStyle = I.grey; c.fill();
    c.save(); c.beginPath(); c.arc(x, -96, 50, 0, 7); c.clip(); c.beginPath(); c.arc(x - 14, -110, 50, 0, 7); c.fillStyle = I.paper; c.fill(); c.restore();
    for (let k = 0; k < 5; k++) { const w = o.spin + k * 1.2566; c.beginPath(); c.arc(x + 30 * Math.cos(w), -96 + 30 * Math.sin(w), 6, 0, 7); c.fillStyle = I.black; c.fill(); }
  }
  c.restore();
}
