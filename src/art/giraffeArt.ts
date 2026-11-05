import Phaser from 'phaser';
import { TILE_SIZE } from '../constants';
import { any, ell, eyes, fill, frames, px, rect, shape, smile, single, type Pred } from './themes/common';

/**
 * GIRAFFES: Leighton's favorite animal, always friendly (never obstacles).
 * Drawn in code: soft yellow with orange-brown patches, little horn knobs, happy faces.
 */

const BODY = '#ffd36a';
const SHADE = '#e8b048';
const SPOT = '#d08a3a';
const MANE = '#b0602a';
const HOOF = '#6b3d1e';

/** Giraffe patches: a staggered grid of chunky rounded spots, clipped to the shape (and away from its edge). */
function spots(ctx: CanvasRenderingContext2D, w: number, h: number, inside: Pred, seed = 0): void {
  fill(
    ctx,
    w,
    h,
    (x, y) => {
      if (!(inside(x, y) && inside(x, y - 1) && inside(x, y + 1) && inside(x - 1, y) && inside(x + 1, y))) return false;
      const row = Math.floor(y / 6);
      const lx = (x + seed + (row % 2) * 3) % 6;
      const ly = y % 6;
      const corner = (lx === 1 || lx === 4) && (ly === 1 || ly === 4);
      return lx >= 1 && lx <= 4 && ly >= 1 && ly <= 4 && !corner;
    },
    SPOT,
  );
}

/** A giraffe head facing left: horn knobs, ear, friendly eye and smile. (hx, hy) = head center. */
function head(ctx: CanvasRenderingContext2D, w: number, h: number, hx: number, hy: number, mood: 'calm' | 'happy'): void {
  const knobs = any(rect(hx + 1, hy - 7, 1, 3), rect(hx + 4, hy - 7, 1, 3));
  shape(ctx, w, h, knobs, MANE);
  px(ctx, HOOF, hx + 1, hy - 8);
  px(ctx, HOOF, hx + 4, hy - 8);
  const skull = any(ell(hx, hy, 7.5, 4.5), ell(hx + 4, hy - 2, 4, 3.5));
  shape(ctx, w, h, skull, BODY);
  fill(ctx, w, h, ell(hx - 4, hy + 1, 3.5, 2.5), '#ffe6a8'); // lighter muzzle
  shape(ctx, w, h, ell(hx + 8, hy - 3, 3, 1.6), BODY); // ear
  px(ctx, '#ffb09a', hx - 6, hy, 2, 1); // soft nose
  eyes(ctx, [hx + 1], hy - 2, mood);
  smile(ctx, hx - 3, hy + 2);
  px(ctx, '#ff9fc8', hx + 3, hy + 1, 2, 1); // rosy cheek
}

function legs(ctx: CanvasRenderingContext2D, w: number, h: number, xs: number[], top: number, bottom: number): void {
  for (const x of xs) {
    shape(ctx, w, h, rect(x, top, 3, bottom - top), BODY);
    px(ctx, HOOF, x, bottom - 2, 3, 2);
  }
}

/** Draw a grown-up giraffe, body/back top at `backY`, shoulders at `xs`, standing on `groundY`. */
function grownUp(ctx: CanvasRenderingContext2D, w: number, h: number, xs: number, backY: number, groundY: number): Pred {
  const body = ell(xs + 15, backY + 9, 17, 9);
  legs(ctx, w, h, [xs + 3, xs + 9, xs + 20, xs + 26], backY + 14, groundY);
  shape(ctx, w, h, any(rect(xs + 31, backY + 2, 2, 10)), MANE); // tail
  shape(ctx, w, h, body, BODY);
  fill(ctx, w, h, (x, y) => body(x, y) && !body(x, y + 2), SHADE);
  spots(ctx, w, h, body);
  return body;
}

/**
 * The ramp giraffe, as two textures with the same size and bottom-left corner:
 *  - standing: neck straight up, head high
 *  - lowered:  head resting on the ground, neck sloping up like a ramp to her flat back.
 * The canvas starts one tile LEFT of the ramp (room for her head).
 */
export function giraffeRampTextures(scene: Phaser.Scene, length: number, height: number): { standing: string; lowered: string } {
  const key = `giraffe-ramp-${length}-${height}`;
  const W = (length + 3) * TILE_SIZE;
  const H = height * TILE_SIZE + 60;
  const ground = H - 1;
  const xs = TILE_SIZE + length * TILE_SIZE; // shoulders (top of the ramp)
  const backY = ground + 1 - height * TILE_SIZE;

  const standing = single(scene, `${key}-standing`, W, H, (ctx) => {
    grownUp(ctx, W, H, xs, backY, ground);
    const neck = rect(xs - 1, backY - 40, 8, 46);
    shape(ctx, W, H, neck, BODY);
    fill(ctx, W, H, (x, y) => neck(x, y) && x === xs, MANE);
    spots(ctx, W, H, neck, 3);
    head(ctx, W, H, xs - 4, backY - 44, 'calm');
  });

  const lowered = single(scene, `${key}-lowered`, W, H, (ctx) => {
    grownUp(ctx, W, H, xs, backY, ground);
    // The neck's TOP EDGE is exactly the walkable ramp line, from the ground up to her shoulders.
    const slope = (height * TILE_SIZE) / (length * TILE_SIZE);
    const lineY = (x: number) => ground + 1 - (x - TILE_SIZE) * slope;
    const neck: Pred = (x, y) => x >= TILE_SIZE - 2 && x <= xs + 2 && y >= lineY(x) && y <= lineY(x) + 7 && y < H;
    shape(ctx, W, H, neck, BODY);
    fill(ctx, W, H, (x, y) => neck(x, y) && y < lineY(x) + 1, MANE); // mane along the top
    spots(ctx, W, H, neck, 5);
    head(ctx, W, H, 9, ground - 5, 'happy');
  });

  return { standing, lowered };
}

/** A giraffe munching leaves from a branch (background decoration). 2 frames: chew, chew. */
export function giraffeMunchTexture(scene: Phaser.Scene): string {
  const key = 'giraffe-munch';
  if (scene.textures.exists(key)) return key;
  const W = 64;
  const H = 76;
  return frames(scene, key, 2, W, H, (ctx, f) => {
    // Leafy branch at the top left.
    shape(ctx, W, H, rect(1, 8, 26, 3), '#8a5a34');
    for (const [x, y] of [[4, 6], [12, 12], [20, 5], [8, 13], [24, 11]])
      shape(ctx, W, H, ell(x, y, 4, 3), x % 8 === 4 ? '#5fbf6a' : '#3f9e4f');
    const xs = 26;
    const backY = 40;
    grownUp(ctx, W, H, xs, backY, H - 1);
    const neck = rect(xs - 1, backY - 24, 8, 30);
    shape(ctx, W, H, neck, BODY);
    spots(ctx, W, H, neck, 1);
    head(ctx, W, H, xs - 4, backY - 28 + f, 'happy');
    if (f === 1) shape(ctx, W, H, ell(xs - 11, backY - 26, 2, 1.5), '#5fbf6a'); // a leaf in her mouth
  });
}

/** Baby giraffe: frames 0-1 trotting, frame 2 cheering. Faces left. */
export function babyGiraffeTexture(scene: Phaser.Scene): string {
  const key = 'giraffe-baby';
  if (scene.textures.exists(key)) return key;
  const W = 20;
  const H = 30;
  return frames(scene, key, 3, W, H, (ctx, f) => {
    const cheer = f === 2;
    const body = ell(12, 16, 6.5, 4);
    const legX = cheer ? [6, 8, 15, 17] : f === 0 ? [7, 9, 14, 16] : [8, 10, 13, 15];
    for (const x of legX) {
      shape(ctx, W, H, rect(x, 18, 2, 11), BODY);
      px(ctx, HOOF, x, 27, 2, 2);
    }
    shape(ctx, W, H, body, BODY);
    spots(ctx, W, H, body, 2);
    const neck = rect(6, cheer ? 4 : 6, 5, 12);
    shape(ctx, W, H, neck, BODY);
    px(ctx, MANE, 10, cheer ? 4 : 6, 1, 10);
    const hy = cheer ? 4 : 6;
    shape(ctx, W, H, any(ell(5, hy, 4.5, 3), ell(8, hy - 2, 2, 2)), BODY);
    px(ctx, MANE, 7, hy - 5, 1, 2);
    px(ctx, MANE, 9, hy - 5, 1, 2);
    eyes(ctx, [5], hy - 1, cheer ? 'happy' : 'calm');
    px(ctx, '#ffb09a', 1, hy + 1);
  });
}
