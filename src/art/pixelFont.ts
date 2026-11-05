import Phaser from 'phaser';
import { CSS } from '../constants';
import { addTexture, drawMaskOutlined, makeCanvas, maskFromRows, type Mask } from './pixels';

/**
 * A chunky hand-drawn PIXEL FONT, made in code (no web fonts). Each letter is a 5x7 picture.
 * Used only for the game's title (for grown-ups); the game never needs her to read.
 *
 * To look hand-drawn, letters sit at slightly different heights, and the fill has a soft
 * two-tone shine.
 */
const G: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  J: ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  "'": ['.#', '.#', '#.', '..', '..', '..', '..'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '-': ['...', '...', '...', '###', '...', '...', '...'],
  ' ': ['...', '...', '...', '...', '...', '...', '...'],
};

/** Little up/down nudges per letter, so the line wobbles like hand lettering. */
const WOBBLE = [0, -1, 0, 1, 0, -1, 1, 0];

export interface TextStyle {
  /** Main letter color, and the lighter "shine" color for the top half. */
  fill: string;
  shine: string;
  outline?: string;
  /** Each font pixel becomes this many real pixels. */
  scale?: number;
}

/** Draw a line of text to a new texture and return its key. */
export function pixelText(scene: Phaser.Scene, key: string, text: string, style: TextStyle): string {
  const scale = style.scale ?? 1;
  const chars = Array.from(text.toUpperCase()).map((c) => G[c] ?? G[' ']);
  const w = chars.reduce((sum, g) => sum + g[0].length + 1, 1) + 2;
  const h = 7 + 4;
  // Build one big mask for the whole line (letters at wobbly heights).
  const mask: Mask = Array.from({ length: h }, () => Array(w).fill(false));
  const shine: boolean[][] = Array.from({ length: h }, () => Array(w).fill(false));
  let x = 2;
  chars.forEach((g, i) => {
    const dy = 2 + WOBBLE[i % WOBBLE.length];
    const m = maskFromRows(g);
    m.forEach((row, y) =>
      row.forEach((on, xx) => {
        if (!on) return;
        mask[y + dy][x + xx] = true;
        if (y < 3) shine[y + dy][x + xx] = true;
      }),
    );
    x += g[0].length + 1;
  });
  const [small, ctx] = makeCanvas(w, h);
  drawMaskOutlined(ctx, mask, 0, 0, style.fill, style.outline ?? CSS.outline);
  ctx.fillStyle = style.shine;
  shine.forEach((row, y) => row.forEach((on, xx) => on && ctx.fillRect(xx, y, 1, 1)));
  // Scale up with crisp pixels.
  const [big, bctx] = makeCanvas(w * scale, h * scale);
  bctx.imageSmoothingEnabled = false;
  bctx.drawImage(small, 0, 0, w * scale, h * scale);
  addTexture(scene, key, big);
  return key;
}
