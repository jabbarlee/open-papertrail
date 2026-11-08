// Backdrops: a primed canvas, a wall knifed over it in broken patches (the ground shows through in dotted islands),
// and an optional floor band dragged horizontally. Frame coordinates, painted once per page.
import { knife, pick, rng, fbm, lerp, stroke, ribbon, T_KNIFE, type P } from './paint.ts';
import { sprite, W, H, type Sprite } from './studio.ts';

export interface SetPalette {
  ground: string;            // the primed canvas
  groundVar: string[];
  wall: string[]; wallLight: string[]; wallDark: string[];
  floor?: { y: number; base: string; mid: string[]; light: string[]; dark: string[] };
  openness?: number;         // how much ground stays open, 0..0.2
  scumble?: number;          // how many dry ground-colour drags go back over the wall
  seed: number;
}

export const SETS: Record<string, SetPalette> = {
  // the reference look: blue-grey over cream, sand floor
  gallery: {
    ground: '#E4D8C5', groundVar: ['#E6D9C6', '#E9DCCA', '#DED5C6'], seed: 11,
    wall: ['#ACA597', '#A59D90', '#B1AB9F', '#A8A397', '#9FA4A0'], wallLight: ['#C4B8A4', '#C9C3B6', '#CFC8BB'], wallDark: ['#9A9488', '#8F9490'],
    floor: { y: 1540, base: '#DDBB8F', mid: ['#D8B58C', '#D4AE7E', '#E6CAAB'], light: ['#F2E0CB', '#E4CBAF'], dark: ['#AE8C73', '#8D6743'] },
  },
  // a smoky dye works: ochre stone, dark earth
  works: {
    scumble: 50, ground: '#C9B08A', groundVar: ['#CFB690', '#C2A983'], seed: 23, openness: -0.06,
    wall: ['#A88A62', '#9C7E58', '#B0926A', '#957754'], wallLight: ['#C8AE86', '#BFA47C'], wallDark: ['#7C6448', '#6E5840'],
    floor: { y: 1500, base: '#5E4B3C', mid: ['#665040', '#574536', '#6E5A48'], light: ['#8C735C', '#7D6650'], dark: ['#3E3128', '#463629'] },
  },
  // Rome: terracotta plaster, pale stone floor
  rome: {
    scumble: 50, ground: '#C98B6E', groundVar: ['#CF9478', '#C4856A'], seed: 31, openness: -0.05,
    wall: ['#B5654A', '#AC5D44', '#BD6F52', '#A65840'], wallLight: ['#CF8A6C', '#C98266'], wallDark: ['#8E4835', '#984E39'],
    floor: { y: 1560, base: '#C9BFAE', mid: ['#C3B8A6', '#CEC4B3', '#BDB2A0'], light: ['#E3DBCC', '#DAD1C1'], dark: ['#9F9483', '#A89D8B'] },
  },
  // a Victorian bench room: dark green-grey, wood floor
  lab: {
    scumble: 50, ground: '#8E9A8E', groundVar: ['#96A296', '#889488'], seed: 41, openness: -0.04,
    wall: ['#5F6D61', '#566457', '#67756A', '#5A6A60'], wallLight: ['#7F8C80', '#77857A'], wallDark: ['#46524A', '#3F4A42'],
    floor: { y: 1600, base: '#5A3F2C', mid: ['#62452F', '#563C29', '#6B4C35'], light: ['#7E5C40', '#86634A'], dark: ['#3E2A1D', '#452F20'] },
  },
  // a plain wall for close inserts
  insert: {
    scumble: 50, ground: '#9AA59C', groundVar: ['#A2ACA2', '#929D94'], seed: 51,
    wall: ['#6C7A70', '#647268', '#74827A'], wallLight: ['#8A978D', '#839087'], wallDark: ['#526058', '#4C5951'],
  },
  // London: pale fog wall, cobble-grey floor
  street: {
    scumble: 50, ground: '#E6DDCC', groundVar: ['#E8DFCE', '#E0D6C4'], seed: 61,
    wall: ['#B9B6AA', '#B2AFA4', '#C1BEB2', '#ABA89E'], wallLight: ['#D2CEC2', '#CCC8BC'], wallDark: ['#9C998F', '#959288'],
    floor: { y: 1580, base: '#8E8A80', mid: ['#96928A', '#88847B', '#9E9A91'], light: ['#B5B1A7', '#ABA79D'], dark: ['#6E6A63', '#76726A'] },
  },
  // the palace: dusty rose, pale floor
  palace: {
    scumble: 50, ground: '#E3CCC6', groundVar: ['#E7D2CC', '#DCC4BE'], seed: 71,
    wall: ['#C7A1A0', '#BF9796', '#CEAAA8', '#B88F8F'], wallLight: ['#DDBDB9', '#D7B5B1'], wallDark: ['#A47E7F', '#9C7677'],
    floor: { y: 1600, base: '#D9CBB4', mid: ['#D3C4AC', '#DDD0BA'], light: ['#EDE3D2', '#E6DBC8'], dark: ['#B5A68F', '#AC9C85'] },
  },
  // the dye factory yard: smoky sky
  yard: {
    scumble: 50, ground: '#E3DCCD', groundVar: ['#E5DECF', '#DDD5C5'], seed: 81,
    wall: ['#A9AFAE', '#A1A8A8', '#B3B8B6', '#9AA1A2'], wallLight: ['#C9CCC8', '#C2C6C2'], wallDark: ['#8C9394', '#848B8C'],
    floor: { y: 1640, base: '#6F655A', mid: ['#776C60', '#695F54'], light: ['#91877A', '#8A8073'], dark: ['#50483F', '#584F45'] },
  },
  // the pharmacy: cream plaster
  pharmacy: {
    scumble: 50, ground: '#ECE2CF', groundVar: ['#EEE4D1', '#E6DBC6'], seed: 91,
    wall: ['#D9CDB3', '#D2C5AA', '#DED3BB', '#CDBFA3'], wallLight: ['#EAE1CE', '#E5DBC6'], wallDark: ['#B9AB8F', '#B0A286'],
  },
  // a dark apothecary: olive-brown wood panelling
  apothecary: {
    scumble: 40, ground: '#8A7A5E', groundVar: ['#907F62', '#83735A'], seed: 101, openness: -0.05,
    wall: ['#5E5038', '#665840', '#574A33', '#6E6046'], wallLight: ['#857558', '#7C6C50'], wallDark: ['#463B29', '#3E3424'],
    floor: { y: 1620, base: '#4A3828', mid: ['#523E2C', '#463424'], light: ['#6A5038', '#624A34'], dark: ['#30241A', '#2A2016'] },
  },
  // a painter's studio: warm grey-ochre, bare boards
  studio: {
    scumble: 60, ground: '#D8C9A8', groundVar: ['#DCCEAE', '#D2C2A0'], seed: 111,
    wall: ['#B9A684', '#B19E7C', '#C2AF8D', '#A99676'], wallLight: ['#D3C3A2', '#CCBC9A'], wallDark: ['#968466', '#8C7A5E'],
    floor: { y: 1600, base: '#8A6A4A', mid: ['#92714F', '#836346', '#9A7856'], light: ['#B08E6A', '#A88664'], dark: ['#5E4630', '#664C34'] },
  },
  // the garden: hedge green, turned earth
  garden: {
    scumble: 40, ground: '#9DAE88', groundVar: ['#A3B48E', '#96A882'], seed: 121, openness: -0.06,
    wall: ['#6F8A5A', '#5E7A4C', '#7A9464', '#678254'], wallLight: ['#93AA7A', '#8AA272'], wallDark: ['#4E6640', '#465C38'],
    floor: { y: 1560, base: '#6E5238', mid: ['#765A3E', '#664A32', '#7E6044'], light: ['#94785A', '#8C7052'], dark: ['#4A3624', '#40301F'] },
  },
  // the colour shop: deep red-brown walls
  colourshop: {
    scumble: 40, ground: '#B58E78', groundVar: ['#BA947E', '#AE8872'], seed: 131, openness: -0.05,
    wall: ['#8A5A48', '#7E5040', '#94644F', '#744A3B'], wallLight: ['#A9786A', '#A27264'], wallDark: ['#643E31', '#5C392D'],
  },
  // 1964: a pale grey-green office, lino floor
  office: {
    scumble: 50, ground: '#C8CDBE', groundVar: ['#CDD2C3', '#C2C8B8'], seed: 141,
    wall: ['#A9B2A4', '#A1AA9C', '#B1BAAC', '#9AA396'], wallLight: ['#C3CABE', '#BDC4B7'], wallDark: ['#89928A', '#828B82'],
    floor: { y: 1620, base: '#8C8678', mid: ['#948E80', '#868072'], light: ['#ABA598', '#A49E90'], dark: ['#6C675C', '#666155'] },
  },
  // a church: cool stone, dark pew-wood floor
  church: {
    scumble: 50, ground: '#C9C4B6', groundVar: ['#CEC9BB', '#C2BDAF'], seed: 151,
    wall: ['#9C9A92', '#94928A', '#A5A39A', '#8C8A83'], wallLight: ['#BAB7AD', '#B3B0A6'], wallDark: ['#76746D', '#6E6C66'],
    floor: { y: 1600, base: '#4E3A2A', mid: ['#563F2D', '#4A3626', '#5E4632'], light: ['#76593F', '#6E5239'], dark: ['#32241A', '#2C2016'] },
  },
  // a kitchen: warm butter plaster, pale tiles
  kitchen: {
    scumble: 50, ground: '#E9DFC6', groundVar: ['#ECE2CA', '#E3D8BD'], seed: 161,
    wall: ['#D9C79A', '#D1BE90', '#E0CFA4', '#C9B686'], wallLight: ['#EBDEBC', '#E5D7B3'], wallDark: ['#B7A479', '#AE9B70'],
    floor: { y: 1640, base: '#B9B4A6', mid: ['#C1BCAE', '#B2AD9F'], light: ['#D6D1C4', '#CFCABD'], dark: ['#8E897C', '#888376'] },
  },

};

const X0 = -20, X1 = W + 20, Y0 = -20, Y1 = H + 20;

export function backdrop(name: keyof typeof SETS | string): Sprite {
  const P = SETS[name];
  return sprite(`set:${name}`, [0, 0, W, H], sp => {
    const r = rng(P.seed);
    const floorY = P.floor?.y ?? H + 40;
    sp.pass({ dry: 0.15, relief: 0.25 }, g => {
      g.fillStyle = P.ground; g.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
      for (let i = 0; i < 500; i++) knife(g, r, lerp(X0, X1, r()), lerp(Y0, Y1, r()), (r() - 0.5) * 1.2, 90 + r() * 170, 50 + r() * 70, pick(r, P.groundVar), { load: 0.5 });
    });
    const open = (x: number, y: number) => fbm(x / 220, y / 170, P.seed + 10, 3) + (P.openness ?? 0.04);
    sp.pass({ dry: 0.9, relief: 0.6, gain: 1.05, patch: 0.5, soften: 2.2 }, g => {
      for (let k = 0; k < 3; k++) {
        const N = [950, 850, 420][k];
        for (let i = 0; i < N; i++) {
          const x = lerp(X0, X1, r()), y = lerp(Y0, floorY + 20, r());
          if (open(x, y) > 0.58 + k * 0.03 && r() < 0.85) continue;
          const ang = (r() < 0.75 ? (r() - 0.5) * 0.9 : Math.PI / 2 + (r() - 0.5) * 0.8) + (fbm(x / 300, y / 300, P.seed + 11, 2) - 0.5) * 1.2;
          const col = k === 2 ? pick(r, r() < 0.7 ? P.wallLight : P.wallDark) : pick(r, P.wall);
          knife(g, r, x, y, ang, 85 + r() * 200, 48 + r() * 90, col, { load: 0.55 + r() * 0.4, fade: 0.75 });
        }
      }
    });
    sp.pass({ dry: 1, relief: 0.5, gain: 1.0, patch: 0.5, soften: 1.6 }, g => {
      for (let i = 0; i < (P.scumble ?? 170); i++) {
        const x = lerp(X0, X1, r()), y = lerp(Y0, floorY, r());
        if (open(x, y) < 0.5 && r() < 0.7) continue;
        knife(g, r, x, y, (r() - 0.5) * 1.4, 70 + r() * 150, 40 + r() * 70, pick(r, P.groundVar), { load: 0.4 + r() * 0.35, fade: 0.7 });
      }
    });
    const F = P.floor;
    if (F) {
      const hz = (x: number) => F.y + Math.sin(x * 0.012) * 4 + (fbm(x * 0.02, 0, P.seed + 12, 2) - 0.5) * 12;
      sp.pass({ dry: 0.75, relief: 0.25, patch: 0.4, soften: 1.4 }, g => {
        const poly: P[] = [];
        for (let x = X0; x <= X1; x += 12) poly.push([x, hz(x)]);
        poly.push([X1, Y1], [X0, Y1]);
        g.save(); g.beginPath(); poly.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
        g.fillStyle = F.base; g.fillRect(X0, F.y - 30, X1 - X0, Y1 - F.y + 30);
        for (let i = 0; i < 520; i++) knife(g, r, lerp(X0, X1, r()), lerp(F.y - 10, Y1, r()), (r() - 0.5) * 0.25, 80 + r() * 220, 22 + r() * 44, pick(r, F.mid), { load: 0.8, fade: 0.5 });
        for (let i = 0; i < 260; i++) knife(g, r, lerp(X0, X1, r()), lerp(F.y, Y1, r()), (r() - 0.5) * 0.2, 60 + r() * 180, 16 + r() * 34, pick(r, F.light), { load: 0.55 + r() * 0.4, fade: 0.7 });
        for (let i = 0; i < 60; i++) knife(g, r, lerp(X0, X1, r()), lerp(F.y + 10, Y1, r()), (r() - 0.5) * 0.15, 40 + r() * 130, 5 + r() * 12, pick(r, F.dark), { load: 0.45, fade: 0.85 });
        g.restore();
      });
    }
  });
}

/** A soft painted contact shadow on the floor under a figure or object. */
export function shadow(key: string, cx: number, cy: number, w: number, color = '#3A2E26') {
  return sprite(`shadow:${key}`, [cx - w / 2 - 30, cy - 40, cx + w / 2 + 30, cy + 40], sp => {
    const r = rng(cx + cy);
    sp.pass({ dry: 0.85, relief: 0.1, patch: 0.4, soften: 3, opacity: 0.5 }, g => {
      for (let i = 0; i < 9; i++) stroke(g, r, [[cx - w / 2 + r() * 40, cy + (r() - 0.5) * 18], [cx + w / 2 - r() * 40, cy + (r() - 0.5) * 18]], 8 + r() * 12, color, { taper: T_KNIFE, load: 0.6, fade: 0.8, coherence: 0.8 });
      ribbon(g, r, [[cx - w * 0.4, cy], [cx + w * 0.4, cy + 2]], 14, color, { load: 0.5, fade: 0.6 });
    });
  });
}
