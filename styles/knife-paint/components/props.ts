// Props, painted like everything else: murex shells, the dye vat, stink and steam, flasks and their liquids, a bottle,
// a cloth, the factory, the pharmacy. Frame coordinates.
import { stroke, ribbon, line, fillPoly, fillStrokes, rough, smooth, pick, rng, lerp, pathOf, knife, T_POINT, T_KNIFE, type C, type P } from './paint.ts';
import { sprite, type Sprite } from './studio.ts';
import { garment, CLOTH } from './cast.ts';

// ---------- murex shell: a spiny spiral, cream with brown bands, a long canal ----------
export function shell(k: number, size = 70): Sprite {
  const cx = 200, cy = 200; // painted at a fixed home, placed by put()
  return sprite(`shell:${k}:${size}`, [cx - size, cy - size, cx + size, cy + size], sp => {
    const r = rng(500 + k), s = size / 70;
    const body: P[] = [[-30, -6], [-18, -26], [6, -32], [26, -20], [32, 0], [22, 18], [8, 26], [-4, 56], [-10, 58], [-12, 26], [-28, 14]].map(([x, y]) => [cx + x * s, cy + y * s]);
    sp.pass({ dry: 0.25, relief: 0.6, soften: 0.8 }, g => {
      fillPoly(g, smooth(body, 2, true), pick(r, ['#D9C7A6', '#CDB58E', '#E2D3B6']));
      for (let i = 0; i < 4; i++) stroke(g, r, [[cx - 28 * s, cy + (-16 + i * 9) * s], [cx, cy + (-12 + i * 10) * s], [cx + 28 * s, cy + (-18 + i * 9) * s]], 4 * s, pick(r, ['#8A5A3A', '#7A4A2E', '#9C6A44']), { load: 0.8, fade: 0.3 });
    });
    sp.pass({ dry: 0.1, relief: 0.5 }, g => {
      // spines
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI * 0.85 + i * 0.42, rx = 30 * s, ry = 28 * s;
        const bx = cx + Math.cos(a) * rx, by = cy - 2 * s + Math.sin(a) * ry;
        line(g, [[bx, by], [bx + Math.cos(a) * 14 * s, by + Math.sin(a) * 14 * s]], 5 * s, 0.8, '#B29470');
      }
      // aperture: a dark purple-brown mouth
      fillPoly(g, smooth([[cx + 6 * s, cy - 12 * s], [cx + 18 * s, cy - 4 * s], [cx + 12 * s, cy + 12 * s], [cx + 2 * s, cy + 8 * s]], 1.5, true), '#B98A78');
      line(g, [[cx - 8 * s, cy - 30 * s], [cx - 2 * s, cy - 40 * s]], 6 * s, 1, '#C9B48F');
    });
  });
}

// ---------- the dye vat: a stone tub on a fire, purple-brown broth ----------
export function vat(x: number, y: number): Sprite {
  return sprite(`vat:${x}:${y}`, [x - 330, y - 300, x + 330, y + 260], sp => {
    const r = rng(77);
    // fire glow + logs
    sp.pass({ dry: 0.4, relief: 0.4, soften: 2 }, g => {
      for (let i = 0; i < 26; i++) stroke(g, r, [[x - 200 + r() * 400, y + 230], [x - 150 + r() * 300, y + 120 + r() * 60]], 14 + r() * 18, pick(r, ['#E0A04A', '#D2742E', '#E8C068', '#C4562A']), { taper: T_POINT, load: 0.85, fade: 0.4 });
      for (let i = 0; i < 5; i++) ribbon(g, r, [[x - 220 + i * 90, y + 245], [x - 140 + i * 90, y + 215]], 22, pick(r, ['#3A2618', '#2E1E14']), { load: 1 });
    });
    const tub: P[] = [[x - 280, y - 200], [x + 280, y - 200], [x + 250, y + 40], [x + 200, y + 170], [x - 200, y + 170], [x - 250, y + 40]];
    sp.pass({ dry: 0.5, relief: 0.6, patch: 0.3, soften: 1.2 }, g => {
      fillPoly(g, smooth(rough(tub, 4, 78, 0.04), 3, true), '#8D8478');
      g.save(); pathOf(g, tub); g.clip();
      for (let i = 0; i < 90; i++) knife(g, r, x - 280 + r() * 560, y - 200 + r() * 370, (r() - 0.5) * 0.5, 60 + r() * 100, 22 + r() * 30, pick(r, ['#958C80', '#7F776C', '#A39A8D', '#6E675E']), { load: 0.8 });
      for (let i = 0; i < 6; i++) ribbon(g, r, [[x - 260, y - 120 + i * 50], [x + 260, y - 130 + i * 52]], 6, '#5E574F', { load: 0.7, fade: 0.5 });
      g.restore();
    });
    sp.pass({ dry: 0.3, relief: 0.6, soften: 1.5 }, g => {
      // rim and broth
      fillPoly(g, smooth([[x - 290, y - 205], [x - 200, y - 245], [x, y - 258], [x + 200, y - 245], [x + 290, y - 205], [x + 200, y - 175], [x, y - 168], [x - 200, y - 175]], 3, true), '#A39A8E');
      fillPoly(g, smooth([[x - 250, y - 208], [x - 170, y - 236], [x, y - 245], [x + 170, y - 236], [x + 250, y - 208], [x + 170, y - 186], [x, y - 180], [x - 170, y - 186]], 3, true), '#4A2236');
      for (let i = 0; i < 14; i++) stroke(g, r, [[x - 220 + r() * 400, y - 215 + r() * 20], [x - 180 + r() * 400, y - 212 + r() * 20]], 6, pick(r, ['#6A3050', '#5A2A44', '#7A4060']), { load: 0.8 });
    });
  });
}

// ---------- wisps: stink (grey-green) or steam (cream), painted once, drifted by put() ----------
export function wisp(k: number, color: string, x: number, y: number, h = 260): Sprite {
  return sprite(`wisp:${k}:${color}`, [x - 90, y - h - 20, x + 90, y + 20], sp => {
    const r = rng(900 + k);
    sp.pass({ dry: 0.85, relief: 0.2, soften: 3, patch: 0.4, opacity: 0.7 }, g => {
      const pts: P[] = []; for (let i = 0; i <= 6; i++) pts.push([x + Math.sin(i * 1.3 + k) * 40, y - i * h / 6]);
      stroke(g, r, pts, 34, color, { taper: T_POINT, load: 0.7, fade: 0.6, coherence: 0.8 });
      stroke(g, r, pts.map(([a, b]) => [a + 14, b - 10] as P), 16, color, { taper: T_POINT, load: 0.5, fade: 0.7, coherence: 0.8 });
    });
  });
}

// ---------- glass ----------
/** A round-bottom flask: bulb centre (x, y), radius R; long neck up. Glass only (liquid is separate). */
export function flaskPoly(x: number, y: number, R: number): P[] {
  const pts: P[] = [], nw = R * 0.24, nh = R * 1.5;
  for (let i = 0; i <= 40; i++) { const a = -Math.PI / 2 + Math.asin(nw / R) + i / 40 * (2 * Math.PI - 2 * Math.asin(nw / R)); pts.push([x + Math.cos(a) * R, y + Math.sin(a) * R]); }
  pts.push([x - nw, y - R * Math.cos(Math.asin(nw / R))], [x - nw, y - R - nh], [x - nw * 1.4, y - R - nh - R * 0.08], [x + nw * 1.4, y - R - nh - R * 0.08], [x + nw, y - R - nh]);
  return pts;
}
export function flaskGlass(key: string, x: number, y: number, R: number): Sprite {
  const poly = flaskPoly(x, y, R);
  return sprite(`flask:${key}`, [x - R - 30, y - R * 2.8, x + R + 30, y + R + 30], sp => {
    const r = rng(R);
    sp.pass({ dry: 0.2, relief: 0.3, soften: 1, opacity: 0.1 }, g => fillPoly(g, poly, '#E6E8E0'));
    sp.pass({ dry: 0.15, relief: 0.4 }, g => {
      g.save(); pathOf(g, poly); g.lineWidth = Math.max(2, R * 0.03); g.strokeStyle = '#3E4440'; g.globalAlpha = 0.8; g.stroke(); g.restore();
      // highlights
      const hl: P[] = []; for (let i = 0; i <= 8; i++) { const a = Math.PI * (1.1 + i / 8 * 0.35); hl.push([x + Math.cos(a) * R * 0.78, y + Math.sin(a) * R * 0.78]); }
      line(g, hl, R * 0.06, R * 0.02, '#FAF7EE', 0.9);
      line(g, [[x - R * 0.14, y - R * 1.1], [x - R * 0.14, y - R * 2.2]], R * 0.04, R * 0.02, '#FAF7EE', 0.8);
      void r;
    });
  });
}
/** Liquid in the flask bulb up to `level` (0..1 of the bulb), one colour family. */
export function liquid(key: string, x: number, y: number, R: number, level: number, cols: string[], dark: string): Sprite {
  return sprite(`liquid:${key}`, [x - R, y - R, x + R, y + R], sp => {
    const r = rng(key.length * 31 + R);
    const top = y + R - 2 * R * level;
    sp.pass({ dry: 0.2, relief: 0.5, soften: 1.5 }, g => {
      g.save(); g.beginPath(); g.arc(x, y, R * 0.965, 0, Math.PI * 2); g.clip();
      g.fillStyle = cols[0]; g.fillRect(x - R, top, 2 * R, 2 * R);
      for (let i = 0; i < 40; i++) knife(g, r, x - R + r() * 2 * R, top + r() * (y + R - top), (r() - 0.5) * 0.6, R * 0.5, R * 0.18, pick(r, cols), { load: 0.7 });
      for (let i = 0; i < 6; i++) ribbon(g, r, [[x - R, y + R * 0.6 + i * 6], [x + R, y + R * 0.7 + i * 6]], R * 0.12, dark, { load: 0.6, fade: 0.4 });
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x - R, top - 3, 2 * R, R * 0.04);
      g.restore();
    });
  });
}

/** A bottle (alcohol in s07, aspirin in s13). Tall body, shoulder, neck; optional label text. */
export function bottle(key: string, x: number, y: number, h: number, glass: string, label?: { text: string; sub?: string; paper: string; ink: string }): Sprite {
  const w = h * 0.42;
  return sprite(`bottle:${key}`, [x - w / 2 - 20, y - h - 20, x + w / 2 + 20, y + 20], sp => {
    const r = rng(h);
    const body: P[] = [[x - w / 2, y], [x - w / 2, y - h * 0.6], [x - w * 0.42, y - h * 0.7], [x - w * 0.18, y - h * 0.78], [x - w * 0.16, y - h * 0.93], [x - w * 0.2, y - h], [x + w * 0.2, y - h], [x + w * 0.16, y - h * 0.93], [x + w * 0.18, y - h * 0.78], [x + w * 0.42, y - h * 0.7], [x + w / 2, y - h * 0.6], [x + w / 2, y]];
    sp.pass({ dry: 0.25, relief: 0.5, soften: 1 }, g => {
      fillPoly(g, smooth(body, 2, true), glass);
      g.save(); pathOf(g, body); g.clip();
      for (let i = 0; i < 18; i++) stroke(g, r, [[x - w / 2 + r() * w, y - h], [x - w / 2 + r() * w, y]], 10 + r() * 10, glass, { load: 0.5, colorVar: 0.06 });
      g.restore();
      line(g, [[x - w * 0.32, y - h * 0.08], [x - w * 0.32, y - h * 0.58]], w * 0.07, w * 0.04, '#F4EFE3', 0.75);
      fillPoly(g, [[x - w * 0.22, y - h - 2], [x + w * 0.22, y - h - 2], [x + w * 0.2, y - h * 1.07], [x - w * 0.2, y - h * 1.07]], '#3A2A20');
    });
    if (label) sp.pass({ dry: 0.3, relief: 0.4 }, g => {
      const ly = y - h * 0.5, lh = h * 0.28;
      fillPoly(g, [[x - w * 0.44, ly - lh / 2], [x + w * 0.44, ly - lh / 2], [x + w * 0.44, ly + lh / 2], [x - w * 0.44, ly + lh / 2]], label.paper);
      g.fillStyle = label.ink; g.textAlign = 'center';
      g.font = `italic ${Math.round(lh * 0.34)}px "Instrument Serif"`; g.fillText(label.text, x, ly + lh * 0.08);
      if (label.sub) { g.font = `${Math.round(lh * 0.17)}px "Instrument Serif"`; g.fillText(label.sub, x, ly + lh * 0.34); }
      g.textAlign = 'left';
    });
  });
}

/** A length of cloth hanging from two hands, or falling. */
export function cloth(key: string, x: number, y: number, w: number, h: number, pal = CLOTH.tyrian): Sprite {
  return sprite(`cloth:${key}`, [x - w / 2 - 20, y - 20, x + w / 2 + 20, y + h + 20], sp => {
    garment(sp, x, y, 1, false, [[-w / 2, 0], [w / 2, 0], [w / 2 + 12, h * 0.7], [w / 2 - 10, h], [w / 4, h - 18], [0, h + 6], [-w / 4, h - 14], [-w / 2 + 6, h], [-w / 2 - 12, h * 0.7]],
      { pal, seed: key.length * 7, folds: [[[-w / 4, 6], [-w / 5, h * 0.6], [-w / 4, h - 10]], [[w / 6, 6], [w / 5, h * 0.5], [w / 4, h - 12]], [[-6, 10], [0, h * 0.7]]], foldW: [8, 16], dir: () => Math.PI / 2 });
  });
}

/** A wooden bench top (front edge at y) across the frame, with a few glass things on it. */
export function bench(y: number): Sprite {
  return sprite(`bench:${y}`, [-20, y - 160, 1100, 1940], sp => {
    const r = rng(y);
    sp.pass({ dry: 0.35, relief: 0.5, soften: 1.2, patch: 0.2 }, g => {
      fillPoly(g, [[-20, y - 30], [1100, y - 40], [1100, 1940], [-20, 1940]], '#4E3424');
      for (let i = 0; i < 160; i++) knife(g, r, r() * 1100, y - 20 + r() * (1940 - y), (r() - 0.5) * 0.08, 120 + r() * 240, 14 + r() * 26, pick(r, ['#5A3D2A', '#4A3122', '#63452F', '#3F2A1C']), { load: 0.85, fade: 0.4 });
      ribbon(g, r, [[-20, y - 36], [540, y - 40], [1100, y - 44]], 16, '#7A5A40', { load: 1, fade: 0.1, ragged: 0.1 });
    });
    // test tubes in a rack and a small bottle at the left
    sp.pass({ dry: 0.2, relief: 0.4 }, g => {
      fillPoly(g, [[60, y - 70], [250, y - 70], [250, y - 50], [60, y - 50]], '#6B4A32');
      for (let i = 0; i < 4; i++) {
        const tx = 85 + i * 45;
        fillPoly(g, [[tx - 9, y - 150], [tx + 9, y - 150], [tx + 9, y - 66], [tx - 9, y - 66]], 'rgba(226,230,222,0.55)');
        fillPoly(g, [[tx - 8, y - 100], [tx + 8, y - 100], [tx + 8, y - 68], [tx - 8, y - 68]], pick(r, ['#8A7A4A', '#3E4A36', '#5A3A2A', '#7A6A5A']));
        line(g, [[tx - 9, y - 150], [tx - 9, y - 66]], 2, 2, '#3E4440', 0.7);
      }
    });
  });
}

/** A spirit lamp with a small flame (the flame is drawn per drawing by the shot). */
export function lamp(x: number, y: number): Sprite {
  return sprite(`lamp:${x}:${y}`, [x - 70, y - 120, x + 70, y + 10], sp => {
    sp.pass({ dry: 0.2, relief: 0.5 }, g => {
      fillPoly(g, smooth([[x - 55, y], [x - 50, y - 50], [x - 20, y - 70], [x + 20, y - 70], [x + 50, y - 50], [x + 55, y]], 2, true), 'rgba(214,220,210,0.7)');
      fillPoly(g, smooth([[x - 50, y - 4], [x - 46, y - 36], [x + 46, y - 36], [x + 50, y - 4]], 2, true), '#A7B3A2');
      fillPoly(g, [[x - 10, y - 70], [x + 10, y - 70], [x + 8, y - 100], [x - 8, y - 100]], '#8C7A4A');
    });
  });
}
export function flame(c: C, x: number, y: number, k: number, s = 1) {
  const r = rng(k);
  c.save();
  c.fillStyle = '#E8A84C'; c.globalAlpha = 0.9;
  c.beginPath(); c.moveTo(x - 14 * s, y); c.quadraticCurveTo(x - 12 * s, y - 34 * s, x + (r() - 0.5) * 10 * s, y - (60 + r() * 20) * s); c.quadraticCurveTo(x + 14 * s, y - 30 * s, x + 14 * s, y); c.closePath(); c.fill();
  c.fillStyle = '#F6E2A8'; c.beginPath(); c.ellipse(x, y - 14 * s, 6 * s, 14 * s, 0, 0, 7); c.fill();
  c.restore();
}

// ---------- the factory: brick block, chimneys, a painted sign ----------
export function factory(): Sprite {
  return sprite('factory', [-20, 560, 1100, 1700], sp => {
    const r = rng(1863);
    const block: P[] = [[60, 1000], [1020, 1000], [1020, 1660], [60, 1660]];
    sp.pass({ dry: 0.4, relief: 0.6, soften: 1, patch: 0.25 }, g => {
      // chimneys
      for (const cx of [210, 860]) { fillPoly(g, [[cx - 45, 600], [cx + 45, 600], [cx + 55, 1010], [cx - 55, 1010]], '#7E3E2C'); fillPoly(g, [[cx - 58, 590], [cx + 58, 590], [cx + 58, 620], [cx - 58, 620]], '#5E2C1E'); }
      fillPoly(g, block, '#8C4632');
      fillPoly(g, [[40, 1000], [540, 860], [1040, 1000]], '#5E3A30');
      g.save(); pathOf(g, block); g.clip();
      for (let row = 0; row < 40; row++) for (let i = 0; i < 12; i++) {
        const bx = 60 + i * 84 + (row % 2) * 42, by = 1004 + row * 17;
        stroke(g, r, [[bx, by], [bx + 74, by]], 12, pick(r, ['#94503A', '#83432F', '#9E5A42', '#7A3C2A']), { taper: T_KNIFE, load: 0.8, fade: 0.2, streaks: 4 });
      }
      g.restore();
      // windows
      for (let i = 0; i < 5; i++) for (const wy of [1300, 1480]) fillPoly(g, [[120 + i * 180, wy], [200 + i * 180, wy], [200 + i * 180, wy + 110], [120 + i * 180, wy + 110]], pick(r, ['#2E2A26', '#3A332C']));
    });
    sp.pass({ dry: 0.2, relief: 0.4 }, g => {
      fillPoly(g, [[250, 1080], [830, 1080], [830, 1220], [250, 1220]], '#1E1A18');
      g.fillStyle = '#E8DCC0'; g.textAlign = 'center'; g.font = '112px "Instrument Serif"'; g.fillText('BAYER', 540, 1188); g.textAlign = 'left';
      line(g, [[262, 1092], [818, 1092]], 3, 3, '#C9A44A', 0.9);
      line(g, [[262, 1208], [818, 1208]], 3, 3, '#C9A44A', 0.9);
    });
  });
}
export function dyeTub(key: string, x: number, y: number, col: string): Sprite {
  return sprite(`tub:${key}`, [x - 140, y - 130, x + 140, y + 20], sp => {
    const r = rng(x);
    sp.pass({ dry: 0.3, relief: 0.6, soften: 1 }, g => {
      fillPoly(g, [[x - 125, y - 100], [x + 125, y - 100], [x + 110, y], [x - 110, y]], '#5E4632');
      for (let i = 0; i < 4; i++) ribbon(g, r, [[x - 120, y - 80 + i * 22], [x + 120, y - 80 + i * 22]], 6, '#3E2C1E', { load: 0.8 });
      fillPoly(g, smooth([[x - 125, y - 100], [x, y - 122], [x + 125, y - 100], [x, y - 84]], 2, true), col);
      for (let i = 0; i < 6; i++) stroke(g, r, [[x - 90 + r() * 120, y - 104 + r() * 10], [x - 40 + r() * 120, y - 102 + r() * 10]], 6, col, { load: 0.8, colorVar: 0.1 });
    });
  });
}

// ---------- the pharmacy: shelves of bottles behind a counter ----------
export function shelves(): Sprite {
  return sprite('shelves', [0, 380, 1080, 1300], sp => {
    const r = rng(1899);
    sp.pass({ dry: 0.3, relief: 0.5, soften: 1 }, g => {
      for (const sy of [700, 1000, 1290]) fillPoly(g, [[0, sy - 18], [1080, sy - 18], [1080, sy + 8], [0, sy + 8]], '#4A3020');
      for (const sy of [700, 1000, 1290]) for (let i = 0; i < 11; i++) {
        const bx = 40 + i * 96 + (r() - 0.5) * 20, bh = 120 + r() * 100, bw = 50 + r() * 26;
        const col = pick(r, ['#5A3A22', '#3E5A4A', '#2E4A6A', '#6A5A3A', '#7A3A2A', '#C8BC9C']);
        fillPoly(g, smooth([[bx - bw / 2, sy - 18], [bx - bw / 2, sy - bh * 0.7], [bx - bw / 4, sy - bh * 0.85], [bx - bw / 4, sy - bh], [bx + bw / 4, sy - bh], [bx + bw / 4, sy - bh * 0.85], [bx + bw / 2, sy - bh * 0.7], [bx + bw / 2, sy - 18]], 2, true), col);
        fillPoly(g, [[bx - bw * 0.38, sy - bh * 0.5], [bx + bw * 0.38, sy - bh * 0.5], [bx + bw * 0.38, sy - bh * 0.3], [bx - bw * 0.38, sy - bh * 0.3]], '#E2D8C0');
      }
    });
  });
}
export function counter(y: number): Sprite {
  return sprite(`counter:${y}`, [-20, y - 40, 1100, 1940], sp => {
    const r = rng(y + 3);
    sp.pass({ dry: 0.35, relief: 0.5, soften: 1.2, patch: 0.2 }, g => {
      fillPoly(g, [[-20, y], [1100, y], [1100, 1940], [-20, 1940]], '#3E2818');
      for (let i = 0; i < 120; i++) knife(g, r, r() * 1100, y + r() * (1940 - y), (r() - 0.5) * 0.06, 140 + r() * 240, 14 + r() * 24, pick(r, ['#47301E', '#3A2616', '#523822']), { load: 0.85 });
      ribbon(g, r, [[-20, y + 6], [540, y + 2], [1100, y + 6]], 26, '#6A4A30', { load: 1, fade: 0.1, ragged: 0.08 });
      for (const px of [180, 900]) fillPoly(g, [[px - 70, y + 140], [px + 70, y + 140], [px + 70, y + 520], [px - 70, y + 520]], '#33200F');
    });
  });
}
export function box(x: number, y: number): Sprite {
  return sprite(`box:${x}`, [x - 150, y - 200, x + 150, y + 10], sp => {
    sp.pass({ dry: 0.25, relief: 0.6, soften: 1 }, g => {
      fillPoly(g, [[x - 130, y], [x + 110, y], [x + 140, y - 20], [x + 140, y - 180], [x - 100, y - 180], [x - 130, y - 160]], '#C9B994');
      fillPoly(g, [[x - 130, y], [x + 110, y], [x + 110, y - 160], [x - 130, y - 160]], '#D8CAA6');
      fillPoly(g, [[x + 110, y], [x + 140, y - 20], [x + 140, y - 180], [x + 110, y - 160]], '#B3A27C');
      line(g, [[x - 120, y - 90], [x + 100, y - 90]], 3, 3, '#8C7A56', 0.7);
    });
  });
}
void fillStrokes;

// ---------- painters' things ----------
/** A paint tube lying along x (cap at the right), centre (x, y), length L, with a printed label. */
export function tube(key: string, x: number, y: number, L: number, label: string, band = '#6A4630'): Sprite {
  const h = L * 0.26;
  return sprite(`tube:${key}`, [x - L / 2 - 30, y - h, x + L / 2 + 30, y + h], sp => {
    const r = rng(L);
    sp.pass({ dry: 0.2, relief: 0.6, soften: 1 }, g => {
      // crimped tail, body, shoulder, cap
      fillPoly(g, [[x - L / 2 - 14, y - h * 0.42], [x - L / 2 + 10, y - h * 0.4], [x - L / 2 + 10, y + h * 0.4], [x - L / 2 - 14, y + h * 0.42]], '#9C9A94');
      fillPoly(g, smooth([[x - L / 2 + 8, y - h * 0.4], [x + L * 0.28, y - h * 0.4], [x + L * 0.36, y - h * 0.18], [x + L * 0.36, y + h * 0.18], [x + L * 0.28, y + h * 0.4], [x - L / 2 + 8, y + h * 0.4]], 2, true), '#C7C5BE');
      for (let i = 0; i < 8; i++) ribbon(g, r, [[x - L / 2 + 10, y - h * 0.35 + i * h * 0.1], [x + L * 0.3, y - h * 0.36 + i * h * 0.1]], 4, pick(r, ['#B2B0A9', '#DAD8D1']), { load: 0.5, fade: 0.4 });
      fillPoly(g, [[x + L * 0.36, y - h * 0.16], [x + L / 2, y - h * 0.16], [x + L / 2, y + h * 0.16], [x + L * 0.36, y + h * 0.16]], '#2A2422');
      // label band
      fillPoly(g, [[x - L * 0.32, y - h * 0.4], [x + L * 0.2, y - h * 0.4], [x + L * 0.2, y + h * 0.4], [x - L * 0.32, y + h * 0.4]], '#E6DCC4');
      fillPoly(g, [[x - L * 0.32, y + h * 0.16], [x + L * 0.2, y + h * 0.16], [x + L * 0.2, y + h * 0.4], [x - L * 0.32, y + h * 0.4]], band);
      g.fillStyle = '#241812'; g.textAlign = 'center'; g.font = `italic ${Math.round(h * 0.34)}px "Instrument Serif"`;
      g.fillText(label, x - L * 0.06, y + h * 0.04); g.textAlign = 'left';
    });
  });
}
/** A wooden palette (oval with a thumb hole). */
export function palette(x: number, y: number, w: number): Sprite {
  return sprite(`palette:${x}:${y}`, [x - w / 2 - 20, y - w * 0.36, x + w / 2 + 20, y + w * 0.36], sp => {
    const r = rng(w);
    sp.pass({ dry: 0.3, relief: 0.5, soften: 1 }, g => {
      g.beginPath(); g.ellipse(x, y, w / 2, w * 0.3, -0.08, 0, 7); g.fillStyle = '#B98E5E'; g.fill();
      for (let i = 0; i < 12; i++) ribbon(g, r, [[x - w / 2 + 20, y - w * 0.25 + i * w * 0.045], [x + w / 2 - 20, y - w * 0.26 + i * w * 0.045]], 6, pick(r, ['#A87E50', '#C49A68']), { load: 0.5 });
      g.beginPath(); g.ellipse(x - w * 0.3, y + w * 0.06, w * 0.05, w * 0.035, 0, 0, 7); g.fillStyle = '#3A2E26'; g.fill();
      for (const [dx, dy, c] of [[0.05, -0.18, '#C8A23C'], [0.2, -0.12, '#2E4A8E'], [0.3, 0.02, '#B2352A'], [0.22, 0.15, '#E8E2D2']] as [number, number, string][]) {
        g.beginPath(); g.ellipse(x + dx * w, y + dy * w, w * 0.045, w * 0.032, 0, 0, 7); g.fillStyle = c; g.fill();
      }
    });
  });
}
/** A standing wrapped mummy in an open, painted coffin. Feet at (x, feetY), height h. */
export function mummy(x: number, feetY: number, h: number): Sprite {
  const w = h * 0.3;
  return sprite(`mummy:${x}`, [x - w - 40, feetY - h - 40, x + w + 40, feetY + 20], sp => {
    const r = rng(h);
    const coffin: P[] = [[x - w * 0.62, feetY], [x - w * 0.9, feetY - h * 0.55], [x - w * 0.8, feetY - h * 0.9], [x - w * 0.4, feetY - h * 1.03], [x + w * 0.4, feetY - h * 1.03], [x + w * 0.8, feetY - h * 0.9], [x + w * 0.9, feetY - h * 0.55], [x + w * 0.62, feetY]];
    sp.pass({ dry: 0.35, relief: 0.6, soften: 1.2 }, g => {
      fillPoly(g, smooth(coffin, 3, true), '#B8913C');
      g.save(); pathOf(g, coffin); g.clip();
      for (let i = 0; i < 9; i++) ribbon(g, r, [[x - w, feetY - h * (0.1 + i * 0.1)], [x + w, feetY - h * (0.1 + i * 0.1) - 4]], 12, i % 2 ? '#2E4A6E' : '#8E2E22', { load: 0.85, fade: 0.2 });
      g.restore();
      fillPoly(g, smooth(coffin.map(([px, py]) => [x + (px - x) * 0.78, feetY - (feetY - py) * 0.96] as P), 3, true), '#2A2018');
    });
    const body: P[] = [[x - w * 0.36, feetY - 6], [x - w * 0.5, feetY - h * 0.6], [x - w * 0.42, feetY - h * 0.78], [x - w * 0.2, feetY - h * 0.82], [x - w * 0.24, feetY - h * 0.94], [x, feetY - h * 0.99], [x + w * 0.24, feetY - h * 0.94], [x + w * 0.2, feetY - h * 0.82], [x + w * 0.42, feetY - h * 0.78], [x + w * 0.5, feetY - h * 0.6], [x + w * 0.36, feetY - 6]];
    sp.pass({ dry: 0.4, relief: 0.8, soften: 1 }, g => {
      fillPoly(g, smooth(body, 3, true), '#CDBE9C');
      g.save(); pathOf(g, body); g.clip();
      for (let i = 0; i < 46; i++) { const yy = feetY - h * (i / 46); ribbon(g, r, [[x - w * 0.6, yy + (r() - 0.5) * 10], [x + w * 0.6, yy - 10 + (r() - 0.5) * 10]], 9 + r() * 6, pick(r, ['#D9CCAC', '#BFAE8A', '#E2D6B8', '#A9976F']), { load: 0.85, fade: 0.3, ragged: 0.3 }); }
      g.restore();
      line(g, [[x - w * 0.12, feetY - h * 0.9], [x - w * 0.02, feetY - h * 0.9]], 3, 3, '#4A3A28', 0.7);
    });
  });
}
export function mortar(x: number, y: number, R: number): Sprite {
  return sprite(`mortar:${x}`, [x - R - 20, y - R * 0.6, x + R + 20, y + R * 0.9], sp => {
    const r = rng(R);
    sp.pass({ dry: 0.35, relief: 0.7, soften: 1 }, g => {
      fillPoly(g, smooth([[x - R, y - R * 0.3], [x + R, y - R * 0.3], [x + R * 0.8, y + R * 0.4], [x + R * 0.45, y + R * 0.7], [x - R * 0.45, y + R * 0.7], [x - R * 0.8, y + R * 0.4]], 3, true), '#8E8A80');
      for (let i = 0; i < 6; i++) ribbon(g, r, [[x - R * 0.9, y - R * 0.2 + i * R * 0.15], [x + R * 0.9, y - R * 0.22 + i * R * 0.15]], 8, pick(r, ['#9C988E', '#7A766C']), { load: 0.6 });
      g.beginPath(); g.ellipse(x, y - R * 0.3, R, R * 0.26, 0, 0, 7); g.fillStyle = '#A29E94'; g.fill();
      g.beginPath(); g.ellipse(x, y - R * 0.28, R * 0.86, R * 0.2, 0, 0, 7); g.fillStyle = '#5A3A26'; g.fill();
      for (let i = 0; i < 10; i++) stroke(g, r, [[x - R * 0.7 + r() * R * 1.2, y - R * 0.3], [x - R * 0.5 + r() * R * 1.2, y - R * 0.26]], 6, pick(r, ['#6E4A30', '#4E3020', '#7E5838']), { load: 0.8 });
    });
  });
}
export function pestle(key: string, x: number, y: number, L: number): Sprite {
  return sprite(`pestle:${key}`, [x - 40, y - L, x + 40, y + 30], sp => sp.pass({ dry: 0.3, relief: 0.6 }, g => {
    fillPoly(g, smooth([[x - 14, y - L], [x + 14, y - L], [x + 16, y - L * 0.3], [x + 30, y], [x - 30, y], [x - 16, y - L * 0.3]], 2, true), '#B4AFA4');
    line(g, [[x - 8, y - L + 10], [x - 10, y - 20]], 5, 3, '#D8D4CA', 0.7);
  }));
}
/** An easel with a canvas; the canvas face is [cx0, cy0, cx1, cy1]. */
export function easel(x: number, floorY: number, cw: number, ch: number): Sprite {
  const cy1 = floorY - 420, cy0 = cy1 - ch;
  return sprite(`easel:${x}:${cw}`, [x - cw / 2 - 60, cy0 - 60, x + cw / 2 + 60, floorY + 10], sp => {
    const r = rng(x + cw);
    sp.pass({ dry: 0.3, relief: 0.5 }, g => {
      line(g, [[x - cw * 0.35, floorY], [x, cy0 - 40]], 16, 12, '#6E4A2E');
      line(g, [[x + cw * 0.35, floorY], [x, cy0 - 40]], 16, 12, '#6E4A2E');
      line(g, [[x, floorY - 30], [x, cy0 - 40]], 14, 10, '#5E3E24');
      fillPoly(g, [[x - cw / 2 - 14, cy1], [x + cw / 2 + 14, cy1], [x + cw / 2 + 14, cy1 + 18], [x - cw / 2 - 14, cy1 + 18]], '#5E3E24');
    });
    sp.pass({ dry: 0.3, relief: 0.4, soften: 1 }, g => {
      fillPoly(g, [[x - cw / 2, cy0], [x + cw / 2, cy0], [x + cw / 2, cy1], [x - cw / 2, cy1]], '#E8DFCB');
      for (let i = 0; i < 30; i++) knife(g, r, x - cw / 2 + r() * cw, cy0 + r() * ch, (r() - 0.5) * 0.6, 60, 30, pick(r, ['#E2D8C2', '#D8CDB4', '#ECE4D2']), { load: 0.5 });
      line(g, [[x - cw / 2, cy0], [x + cw / 2, cy0], [x + cw / 2, cy1], [x - cw / 2, cy1], [x - cw / 2, cy0]], 4, 4, '#8E7458', 0.8);
    });
  });
}
export const easelCanvas = (x: number, floorY: number, cw: number, ch: number): [number, number, number, number] => [x - cw / 2, floorY - 420 - ch, x + cw / 2, floorY - 420];
/** A wooden crate stencilled with a word; the lid is a separate sprite hinged at the back top edge. */
export function crate(x: number, y: number, w: number, h: number, word: string): { box: Sprite; lid: Sprite; hinge: P } {
  const r = rng(w + h);
  const boxS = sprite(`crate:${x}`, [x - w / 2 - 20, y - h - 40, x + w / 2 + 20, y + 20], sp => {
    sp.pass({ dry: 0.35, relief: 0.6, soften: 1, patch: 0.2 }, g => {
      fillPoly(g, [[x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2, y], [x - w / 2, y]], '#A07E52');
      for (let i = 0; i < 5; i++) ribbon(g, r, [[x - w / 2, y - h + 10 + i * h / 5], [x + w / 2, y - h + 8 + i * h / 5]], h / 5 - 6, pick(r, ['#A8875A', '#97764C', '#B08F62']), { load: 0.9, fade: 0.2 });
      for (const px of [x - w / 2 + 14, x + w / 2 - 14]) line(g, [[px, y - h], [px, y]], 20, 20, '#7A5A36');
      // the inside, seen over the front edge: dark and empty
      fillPoly(g, [[x - w / 2 + 6, y - h - 30], [x + w / 2 - 6, y - h - 30], [x + w / 2, y - h], [x - w / 2, y - h]], '#2A1E14');
      g.fillStyle = '#3A2A1A'; g.globalAlpha = 0.85; g.textAlign = 'center'; g.font = `${Math.round(h * 0.3)}px "Instrument Serif"`; g.fillText(word, x, y - h * 0.38); g.textAlign = 'left'; g.globalAlpha = 1;
    });
  });
  const lid = sprite(`lid:${x}`, [x - w / 2 - 20, y - h - 50, x + w / 2 + 20, y - h + 10], sp => sp.pass({ dry: 0.35, relief: 0.6, soften: 1 }, g => {
    fillPoly(g, [[x - w / 2 - 8, y - h - 34], [x + w / 2 + 8, y - h - 34], [x + w / 2 + 8, y - h + 2], [x - w / 2 - 8, y - h + 2]], '#8E6E46');
    ribbon(g, r, [[x - w / 2, y - h - 16], [x + w / 2, y - h - 18]], 16, '#A07E52', { load: 0.8 });
  }));
  return { box: boxS, lid, hinge: [x - w / 2 - 8, y - h - 16] };
}
