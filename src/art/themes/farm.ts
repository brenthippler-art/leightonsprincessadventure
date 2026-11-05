import Phaser from 'phaser';
import { CSS } from '../../constants';
import { any, cheeks, clouds, ell, eyes, fill, flower, frames, px, rect, shadeBottom, shape, skyGradient, smile, standardTiles, wavyFill } from './common';
import type { Theme } from './types';

/**
 * LEVEL 6: FARMYARD. Blue sky, green fields with a red barn, wooden fences, hay everywhere.
 * Pieces: bouncing baby goats (hoppers; the wand makes them stop and bleat happily), rolling hay
 * bales, wooden fence walls, hay-bale platforms, a hay bale to push, a drawbridge, and a friendly cow.
 * Jewel: Topaz.
 */
export const farmTheme: Theme = {
  key: 'farm',

  paintFar(ctx, w, h) {
    skyGradient(ctx, w, h, '#8fd8ff', '#f0faff');
    ctx.fillStyle = '#fff0a0';
    for (let y = -12; y <= 12; y++) for (let x = -12; x <= 12; x++) if (x * x + y * y <= 144) ctx.fillRect(270 + x, 30 + y, 1, 1);
    clouds(ctx, [[60, 30, 0.9], [170, 22, 0.7]], '#ffffff');
  },

  paintMiddle(ctx, w, h) {
    wavyFill(ctx, w, h, 44, [[5, 2, 0], [3, 5, 1]], '#8fd88a', '#b8f0a8');
    // A little red barn with a white door cross.
    const bx = 200;
    const by = 28;
    shape(ctx, w, h, (x, y) => x >= bx && x < bx + 34 && y >= by + 10 && y < by + 34, '#e85a4a');
    shape(ctx, w, h, (x, y) => y >= by && y < by + 11 && Math.abs(x - (bx + 17)) <= (y - by) * 1.6 + 1, '#b83a3a');
    px(ctx, '#ffffff', bx + 12, by + 18, 10, 16);
    px(ctx, '#e85a4a', bx + 13, by + 19, 8, 14);
    for (let i = 0; i < 8; i++) {
      px(ctx, '#ffffff', bx + 13 + i, by + 19 + Math.round(i * 1.7));
      px(ctx, '#ffffff', bx + 20 - i, by + 19 + Math.round(i * 1.7));
    }
    // Far-off field rows.
    fill(ctx, w, h, (x, y) => y > 62 && y % 6 === 0 && (x + y) % 4 !== 0, '#7cc878');
  },

  paintNear(ctx, w, h) {
    wavyFill(ctx, w, h, 22, [[2, 9, 0], [1, 17, 2]], '#6fc46a', '#8fdc84');
    // Fence posts and rails along the front, with yellow flowers.
    for (let x = 0; x < w; x += 20) px(ctx, '#c8945a', x, 8, 3, 18);
    px(ctx, '#c8945a', 0, 12, w, 2);
    px(ctx, '#c8945a', 0, 19, w, 2);
    for (let i = 0; i < 10; i++) flower(ctx, (i * 31 + 9) % w, 28 + ((i * 5) % 6), '#ffd84a', '#ffffff');
  },

  paintTiles(ctx) {
    standardTiles(ctx, {
      top: '#7ed870',
      topDark: '#3f9a40',
      fill: '#b07a4a',
      fillDark: '#86542e',
      platform: '#f2d06a',
      platformDark: '#c8a040',
      sprinkle: ['#ffd84a', '#ffffff', '#ff9fb8'],
    });
    // Hay-bale platform: golden straw with twine bands.
    px(ctx, CSS.outline, 32, 0, 16, 12);
    px(ctx, '#f2d06a', 33, 1, 14, 10);
    for (let x = 33; x < 47; x += 2) px(ctx, '#e0b850', x, 2 + (x % 4), 1, 3);
    px(ctx, '#c8945a', 37, 1, 1, 10);
    px(ctx, '#c8945a', 43, 1, 1, 10);
    px(ctx, '#fff0a0', 33, 1, 14, 1);
  },

  makeSprites(scene) {
    const goat = (key: string, friendly: boolean) =>
      frames(scene, key, 2, 16, 14, (ctx, f) => {
        const W = 16;
        const H = 14;
        const crouch = f === 1;
        const by = crouch ? 9 : 8;
        for (const x of [4, 7, 10, 12]) px(ctx, CSS.outline, x, by + 3, 1, crouch ? 2 : 3); // legs
        const body = any(ell(9, by, 5.5, crouch ? 3 : 3.5), ell(3.5, by - 3, 3, 2.6));
        shape(ctx, W, H, body, '#ffffff');
        shadeBottom(ctx, W, H, body, '#d8d0e0');
        px(ctx, '#c8945a', 2, by - 7, 1, 2); // little horn nubs
        px(ctx, '#c8945a', 5, by - 7, 1, 2);
        px(ctx, '#ffd0d8', 6, by - 4, 2, 1); // ear
        eyes(ctx, [3], by - 4, friendly ? 'happy' : 'calm');
        if (friendly) {
          smile(ctx, 2, by - 2);
          cheeks(ctx, [4], by - 2);
          flower(ctx, 4, by - 7, '#ff86bf');
        }
        px(ctx, '#e0d8e8', 14, by - 2, 2, 2); // tail tuft
      });

    const bale = frames(scene, 'farm-bale', 2, 14, 14, (ctx, f) => {
      const b = ell(7, 7, 6, 6);
      shape(ctx, 14, 14, b, '#f2d06a');
      // A spiral of straw that turns as it rolls.
      fill(ctx, 14, 14, (x, y) => {
        if (!b(x, y)) return false;
        const a = Math.atan2(y - 6.5, x - 6.5) + f * 0.8;
        const r = Math.hypot(x - 6.5, y - 6.5);
        return Math.abs(((a + Math.PI) / (Math.PI * 2)) * 6 - r) % 2 < 0.6;
      }, '#c8a040');
    });

    const fence = frames(scene, 'farm-fence', 1, 16, 16, (ctx) => {
      const f = any(rect(1, 1, 4, 15), rect(11, 1, 4, 15), rect(1, 4, 14, 3), rect(1, 10, 14, 3));
      shape(ctx, 16, 16, f, '#d8a46a');
      shadeBottom(ctx, 16, 16, f, '#a8743a', 1);
    });

    const squareBale = frames(scene, 'farm-squarebale', 1, 16, 16, (ctx) => {
      const b = rect(1, 2, 14, 13);
      shape(ctx, 16, 16, b, '#f2d06a');
      fill(ctx, 16, 16, (x, y) => b(x, y) && (x + y * 2) % 5 === 0, '#e0b850');
      px(ctx, '#c8945a', 5, 2, 1, 13);
      px(ctx, '#c8945a', 11, 2, 1, 13);
    });

    const plank = frames(scene, 'farm-plank', 1, 16, 8, (ctx) => {
      px(ctx, CSS.outline, 0, 0, 16, 8);
      px(ctx, '#c8945a', 1, 1, 14, 5);
      px(ctx, '#9a6a3a', 1, 6, 14, 1);
      px(ctx, '#6b4424', 3, 3, 1, 1);
      px(ctx, '#6b4424', 12, 3, 1, 1); // nail heads
    });

    const stone = frames(scene, 'farm-stone', 2, 16, 10, (ctx, f) => {
      // A round hay bale lying flat (lights up golden).
      const b = rect(1, 1, 14, 8);
      shape(ctx, 16, 10, b, f ? '#ffe066' : '#e0c890');
      px(ctx, f ? '#fff6c0' : '#f0dca8', 2, 2, 12, 1);
      px(ctx, '#c8945a', 7, 1, 1, 8);
    });

    return {
      hopper: goat('farm-goat', false),
      hopperFriend: goat('farm-goat-friend', true),
      hopperFriendStops: true,
      roller: bale,
      wall: fence,
      crate: squareBale,
      plank,
      stone,
    };
  },

  jewel: { cut: 'step', light: '#ffd8a0', mid: '#ffa53d', dark: '#c8701a' },
};

/** The friendly cow (decoration). 2 frames: chewing, and mooing with her mouth open. */
export function cowTexture(scene: Phaser.Scene): string {
  const key = 'farm-cow';
  if (scene.textures.exists(key)) return key;
  const W = 34;
  const H = 26;
  return frames(scene, key, 2, W, H, (ctx, f) => {
    for (const x of [8, 12, 22, 26]) {
      px(ctx, CSS.outline, x - 1, 16, 4, 10);
      px(ctx, '#ffffff', x, 16, 2, 8);
      px(ctx, '#6b4424', x, 23, 2, 2); // hooves
    }
    const body = ell(19, 12, 12, 6.5);
    shape(ctx, W, H, body, '#ffffff');
    fill(ctx, W, H, (x, y) => body(x, y) && (ell(15, 10, 3.5, 3)(x, y) || ell(25, 13, 3, 2.5)(x, y)), '#4a3a5a'); // spots
    shape(ctx, W, H, rect(30, 9, 2, 7), '#ffffff'); // tail
    const head = any(ell(6, 9, 5, 5), ell(5, 14, 4.5, 2.6));
    shape(ctx, W, H, head, '#ffffff');
    fill(ctx, W, H, ell(5, 14, 4.2, 2.3), '#ffc8d0'); // pink nose
    px(ctx, '#e8a8b8', 3, 14);
    px(ctx, '#e8a8b8', 6, 14);
    shape(ctx, W, H, any(ell(1.5, 5, 1.6, 1.2), ell(10.5, 5, 1.6, 1.2)), '#ffffff'); // ears
    px(ctx, '#ffe066', 3, 2, 1, 2); // little horns
    px(ctx, '#ffe066', 8, 2, 1, 2);
    eyes(ctx, [4, 7], 8, f ? 'happy' : 'calm');
    if (f) px(ctx, CSS.outline, 4, 16, 3, 2); // "moo!"
  });
}
