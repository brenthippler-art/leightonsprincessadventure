import Phaser from 'phaser';

/**
 * Tiny toolkit for making pixel art in code.
 *
 * We draw onto an off-screen <canvas>, one pixel at a time, then hand that canvas to Phaser
 * as a texture. Nothing is downloaded; every picture is made right here when the game starts.
 */

/** A yes/no grid: true where the shape has a pixel. */
export type Mask = boolean[][];

/** Make a blank canvas of the given size. */
export function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [canvas, ctx];
}

/** Register a canvas as a Phaser texture (replacing any old one with the same name). */
export function addTexture(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas);
}

/**
 * Turn rows of characters into a picture.
 * Each character is looked up in `palette` to get its color; '.' (or any unknown char) is see-through.
 *
 *   drawRows(ctx, ['.#.', '###'], { '#': '#ff0000' })
 */
export function drawRows(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  palette: Record<string, string>,
  ox = 0,
  oy = 0,
): void {
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = palette[row[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  });
}

/** Rows of characters -> yes/no grid ('.' and ' ' are "no", anything else is "yes"). */
export function maskFromRows(rows: string[]): Mask {
  return rows.map((row) => Array.from(row, (c) => c !== '.' && c !== ' '));
}

/** Mirror a mask left-to-right. */
export function flipX(mask: Mask): Mask {
  return mask.map((row) => [...row].reverse());
}

/** Turn a mask a quarter-turn counter-clockwise (so a right arrow becomes an up arrow). */
export function rotateLeft(mask: Mask): Mask {
  const h = mask.length;
  const w = mask[0].length;
  const out: Mask = [];
  for (let y = 0; y < w; y++) {
    out.push([]);
    for (let x = 0; x < h; x++) out[y].push(mask[x][w - 1 - y]);
  }
  return out;
}

/**
 * Draw a mask in one color with a 1-pixel outline around it (outline goes on all 8 sides).
 * The outline is what makes small sprites "pop" in classic 16-bit games.
 */
export function drawMaskOutlined(
  ctx: CanvasRenderingContext2D,
  mask: Mask,
  ox: number,
  oy: number,
  fill: string,
  outline: string,
): void {
  const h = mask.length;
  const w = mask[0].length;
  const has = (x: number, y: number) => y >= 0 && y < h && x >= 0 && x < w && mask[y][x];

  ctx.fillStyle = outline;
  for (let y = -1; y <= h; y++) {
    for (let x = -1; x <= w; x++) {
      if (has(x, y)) continue;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1 && !near; dx++) near = has(x + dx, y + dy);
      if (near) ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
  ctx.fillStyle = fill;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y][x]) ctx.fillRect(ox + x, oy + y, 1, 1);
}

/**
 * A pixel-perfect filled circle (no blurry edges), with a ring of `rimWidth` pixels in `rim` color.
 */
export function drawDisc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  fill: string,
  rim: string,
  rimWidth: number,
): void {
  const size = radius * 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - radius;
      const dy = y + 0.5 - radius;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > radius) continue;
      ctx.fillStyle = d > radius - rimWidth ? rim : fill;
      ctx.fillRect(cx - radius + x, cy - radius + y, 1, 1);
    }
  }
}
