// An original Flat Grain scene, drawn with no reference: a junction at night, a taxi, its driver and a tall passenger.
// Coordinates are the 1080 x 1920 frame. Bottom 400 px and the top 150 px stay clear of story for the Reels UI.
import { field, tile, tools, type Ink, type Pt, type XY } from './ink.ts';

export type StreetInks = ReturnType<typeof makeStreet>;
type Tools = ReturnType<typeof tools>;
export function makeStreet() {
  const f = field(7), g = field(19);
  return {
    noise: g, black: '#0A070B', paper: '#FBFAF8', moon: tile(f, '#F3E2BD', 3),
    sky: tile(f, '#17294F', 5), far: tile(g, '#0F1A36', 3),
    wallL: tile(f, '#78232D', 5), wallLdeep: tile(g, '#3E141C', 3), wallR: tile(g, '#1F3768', 5), wallRdeep: tile(f, '#122244', 3),
    road: tile(g, '#14151F', 3), pave: tile(f, '#2C3A5E', 5), paveLit: tile(g, '#8A5E29', 7),
    gold: tile(f, '#EDA93D', 4, 12), goldShade: tile(g, '#BC722A', 9, 16), goldDeep: tile(f, '#8A5E29', 6),
    skin: tile(f, '#BF3D52', 8), skinLit: tile(g, '#C34D63', 8.5), skinMid: tile(f, '#78232D', 5), skinDeep: tile(g, '#280F13', 2),
    green: tile(g, '#1E4823', 5), greenLit: tile(f, '#2F6B38', 6), greenDeep: tile(g, '#10291A', 3),
    grey: tile(f, '#B9B4AE', 4),
  };
}

const VP: XY = [560, 1075];
const onWall = (nearX: number, farX: number, top: number, bot: number) => (u: number, v: number): XY => {
  const k = 1 / (1 + u * 3.2), x = VP[0] + (nearX - VP[0]) * k;     // u: depth along the wall; v: 0 ground, 1 top
  const yb = VP[1] + (bot - VP[1]) * k, yt = VP[1] + (top - VP[1]) * k;
  return [x, yb + (yt - yb) * v];
};
type Wall = (u: number, v: number) => XY;
const L: Wall = onWall(-160, 0, -1500, 1240), R: Wall = onWall(1260, 0, -1300, 1240);
const cell = (P: Wall, u0: number, u1: number, v0: number, v1: number): XY[] => [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];

// ---- the 5 seconds: every value comes from the time alone, so frames can render in any order ----
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const ss = (a: number, b: number, x: number) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const overshoot = (a: number, b: number, x: number) => { const u = clamp((x - a) / (b - a)) - 1; return 1 + 2.7 * u * u * u + 1.7 * u * u; };
const bump = (a: number, b: number, x: number) => Math.sin(Math.PI * clamp((x - a) / (b - a)));

export type Pose = ReturnType<typeof poseAt>;
export function poseAt(t: number) {
  const d = Math.floor(t * 12) / 12;                       // people move on twos, the car at full rate
  const u = clamp(t / 1.5), dx = 1180 * (1 - u) ** 3, k = t - 1.5, g = d - 0.9;
  return {
    dx, spin: dx / 96,
    pitch: t < 1.5 ? -0.012 * ss(0.7, 1.5, t) : -0.012 * Math.exp(-k * 4) * Math.cos(k * 12),
    dHead: -0.1 + 0.2 * overshoot(2.1, 2.55, d) - 0.04 * bump(1.95, 2.15, d),
    blink: (d >= 1.85 && d < 1.95) || (d >= 3.05 && d < 3.15),
    brow: 8 * ss(3.55, 3.7, d), smile: 7 * ss(3.7, 3.85, d),
    head: -0.1 + 0.27 * overshoot(2.75, 3.2, d) + 0.05 * bump(4.15, 4.55, d),
    lean: 0.05 * ss(2.7, 3.3, d) - 0.006 * bump(2.55, 2.75, d),
    bag: (g > 0 ? 0.12 * Math.exp(-g * 2.2) * Math.sin(g * 9) : 0) - 0.05 * ss(2.7, 3.3, d),
    glint: 4 + 7 * bump(0.7, 1.25, d),
    window: d >= 3.4,
    boil: (Math.floor(t * 6) % 3) * 1.3,
  };
}

const polyOf = (fill: Tools['fill']) => (l: XY[], ink: Ink) => fill(l.map(([x, y]) => [x, y, 1] as Pt), ink);

export function paintBack(c: CanvasRenderingContext2D, I: StreetInks, W: number, H: number, moon = true) {
  const t = tools(c, { s: 1, ox: 0, oy: 0 }, W, H, I.black, I.noise, 2.2);
  const { fill, pen } = t, poly = polyOf(fill);
  // sky, moon, the far end of the street
  c.fillStyle = I.sky; c.fillRect(0, 0, W, H);
  if (moon) { c.beginPath(); c.arc(575, 345, 125, 0, 7); c.fillStyle = I.moon; c.fill(); }
  poly([[340, 1100], [340, 640], [430, 640], [430, 560], [520, 560], [520, 700], [640, 700], [640, 610], [770, 610], [770, 1100]], I.far);

  // two walls running to one vanishing point, low on the frame
  const quad = (P: Wall, u0: number, u1: number, v0: number, v1: number, ink: Ink) => poly(cell(P, u0, u1, v0, v1), ink);
  const D = 1.0;
  quad(L, 0, D, 0, 1, I.wallL); quad(R, 0, D, 0, 1, I.wallR);
  // windows: mostly dark, a handful awake
  const awakeL = new Set(['1,3', '3,2', '0,6', '4,5', '2,7', '5,3']), awakeR = new Set(['0,4', '2,3', '1,6', '3,5', '4,2', '2,8']);
  const windows = (P: Wall, awake: Set<string>, dark: Ink) => {
    for (let i = 0; i < 7; i++) for (let j = 1; j < 11; j++) {
      const u0 = 0.02 + i * 0.14, v0 = 0.02 + j * 0.092;
      quad(P, u0, u0 + 0.08, v0, v0 + 0.052, awake.has(`${i},${j}`) ? I.gold : dark);
    }
  };
  windows(L, awakeL, I.wallLdeep); windows(R, awakeR, I.wallRdeep);
  // ground: far pavement, side street, kerb, the road the taxi is on
  poly([[-20, 1150], [1100, 1150], [1100, 1262], [-20, 1262]], I.pave);
  poly([[VP[0] - 10, VP[1]], [VP[0] + 10, VP[1]], [840, 1160], [290, 1160]], I.road);
  poly([[-20, 1262], [1100, 1262], [1100, 1282], [-20, 1282]], I.paper);
  poly([[-20, 1282], [1100, 1282], [1100, 1940], [-20, 1940]], I.road);
  for (let x = -40; x < 1100; x += 300) poly([[x, 1712], [x + 170, 1706], [x + 176, 1726], [x + 6, 1732]], I.paper);

  // street lamp, its light a hard flat cone
  c.save(); c.globalAlpha = 0.16; poly([[262, 262], [318, 262], [560, 1262], [10, 1262]], I.moon); c.restore();
  pen([[92, 1270], [92, 700], [96, 340], [130, 236], [200, 212], [262, 236]], [20, 16, 13, 12, 11, 9], 3);
  poly([[238, 232], [342, 232], [324, 258], [256, 258]], I.black);
  poly([[256, 258], [324, 258], [316, 272], [264, 272]], I.gold);

}

function paintPassenger(c: CanvasRenderingContext2D, I: StreetInks, t: Tools, p: Pose) {
  const { fill, part, pen } = t, poly = polyOf(fill);
  // ---- the passenger: tall, a cloud of white hair, belted green coat, bag held in front ----
  c.save(); c.translate(300, 1290); c.rotate(p.lean); c.translate(-300, -1290);
  c.beginPath(); c.ellipse(296, 1252, 120, 9, 0, 0, 7); c.fillStyle = I.black; c.fill();
  poly([[232, 1200], [258, 1200], [256, 1244], [238, 1244]], I.black);                // legs and shoes
  poly([[322, 1200], [348, 1200], [346, 1244], [328, 1244]], I.black);
  fill([[234, 1236, 1], [258, 1236], [286, 1248], [288, 1256, 1], [234, 1256, 1]], I.gold, 2);
  fill([[324, 1236, 1], [348, 1236], [376, 1248], [378, 1256, 1], [324, 1256, 1]], I.gold, 2);
  const coat: Pt[] = [[222, 716], [290, 700], [352, 718], [388, 770], [394, 860], [364, 958, 1], [384, 1080], [408, 1205, 1], [182, 1205, 1], [196, 1080], [216, 958, 1], [194, 860], [194, 780]];
  t.edge(coat, 4, 4); fill(coat, I.green, 4);
  fill([[352, 718], [388, 770], [394, 860], [364, 958, 1], [384, 1080], [408, 1205, 1], [338, 1205, 1], [322, 1080], [318, 958, 1], [346, 840]], I.greenDeep, 5);
  pen([[300, 980], [296, 1120], [298, 1205]], [3, 3, 2], 6);                          // coat front
  poly([[214, 944], [366, 944], [362, 978], [216, 978]], I.greenDeep);               // belt
  pen([[214, 944], [366, 944]], [2, 2], 7); pen([[216, 978], [362, 978]], [2, 2], 8);
  // neck: three flat steps of light
  fill([[262, 712, 1], [280, 520, 1], [346, 530, 1], [326, 716, 1]], I.skinLit, 9);
  fill([[280, 520, 1], [346, 530, 1], [338, 620, 1], [272, 590, 1]], I.skinMid, 9);
  fill([[318, 528, 1], [346, 530, 1], [326, 716, 1], [304, 716, 1]], I.skinDeep, 10);
  pen([[281, 520], [262, 712]], [3, 3], 11); pen([[346, 530], [326, 716]], [3, 3], 12);
  // gold scarf
  fill([[238, 708, 1], [262, 682], [330, 688], [356, 712], [342, 740], [290, 750], [248, 738]], I.gold, 13);
  fill([[300, 746, 1], [342, 740], [356, 712], [348, 702, 1], [330, 724]], I.goldShade, 13);
  fill([[304, 746, 1], [338, 742, 1], [348, 846, 1], [304, 856, 1]], I.gold, 14);
  fill([[324, 744, 1], [338, 742, 1], [348, 846, 1], [330, 850, 1]], I.goldShade, 14);
  // arm bent across the coat, hand at the strap of a black bag
  c.save(); c.translate(356, 950); c.rotate(p.bag); c.translate(-356, -950);
  poly([[318, 1012], [410, 1012], [426, 1124], [304, 1124]], I.black);
  poly([[350, 1034], [378, 1034], [378, 1056], [350, 1056]], I.gold);
  pen([[330, 1014], [356, 950], [398, 1014]], [4, 4, 4], 15);
  c.restore();
  part([[372, 926], [344, 918], [332, 932], [336, 962], [360, 974], [380, 958]], I.skin, 3, 16);
  const arm: Pt[] = [[204, 748], [232, 730], [262, 760], [270, 890], [342, 912, 1], [346, 972, 1], [246, 972], [204, 930], [192, 840]];
  t.edge(arm, 3.5, 17); fill(arm, I.greenLit, 17);
  fill([[270, 890, 1], [342, 912, 1], [346, 972, 1], [246, 972], [224, 950], [266, 944, 1]], I.green, 18);
  pen([[330, 908], [334, 972]], [2, 2], 19);
  // head, tipped down toward the driver
  c.save(); c.translate(304, 590); c.rotate(p.head); c.translate(-304, -650);
  fill([[300, 368], [346, 380], [380, 420], [384, 470], [352, 500], [316, 520], [262, 550], [214, 530], [186, 480], [192, 420], [226, 384], [262, 366]], I.paper, 20);
  t.edge([[300, 368], [346, 380], [380, 420], [384, 470], [352, 500], [316, 520], [262, 550], [214, 530], [186, 480], [192, 420], [226, 384], [262, 366]], 3.5, 20);
  fill([[300, 368], [346, 380], [380, 420], [384, 470], [352, 500], [316, 520], [262, 550], [214, 530], [186, 480], [192, 420], [226, 384], [262, 366]], I.paper, 20);
  fill([[186, 480], [214, 530], [262, 550], [288, 530, 1], [262, 490], [222, 492]], I.grey, 21);
  const face: Pt[] = [[286, 434], [330, 424], [362, 438], [376, 462, 1], [420, 526, 1], [386, 536, 1], [394, 552], [380, 562], [386, 576], [362, 602], [316, 600], [284, 568], [268, 522], [270, 472]];
  t.edge(face, 3.2, 22); fill(face, I.skin, 22);
  fill([[376, 462, 1], [420, 526, 1], [386, 536, 1], [364, 502, 1]], I.skinMid, 23);
  fill([[284, 568], [316, 600], [362, 602], [376, 588, 1], [330, 572], [294, 526, 1], [270, 510, 1]], I.skinMid, 24);
  pen([[390, 556], [372, 558], [358, 552]], [2, 4, 1], 25);
  c.beginPath(); c.arc(336, 484, 30, 0, 7); c.fillStyle = I.gold; c.fill();
  c.beginPath(); c.arc(336, 484, 23, 0, 7); c.fillStyle = I.black; c.fill();
  c.beginPath(); c.arc(346, 474, p.glint, 0, 7); c.fillStyle = I.paper; c.fill();
  pen([[306, 478], [270, 470]], [4, 4], 26);
  fill([[364, 436], [330, 412], [284, 426], [262, 470], [262, 512], [236, 500], [228, 420], [290, 372], [346, 384]], I.paper, 27);
  pen([[364, 436], [330, 412], [284, 426], [262, 470], [262, 512]], [1, 3, 3, 3, 1], 28);
  c.beginPath(); c.arc(286, 582, 11, 0, 7); c.fillStyle = I.gold; c.fill();
  c.restore();
  c.restore();
}

function paintTaxi(c: CanvasRenderingContext2D, I: StreetInks, t: Tools, p: Pose) {
  const { fill, part, pen } = t, poly = polyOf(fill);
  // ---- the taxi: gold, side on, running off the frame ----
  c.save(); c.translate(p.dx, 0);
  c.beginPath(); c.ellipse(560, 1542, 640, 32, 0, 0, 7); c.fillStyle = I.black; c.fill();
  c.save(); c.translate(540, 1456); c.rotate(p.pitch); c.translate(-540, -1456);
  const body: Pt[] = [[-10, 1290, 1], [120, 1236], [300, 1214], [438, 1196], [476, 1150], [590, 958], [620, 944], [1120, 944, 1], [1120, 1500, 1], [-10, 1500, 1]];
  fill(body, I.gold, 20);
  pen([[-10, 1288], [120, 1234], [300, 1212], [438, 1194], [476, 1148], [590, 956], [620, 942], [1120, 942]], [4, 4, 4, 4, 4, 4, 4, 4], 21);
  fill([[-10, 1412, 1], [1120, 1394, 1], [1120, 1500, 1], [-10, 1500, 1]], I.goldShade, 22);
  poly([[-10, 1476], [1120, 1476], [1120, 1504], [-10, 1504]], I.goldDeep);
  // chequer band
  for (let i = 0; i < 24; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2 === 0) { const x = 440 + i * 30, y = 1312 + j * 28; poly([[x, y], [x + 30, y], [x + 30, y + 28], [x, y + 28]], I.black); }
  // glass
  fill([[480, 1182, 1], [600, 982, 1], [1120, 982, 1], [1120, 1192, 1]], I.black, 23);
  pen([[880, 982], [880, 1196]], [18, 18], 24);
  fill([[488, 1176, 1], [600, 990, 1], [640, 990, 1], [560, 1178, 1]], I.wallR, 25);    // windscreen catching the sky
  pen([[640, 980], [556, 1190]], [13, 15], 26);
  // roof sign
  part([[700, 868, 1], [950, 868, 1], [964, 944, 1], [686, 944, 1]], I.paper, 4, 27);
  c.fillStyle = I.black; c.font = '900 56px Helvetica, Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TAXI', 825, 910);
  // lamps
  fill([[10, 1296], [64, 1272], [86, 1306], [40, 1336]], I.moon, 28);
  // wing mirror, door lines, handle
  pen([[446, 1150], [500, 1136]], [6, 6], 47);
  part([[478, 1128, 1], [448, 1118], [430, 1132], [436, 1160], [474, 1164, 1]], I.goldShade, 3, 42);
  pen([[880, 1200], [880, 1476]], [3, 3], 29); pen([[560, 1200], [556, 1476]], [3, 3], 30);
  poly([[780, 1250], [840, 1248], [840, 1262], [780, 1264]], I.black);

  // ---- the driver: round, white moustache, elbow on the door, looking up at her ----
  fill([[724, 1196, 1], [744, 1134], [792, 1098], [850, 1106], [872, 1196, 1]], I.paper, 31);     // shirt
  fill([[812, 1100, 1], [850, 1106], [872, 1196, 1], [824, 1196, 1]], I.grey, 31);
  fill([[706, 1120, 1], [792, 1110, 1], [806, 1168, 1], [738, 1176, 1]], I.skinDeep, 31);         // neck
  c.save(); c.translate(752, 1130); c.rotate(p.dHead); c.translate(-752, -1130);
  const head: Pt[] = [[640, 1120], [640, 1040], [672, 990], [730, 974], [790, 996], [812, 1050], [804, 1110], [770, 1148], [700, 1160]];
  part(head, I.skin, 3.5, 32);
  fill([[742, 1156, 1], [770, 1148], [804, 1110], [812, 1050], [790, 996], [760, 984, 1], [762, 1060]], I.skinMid, 32);
  // nose: a bulb, its underside in shadow
  const nose: Pt[] = [[668, 1030, 1], [622, 1022], [586, 1030], [566, 1058], [584, 1084], [626, 1088], [668, 1084, 1]];
  part(nose, I.skin, 3.2, 33);
  fill([[566, 1058], [584, 1084], [626, 1088], [668, 1084, 1], [664, 1064, 1], [612, 1068]], I.skinMid, 33);
  pen([[606, 1080], [622, 1072], [636, 1078]], [1, 5, 1], 43);
  // moustache, brow, eye, ear
  c.save(); c.translate(0, -p.smile); fill([[682, 1078, 1], [640, 1090], [606, 1110], [590, 1140], [634, 1130], [672, 1118], [704, 1128], [716, 1104]], I.paper, 34); c.restore();
  c.save(); c.translate(0, -p.brow);
  pen([[644, 1010], [684, 998], [712, 1014]], [3, 11, 4], 35);
  c.restore();
  if (p.blink) pen([[668, 1034], [688, 1034]], [2, 4], 48);
  else { c.beginPath(); c.arc(678, 1032, 8, 0, 7); c.fillStyle = I.black; c.fill(); }
  part([[766, 1042], [792, 1048], [796, 1078], [776, 1094], [762, 1072]], I.skin, 3, 36);
  // cap
  part([[646, 996, 1], [660, 960], [710, 932], [776, 936], [812, 968], [814, 1006, 1], [730, 972]], I.green, 3.5, 37);
  fill([[780, 938], [812, 968], [814, 1006, 1], [772, 986, 1]], I.greenDeep, 37);
  part([[652, 996, 1], [596, 1000], [586, 988], [640, 972], [668, 978, 1]], I.black, 2, 38);
  c.restore();
  // upper arm in its sleeve, forearm along the door, hand over the edge
  const fore: Pt[] = [[752, 1160, 1], [768, 1214, 1], [640, 1218], [606, 1216, 1], [604, 1170, 1], [660, 1164]];
  part(fore, I.skin, 3, 40);
  fill([[768, 1214, 1], [640, 1218], [606, 1216, 1], [606, 1198, 1], [660, 1200], [762, 1192, 1]], I.skinMid, 40);
  const hand: Pt[] = [[616, 1166], [582, 1168], [564, 1190], [566, 1236], [582, 1246], [602, 1240], [622, 1216]];
  part(hand, I.skin, 3, 44);
  pen([[580, 1206], [582, 1242]], [1, 2.6], 45); pen([[598, 1208], [598, 1238]], [1, 2.6], 46);
  const sleeve: Pt[] = [[796, 1102, 1], [846, 1132], [804, 1212, 1], [730, 1212, 1], [716, 1176, 1], [758, 1130]];
  part(sleeve, I.paper, 3.2, 41);
  fill([[846, 1132], [804, 1212, 1], [772, 1212, 1], [816, 1124, 1]], I.grey, 41);

  c.restore();

  // wheels
  for (const x of [280, 960]) {
    c.beginPath(); c.arc(x, 1456, 124, Math.PI, 0); c.fillStyle = I.black; c.fill();
    c.beginPath(); c.arc(x, 1456, 96, 0, 7); c.fillStyle = '#16121A'; c.fill();
    c.beginPath(); c.arc(x, 1456, 50, 0, 7); c.fillStyle = I.grey; c.fill();
    c.save(); c.beginPath(); c.arc(x, 1456, 50, 0, 7); c.clip();
    c.beginPath(); c.arc(x - 14, 1442, 50, 0, 7); c.fillStyle = I.paper; c.fill(); c.restore();
    for (let k = 0; k < 5; k++) { const w = p.spin + k * 1.2566; c.beginPath(); c.arc(x + 30 * Math.cos(w), 1456 + 30 * Math.sin(w), 6, 0, 7); c.fillStyle = I.black; c.fill(); }
  }
  c.restore();
}

let back: HTMLCanvasElement | null = null;

export function drawStreet(c: CanvasRenderingContext2D, I: StreetInks, W: number, H: number, time: number) {
  if (!back) { back = document.createElement('canvas'); back.width = W; back.height = H; paintBack(back.getContext('2d')!, I, W, H); }
  const p = poseAt(time), t = tools(c, { s: 1, ox: 0, oy: 0 }, W, H, I.black, I.noise, 2.2, p.boil);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.drawImage(back, 0, 0);
  if (p.window) polyOf(t.fill)(cell(R, 0.3, 0.38, 0.388, 0.44), I.gold);   // someone upstairs turns a light on
  paintPassenger(c, I, t, p);
  paintTaxi(c, I, t, p);
}
