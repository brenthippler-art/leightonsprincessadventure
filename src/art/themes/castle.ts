import Phaser from 'phaser';
import { CSS } from '../../constants';
import { any, cheeks, ell, eyes, fill, flower, frames, px, rect, shadeBottom, shape, skyGradient, smile, standardTiles } from './common';
import type { Theme } from './types';

/**
 * LEVEL 12: ROYAL CASTLE. Bright, friendly castle halls: pink stone walls, tall windows with
 * blue sky, banners, a royal red carpet, flower pots.
 * Pieces: little toy knights on hobby horses (walkers; the wand makes them wave and stay),
 * rolling balls of yarn (rollers; the wand turns them into a sleepy kitten), a treasure chest to
 * push, golden cushion stepping stones, and the finale's little dragon. Jewel: the Heart Jewel.
 */
export const castleTheme: Theme = {
  key: 'castle',

  paintFar(ctx, w, h) {
    skyGradient(ctx, w, h, '#ffd8e8', '#f4c8dc');
    // Stone blocks.
    for (let y = 0; y < h; y += 12) for (let x = (y / 12) % 2 ? 0 : 12; x < w; x += 24) px(ctx, '#ecbcd0', x, y, 1, 12);
    for (let y = 0; y < h; y += 12) px(ctx, '#ecbcd0', 0, y, w, 1);
    // Tall arched windows with blue sky and a cloud.
    for (const wx of [50, 210]) {
      fill(ctx, w, h, (x, y) => x >= wx && x < wx + 30 && y >= 30 && y < 100 && (y > 45 || (x - wx - 15) ** 2 + (y - 45) ** 2 <= 225), '#a8e0ff');
      fill(ctx, w, h, (x, y) => (x - wx - 10) ** 2 / 36 + (y - 70) ** 2 / 9 <= 1, '#ffffff');
      px(ctx, '#c8945a', wx + 14, 30, 2, 70);
      px(ctx, '#c8945a', wx, 64, 30, 2);
    }
  },

  paintMiddle(ctx, w, h) {
    // Pillars and royal banners with a little crown.
    for (const bx of [10, 120, 170, 290]) {
      px(ctx, '#f0d0e0', bx, 0, 12, h);
      px(ctx, '#d8a8c0', bx + 10, 0, 2, h);
    }
    for (const bx of [140, 300]) {
      shape(ctx, w, h, (x, y) => x >= bx && x < bx + 16 && y >= 6 && y < 40 + (Math.abs(x - bx - 8) < 4 ? 0 : 4), '#c9405a');
      px(ctx, '#ffd23f', bx + 4, 16, 8, 3);
      px(ctx, '#ffd23f', bx + 4, 13, 2, 3);
      px(ctx, '#ffd23f', bx + 7, 12, 2, 4);
      px(ctx, '#ffd23f', bx + 10, 13, 2, 3);
    }
  },

  paintNear(ctx, w, h) {
    // Flower pots along the hall.
    for (let i = 0; i < 8; i++) {
      const x = (i * 43 + 15) % w;
      shape(ctx, w, h, rect(x, 26, 10, 9), '#d87a4a');
      for (const [dx, c] of [[1, '#ff86bf'], [5, '#ffd23f'], [9, '#ffffff']] as const) {
        px(ctx, '#3fa04a', x + dx, 20, 1, 6);
        flower(ctx, x + dx, 19, c);
      }
    }
  },

  paintTiles(ctx) {
    standardTiles(ctx, {
      top: '#d83a5a',
      topDark: '#ffd23f',
      fill: '#e8c8d8',
      fillDark: '#c8a0b8',
      platform: '#f0d0e0',
      platformDark: '#ffd23f',
      sprinkle: ['#ffd23f', '#ffd23f', '#ffd23f'],
    });
    // Stone-block lines under the royal carpet.
    px(ctx, '#c8a0b8', 0, 11, 32, 1);
    px(ctx, '#c8a0b8', 8, 6, 1, 5);
    px(ctx, '#c8a0b8', 24, 0, 1, 11);
  },

  makeSprites(scene) {
    const knight = (key: string, friendly: boolean) =>
      frames(scene, key, 2, 16, 16, (ctx, f) => {
        const W = 16;
        const H = 16;
        // Hobby horse: a stick with a soft horse head bobbing in front.
        px(ctx, '#c8945a', 3, 7 + f, 10, 1);
        shape(ctx, W, H, any(ell(2.5, 6 + f, 2.5, 2), rect(1, 3 + f, 2, 3)), '#ffffff');
        px(ctx, CSS.outline, 1, 5 + f);
        // The little knight: round helmet with a plume, friendly face.
        const body = any(ell(9, 11, 4, 4), ell(9, 5, 3.6, 3.6));
        shape(ctx, W, H, body, '#d8d8e8');
        shadeBottom(ctx, W, H, body, '#a8a8c0');
        px(ctx, '#ff6b8a', 10, 0, 3, 2); // plume
        px(ctx, '#ffe0c8', 7, 4, 4, 3); // face in the helmet opening
        eyes(ctx, [7, 9], 4, friendly ? 'happy' : 'calm');
        for (const x of [7 + f, 10 - f]) px(ctx, CSS.outline, x, 14, 2, 2); // feet
        if (friendly) {
          px(ctx, '#ffe0c8', 13, 6 - f, 2, 2); // waving hand
          cheeks(ctx, [6], 6);
        }
      });

    const yarn = frames(scene, 'castle-yarn', 2, 14, 14, (ctx, f) => {
      const b = ell(7, 7, 6, 6);
      shape(ctx, 14, 14, b, '#ff9fd8');
      fill(ctx, 14, 14, (x, y) => b(x, y) && (x + y * (f ? 1 : -1) + 20) % 4 === 0, '#f070b8'); // wound strands
      px(ctx, '#ff9fd8', 12, 11, 2, 1); // a loose end
    });

    const kitten = frames(scene, 'castle-kitten', 1, 16, 12, (ctx) => {
      // A sleepy kitten curled up (what the yarn becomes).
      const b = any(ell(8, 8, 7, 3.6), ell(4, 5.5, 3.4, 3), rect(1, 2, 1, 2), rect(6, 2, 1, 2));
      shape(ctx, 16, 12, b, '#ffd0a0');
      fill(ctx, 16, 12, (x, y) => b(x, y) && y > 5 && x % 4 === 0, '#f0a870');
      eyes(ctx, [3], 5, 'happy');
      cheeks(ctx, [1], 7);
    });

    const chest = frames(scene, 'castle-chest', 1, 16, 16, (ctx) => {
      const b = any(rect(1, 6, 14, 9), ell(8, 6, 7, 4));
      shape(ctx, 16, 16, b, '#c8784a');
      shadeBottom(ctx, 16, 16, b, '#9a5a34', 2);
      px(ctx, '#ffd23f', 1, 7, 14, 2);
      px(ctx, '#ffd23f', 7, 9, 2, 3); // lock
    });

    const cushion = frames(scene, 'castle-cushion', 2, 16, 10, (ctx, f) => {
      const c = ell(8, 5, 7.5, 4);
      shape(ctx, 16, 10, c, f ? '#ffd23f' : '#c9405a');
      px(ctx, f ? '#fff6b0' : '#e86a88', 4, 3, 8, 1);
      px(ctx, '#ffd23f', 1, 4, 1, 2);
      px(ctx, '#ffd23f', 14, 4, 1, 2); // tassels
    });

    const wallBlock = frames(scene, 'castle-block', 1, 16, 16, (ctx) => {
      const b = rect(1, 1, 14, 14);
      shape(ctx, 16, 16, b, '#f0d0e0');
      shadeBottom(ctx, 16, 16, b, '#c8a0b8', 3);
      px(ctx, '#c8a0b8', 1, 7, 14, 1);
      px(ctx, '#c8a0b8', 8, 1, 1, 6);
    });

    const plank = frames(scene, 'castle-plank', 1, 16, 8, (ctx) => {
      px(ctx, CSS.outline, 0, 0, 16, 8);
      px(ctx, '#f0d0e0', 1, 1, 14, 5);
      px(ctx, '#ffd23f', 1, 6, 14, 1);
    });

    return {
      walker: knight('castle-knight', false),
      walkerFriend: knight('castle-knight-friend', true),
      walkerFriendStays: true,
      roller: yarn,
      rollerFriend: kitten,
      crate: chest,
      stone: cushion,
      wall: wallBlock,
      plank,
    };
  },

  jewel: { cut: 'heart', light: '#fff2a0', mid: '#ffc84a', dark: '#d89a20' },
  jewelGlow: [0xffc84a, 0xff9fd8, 0xffe066, 0xff6fb5],
};

/**
 * The finale's little dragon (decoration). Faces left, toward Leighton. 4 frames:
 *  0 sleepy & grumpy (arms crossed, frown)   1 waking up (eyes open, unsure)
 *  2 smiling                                  3 happy hug (arms wide open, big smile)
 */
export function dragonTexture(scene: Phaser.Scene): string {
  const key = 'castle-dragon';
  if (scene.textures.exists(key)) return key;
  const W = 44;
  const H = 40;
  return frames(scene, key, 4, W, H, (ctx, f) => {
    const green = '#8fe0a0';
    const shade = '#5cb878';
    // Tail curling behind, small wings.
    shape(ctx, W, H, any(ell(36, 33, 7, 3.5), ell(41, 29, 2.5, 2.5)), green);
    shape(ctx, W, H, any(ell(31, 15, 7, 5), ell(35, 11, 4, 3)), '#c9a3ff');
    // Round body with a cream belly.
    const body = ell(24, 27, 12, 11);
    shape(ctx, W, H, body, green);
    fill(ctx, W, H, ell(22, 29, 7, 8), '#fff0b0');
    fill(ctx, W, H, (x, y) => ell(22, 29, 7, 8)(x, y) && y % 3 === 0, '#f0dc90'); // belly stripes
    shadeBottom(ctx, W, H, body, shade, 2);
    // Feet.
    shape(ctx, W, H, any(ell(16, 37, 4, 2.5), ell(30, 37, 4, 2.5)), green);
    // Head (facing left) with little round horns and spikes.
    const head = any(ell(13, 13, 9, 7.5), ell(6, 16, 5.5, 4));
    shape(ctx, W, H, any(rect(13, 2, 2, 4), rect(19, 3, 2, 4)), '#ffd23f');
    shape(ctx, W, H, head, green);
    shadeBottom(ctx, W, H, head, shade, 1);
    px(ctx, shade, 2, 15, 1, 1); // nostril
    // Face changes with his mood.
    if (f === 0) {
      // Sleepy and grumpy: droopy eyelids, a little frown.
      px(ctx, CSS.outline, 9, 11, 3, 1);
      px(ctx, CSS.outline, 15, 11, 3, 1);
      px(ctx, CSS.outline, 6, 19, 4, 1);
      px(ctx, CSS.outline, 5, 20);
      px(ctx, CSS.outline, 10, 20);
    } else {
      eyes(ctx, [10, 16], 10, f >= 2 ? 'happy' : 'calm');
      if (f === 1) px(ctx, CSS.outline, 6, 19, 4, 1);
      else smile(ctx, 8, 18, true);
      if (f >= 2) cheeks(ctx, [7, 18], 15, '#ff9fc8');
    }
    // Arms: crossed (grumpy), resting, then open wide for a hug.
    if (f === 0 || f === 1) shape(ctx, W, H, rect(15, 23, 14, 4), green);
    else if (f === 2) shape(ctx, W, H, any(ell(14, 27, 3, 2.5), ell(32, 27, 3, 2.5)), green);
    else shape(ctx, W, H, any(ell(8, 22, 5, 2.5), ell(3, 19, 2.5, 2.5)), green);
  });
}
