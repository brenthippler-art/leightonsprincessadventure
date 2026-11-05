import Phaser from 'phaser';
import { CSS, GAME_WIDTH, TILE_SIZE } from '../../constants';
import { addStrip, maskOf } from '../levelArt';
import { addTexture, drawMaskOutlined, makeCanvas } from '../pixels';

/**
 * Shared drawing helpers for themes. Every theme is drawn in code from simple shapes:
 * ellipses and rectangles are combined into a "silhouette", outlined in one dark color
 * (the 16-bit look), then shaded and given a face.
 */

export const OUT = CSS.outline;

/** A yes/no test for "is pixel (x, y) inside this shape?". */
export type Pred = (x: number, y: number) => boolean;

export const ell =
  (cx: number, cy: number, rx: number, ry: number): Pred =>
  (x, y) =>
    ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
export const rect =
  (x0: number, y0: number, w: number, h: number): Pred =>
  (x, y) =>
    x >= x0 && x < x0 + w && y >= y0 && y < y0 + h;
export const any =
  (...preds: Pred[]): Pred =>
  (x, y) =>
    preds.some((p) => p(x, y));
export const minus =
  (a: Pred, b: Pred): Pred =>
  (x, y) =>
    a(x, y) && !b(x, y);

/** Fill a shape with one color and a 1-pixel dark outline around it. */
export function shape(ctx: CanvasRenderingContext2D, w: number, h: number, p: Pred, fill: string, outline = OUT): void {
  drawMaskOutlined(ctx, maskOf(w, h, (x, y) => x > 0 && y > 0 && x < w - 1 && y < h - 1 && p(x, y)), 0, 0, fill, outline);
}

/** Fill a shape with one color, no outline (for shading and details). */
export function fill(ctx: CanvasRenderingContext2D, w: number, h: number, p: Pred, color: string): void {
  ctx.fillStyle = color;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (p(x, y)) ctx.fillRect(x, y, 1, 1);
}

/** Darken the bottom edge of a shape (simple 16-bit shading). */
export function shadeBottom(ctx: CanvasRenderingContext2D, w: number, h: number, p: Pred, color: string, depth = 2): void {
  fill(ctx, w, h, (x, y) => p(x, y) && !p(x, y + depth) && p(x, y), color);
}

export function px(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w = 1, h = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** Friendly eyes: 'calm' = little dots with a shine, 'happy' = closed smiling arches. */
export function eyes(ctx: CanvasRenderingContext2D, xs: number[], y: number, mood: 'calm' | 'happy'): void {
  for (const x of xs) {
    if (mood === 'calm') {
      px(ctx, OUT, x, y, 2, 2);
      px(ctx, CSS.white, x, y, 1, 1);
    } else {
      px(ctx, OUT, x - 1, y + 1);
      px(ctx, OUT, x, y);
      px(ctx, OUT, x + 1, y);
      px(ctx, OUT, x + 2, y + 1);
    }
  }
}

/** A small smile under the eyes. */
export function smile(ctx: CanvasRenderingContext2D, cx: number, y: number, big = false): void {
  px(ctx, OUT, cx - 1, y);
  px(ctx, OUT, cx, y + 1, big ? 2 : 1);
  px(ctx, OUT, cx + (big ? 2 : 1), y);
}

export function cheeks(ctx: CanvasRenderingContext2D, xs: number[], y: number, color = '#ff9fc8'): void {
  for (const x of xs) px(ctx, color, x, y, 2, 1);
}

/** Make a texture strip from `n` frames drawn by `draw(ctx, frameIndex)`. */
export function frames(
  scene: Phaser.Scene,
  key: string,
  n: number,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, f: number) => void,
): string {
  const canvases = Array.from({ length: n }, (_, f) => {
    const [c, ctx] = makeCanvas(w, h);
    draw(ctx, f);
    return c;
  });
  addStrip(scene, key, canvases);
  return key;
}

/** A single-picture texture. */
export function single(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): string {
  const [c, ctx] = makeCanvas(w, h);
  draw(ctx);
  addTexture(scene, key, c);
  return key;
}

// ---------------------------------------------------------------------------------------------
// Backgrounds
// ---------------------------------------------------------------------------------------------

/** Blend two "#rrggbb" colors. t=0 gives a, t=1 gives b. */
export function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

/** 2x2 "ordered dither" pattern: the checkerboard blending trick 16-bit consoles used for gradients. */
export const BAYER = [
  [0, 0.5],
  [0.75, 0.25],
];

/** Wavy outline that repeats exactly every screen-width, so a strip tiles seamlessly sideways. */
export function wave(x: number, parts: [number, number, number][]): number {
  return parts.reduce((sum, [amp, cycles, phase]) => sum + amp * Math.sin((x / GAME_WIDTH) * Math.PI * 2 * cycles + phase), 0);
}

/** A sky that fades from `top` to `bottom` in 4 dithered steps. */
export function skyGradient(ctx: CanvasRenderingContext2D, w: number, h: number, top: string, bottom: string, y0 = 0): void {
  const steps = [0, 1, 2, 3].map((i) => mix(top, bottom, i / 3));
  for (let y = y0; y < h; y++) {
    const t = ((y - y0) / (h - y0)) * 3;
    const base = Math.floor(t);
    for (let x = 0; x < w; x++) {
      const pick = t - base > BAYER[y % 2][x % 2] ? base + 1 : base;
      ctx.fillStyle = steps[Math.min(pick, 3)];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

/** Puffy clouds made of overlapping circles. Each: [x, y, size]. */
export function clouds(ctx: CanvasRenderingContext2D, list: [number, number, number][], color: string): void {
  ctx.fillStyle = color;
  for (const [cx, cy, s] of list)
    for (const [dx, dy, r] of [
      [0, 0, 9],
      [-10, 4, 6],
      [11, 3, 7],
      [5, -5, 6],
    ]) {
      const R = r * s;
      for (let y = -R; y <= R; y++)
        for (let x = -R; x <= R; x++)
          if (x * x + y * y <= R * R) ctx.fillRect(Math.round(cx + dx * s + x), Math.round(cy + dy * s + y), 1, 1);
    }
}

/** Fill everything below a wavy line (hills, dunes, bushes), with a 2-pixel lighter top edge. */
export function wavyFill(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  base: number,
  parts: [number, number, number][],
  color: string,
  light?: string,
): number[] {
  const tops: number[] = [];
  for (let x = 0; x < w; x++) {
    const top = Math.round(base + wave(x, parts));
    tops.push(top);
    if (light) {
      ctx.fillStyle = light;
      ctx.fillRect(x, top, 1, 2);
    }
    ctx.fillStyle = color;
    ctx.fillRect(x, top + (light ? 2 : 0), 1, h - top);
  }
  return tops;
}

/** A tiny 3x3 flower: petals + center. */
export function flower(ctx: CanvasRenderingContext2D, x: number, y: number, petal: string, center = CSS.gold): void {
  px(ctx, petal, x - 1, y);
  px(ctx, petal, x + 1, y);
  px(ctx, petal, x, y - 1);
  px(ctx, petal, x, y + 1);
  px(ctx, center, x, y);
}

// ---------------------------------------------------------------------------------------------
// Tiles
// ---------------------------------------------------------------------------------------------

export interface TileColors {
  top: string;
  topDark: string;
  fill: string;
  fillDark: string;
  platform: string;
  platformDark: string;
  /** Little details sprinkled on the top layer (flowers, shells...). */
  sprinkle?: string[];
}

/** The standard tile set: [ground with a top layer] [plain ground] [floating plank]. 48x16. */
export function standardTiles(ctx: CanvasRenderingContext2D, c: TileColors): void {
  const T = TILE_SIZE;
  const dirt = (ox: number) => {
    px(ctx, c.fill, ox, 0, T, T);
    ctx.fillStyle = c.fillDark;
    for (const [x, y] of [
      [3, 8],
      [10, 7],
      [6, 12],
      [13, 13],
      [1, 3],
      [9, 2],
    ])
      ctx.fillRect(ox + x, y, 2, 1);
  };
  dirt(0);
  px(ctx, c.top, 0, 0, T, 4);
  px(ctx, c.topDark, 0, 4, T, 1);
  for (const x of [2, 7, 12]) px(ctx, c.topDark, x, 5, 2, 1);
  (c.sprinkle ?? []).forEach((col, i) => px(ctx, col, [3, 9, 13][i % 3], 1));
  dirt(T);
  const p = T * 2;
  px(ctx, OUT, p, 0, T, 9);
  px(ctx, c.platform, p, 1, T, 5);
  px(ctx, c.platformDark, p, 6, T, 2);
  px(ctx, c.platformDark, p + 7, 1, 1, 5);
}

// ---------------------------------------------------------------------------------------------
// Jewels
// ---------------------------------------------------------------------------------------------

export interface GemStyle {
  /** round = brilliant (ruby), step = rectangle step cut (emerald), oval, pearl = smooth sphere. */
  cut: 'round' | 'step' | 'oval' | 'pearl' | 'opal' | 'heart';
  light: string;
  mid: string;
  dark: string;
}

/** Draw a 13x12 jewel in its own colors and cut. */
export function gemTexture(scene: Phaser.Scene, key: string, g: GemStyle): string {
  return single(scene, key, 13, 12, (ctx) => {
    const W = 13;
    const H = 12;
    const inside: Pred =
      g.cut === 'heart'
        ? (x, y) => ell(4, 4, 3.4, 3.4)(x, y) || ell(9, 4, 3.4, 3.4)(x, y) || (y >= 4 && y <= 11 && Math.abs(x + 0.5 - 6.5) <= (11.5 - y) * 0.85)
        : g.cut === 'step'
        ? (x, y) => x >= 1 && x <= 11 && y >= 1 && y <= 10 && x + y >= 3 && x - y <= 9 && y - x <= 8 && x + y <= 19
        : g.cut === 'oval'
          ? ell(6.5, 6, 5.5, 4.5)
          : ell(6.5, 6, 5.2, 5);
    shape(ctx, W, H, inside, g.mid);
    if (g.cut === 'heart') {
      // The Heart Jewel: a gold heart with a pink heart glowing inside.
      fill(ctx, W, H, (x, y) => inside(x, y) && x + y > 14, g.dark);
      fill(ctx, W, H, (x, y) => ell(5, 5, 1.6, 1.6)(x, y) || ell(8, 5, 1.6, 1.6)(x, y) || (y >= 5 && y <= 8 && Math.abs(x + 0.5 - 6.5) <= (8.5 - y) * 0.9), '#ff6fb5');
      px(ctx, CSS.white, 3, 3);
      px(ctx, '#ffd0e8', 5, 4);
      return;
    }
    if (g.cut === 'opal') {
      // Milky stone with little rainbow flecks.
      const flecks = ['#ff9fc8', '#9ef0ff', '#ffe066', '#a8f5c0', '#c9a3ff'];
      fill(ctx, W, H, (x, y) => inside(x, y) && x + y > 13, g.dark);
      for (let i = 0; i < 9; i++) px(ctx, flecks[i % flecks.length], 3 + ((i * 5) % 7), 3 + ((i * 3) % 6));
      px(ctx, CSS.white, 4, 3);
      return;
    }
    if (g.cut === 'pearl') {
      fill(ctx, W, H, (x, y) => inside(x, y) && x + y > 13, g.dark);
      fill(ctx, W, H, (x, y) => inside(x, y) && x + y < 8, g.light);
      px(ctx, CSS.white, 4, 3, 2, 1);
      px(ctx, CSS.white, 4, 4);
      return;
    }
    if (g.cut === 'step') {
      // Concentric "steps" like a real emerald cut.
      fill(ctx, W, H, (x, y) => inside(x, y) && x >= 4 && x <= 8 && y >= 4 && y <= 7, g.light);
      fill(ctx, W, H, (x, y) => inside(x, y) && (y >= 9 || x >= 10), g.dark);
    } else {
      // Brilliant facets: bright top-left, dark bottom-right, a lighter "table" in the middle.
      fill(ctx, W, H, (x, y) => inside(x, y) && y <= 4 && x <= 7, g.light);
      fill(ctx, W, H, (x, y) => inside(x, y) && x + y >= 14, g.dark);
      fill(ctx, W, H, (x, y) => inside(x, y) && Math.abs(x - 6) + Math.abs(y - 6) === 3, g.dark);
    }
    px(ctx, CSS.white, 4, 3);
    px(ctx, CSS.white, 3, 4);
  });
}
