import { CSS } from '../../constants';
import { any, cheeks, ell, eyes, fill, frames, mix, px, rect, shadeBottom, shape, skyGradient, smile, standardTiles, wavyFill } from './common';
import type { Theme } from './types';

/**
 * LEVEL 9: TOY WORKSHOP. A warm wooden workshop with shelves of toys and a striped rug.
 * Pieces: wind-up toy mice (walkers; the wand makes them happy and they keep scooting),
 * bouncing balls (hoppers), building-block platforms and walls, a toy train car that carries her
 * over gaps (moving platform), a toy box to push, block planks for the bridge. Jewel: Sapphire.
 */
const BLOCKS = ['#ff6b6b', '#4f9dff', '#ffd23f', '#5ee07a'];

export const toysTheme: Theme = {
  key: 'toys',

  paintFar(ctx, w, h) {
    skyGradient(ctx, w, h, '#ffe8c8', '#ffd8a8');
    // Wooden wall planks and round windows with blue sky.
    for (let x = 0; x < w; x += 24) px(ctx, '#f0c890', x, 0, 1, h);
    for (const wx of [60, 220]) {
      for (let y = -14; y <= 14; y++)
        for (let x = -14; x <= 14; x++) {
          const d = Math.hypot(x, y);
          if (d <= 14) px(ctx, d > 12 ? '#c8945a' : '#a8e0ff', wx + x, 50 + y);
        }
      px(ctx, '#c8945a', wx - 12, 49, 25, 2);
      px(ctx, '#c8945a', wx - 1, 38, 2, 25);
    }
  },

  paintMiddle(ctx, w, h) {
    // Shelves with toys on them.
    for (const sy of [20, 52]) {
      px(ctx, '#b07a4a', 0, sy, w, 4);
      px(ctx, '#8a5a34', 0, sy + 4, w, 1);
      for (let i = 0; i < 9; i++) {
        const x = (i * 37 + (sy === 20 ? 6 : 22)) % w;
        const c = BLOCKS[(i + sy) % BLOCKS.length];
        if (i % 3 === 0) {
          // a little teddy bear
          shape(ctx, w, h, any(ell(x + 6, sy - 6, 5, 5), ell(x + 2, sy - 11, 2, 2), ell(x + 10, sy - 11, 2, 2), ell(x + 6, sy - 13, 4, 3.5)), '#d8a46a');
        } else {
          shape(ctx, w, h, rect(x, sy - 10, 10, 10), c);
          px(ctx, '#ffffff', x + 3, sy - 7, 4, 4);
        }
      }
    }
  },

  paintNear(ctx, w, h) {
    wavyFill(ctx, w, h, 26, [[1, 10, 0]], '#ffd0a0');
    // Far-off toys on the floor: drawn PALE and without outlines, so they clearly look like
    // background and never like real blocks she has to jump over.
    for (let i = 0; i < 10; i++) {
      const x = (i * 33 + 5) % w;
      fill(ctx, w, h, rect(x, 20, 7, 7), mix(BLOCKS[i % BLOCKS.length], '#ffd0a0', 0.65));
    }
  },

  paintTiles(ctx) {
    standardTiles(ctx, {
      top: '#ff9fb8',
      topDark: '#d86a88',
      fill: '#d8a46a',
      fillDark: '#b07a4a',
      platform: '#4f9dff',
      platformDark: '#2f6fd0',
      sprinkle: ['#ffd23f', '#5ee07a', '#4f9dff'],
    });
    // Rug stripes on top; floorboard lines below.
    for (let x = 0; x < 16; x += 4) px(ctx, '#ffd23f', x, 1, 2, 2);
    px(ctx, '#b07a4a', 0, 10, 32, 1);
    // Building-block platform: a red block with a white letter-dot and studs on top.
    px(ctx, CSS.outline, 32, 0, 16, 12);
    px(ctx, '#ff6b6b', 33, 1, 14, 10);
    px(ctx, '#d84a4a', 33, 9, 14, 2);
    px(ctx, '#ffffff', 38, 3, 4, 4);
    px(ctx, '#ff9a9a', 34, 1, 3, 1);
    px(ctx, '#ff9a9a', 43, 1, 3, 1);
  },

  makeSprites(scene) {
    const mouse = (key: string, friendly: boolean) =>
      frames(scene, key, 2, 18, 12, (ctx, f) => {
        const W = 18;
        const H = 12;
        // The wind-up key on its back turns between frames.
        px(ctx, CSS.outline, 9, 1, 1, 3);
        px(ctx, '#ffd23f', f ? 7 : 8, f ? 1 : 0, f ? 5 : 3, f ? 1 : 2);
        const body = any(ell(9, 7, 6.5, 4), ell(3.5, 7.5, 3, 2.6), ell(5, 3.5, 2, 2));
        shape(ctx, W, H, body, friendly ? '#ffc8e0' : '#b8b0c8');
        shadeBottom(ctx, W, H, body, friendly ? '#f0a0c0' : '#8f88a8');
        px(ctx, '#ffb0c0', 4, 3, 2, 1); // ear
        px(ctx, '#ff86bf', 0, 8); // nose
        eyes(ctx, [3], 6, friendly ? 'happy' : 'calm');
        if (friendly) cheeks(ctx, [5], 8);
        px(ctx, CSS.outline, 15, 8, 3, 1); // tail
        for (const x of [6, 11]) px(ctx, CSS.outline, x + f, 11, 2, 1); // little wheels
      });

    const ball = (key: string, friendly: boolean) =>
      frames(scene, key, 2, 14, 14, (ctx, f) => {
        const squash = f === 1;
        const b = ell(7, squash ? 8.5 : 7, squash ? 6.5 : 6, squash ? 5 : 6);
        shape(ctx, 14, 14, b, '#ff6b6b');
        fill(ctx, 14, 14, (x, y) => b(x, y) && y >= (squash ? 8 : 7) && y <= (squash ? 9 : 8), '#ffd23f'); // stripe
        shadeBottom(ctx, 14, 14, b, '#d84a4a');
        px(ctx, '#ffffff', 4, squash ? 5 : 3, 2, 1);
        if (friendly) {
          eyes(ctx, [5, 8], squash ? 6 : 5, 'happy');
          smile(ctx, 7, squash ? 9 : 8);
        }
      });

    const abc = frames(scene, 'toys-abc', 1, 16, 16, (ctx) => {
      const b = rect(1, 1, 14, 14);
      shape(ctx, 16, 16, b, '#5ee07a');
      shadeBottom(ctx, 16, 16, b, '#3fae5a', 3);
      px(ctx, '#ffffff', 4, 4, 8, 7);
      px(ctx, '#4f9dff', 6, 5, 4, 1);
      px(ctx, '#4f9dff', 6, 5, 1, 5);
      px(ctx, '#4f9dff', 9, 5, 1, 5);
      px(ctx, '#4f9dff', 6, 7, 4, 1); // a friendly "A" shape (a picture, not something to read)
    });

    const toybox = frames(scene, 'toys-box', 1, 16, 16, (ctx) => {
      const b = rect(1, 3, 14, 12);
      shape(ctx, 16, 16, b, '#4f9dff');
      shadeBottom(ctx, 16, 16, b, '#2f6fd0', 3);
      px(ctx, '#ffd23f', 1, 6, 14, 2);
      px(ctx, CSS.outline, 0, 2, 16, 2);
      px(ctx, '#ff6b6b', 6, 1, 4, 2); // a toy peeking out
    });

    const plank = frames(scene, 'toys-plank', 1, 16, 8, (ctx) => {
      px(ctx, CSS.outline, 0, 0, 16, 8);
      px(ctx, '#ffd23f', 1, 1, 7, 6);
      px(ctx, '#4f9dff', 8, 1, 7, 6);
    });

    const train = frames(scene, 'toys-train', 1, 32, 14, (ctx) => {
      // A flat-topped toy train car: roof is the platform she stands on.
      px(ctx, CSS.outline, 0, 0, 32, 11);
      px(ctx, '#ff6b6b', 1, 1, 30, 9);
      px(ctx, '#ff9a9a', 1, 1, 30, 1);
      px(ctx, '#ffd23f', 4, 3, 7, 4);
      px(ctx, '#ffd23f', 21, 3, 7, 4); // windows
      for (const wx of [7, 24]) {
        shape(ctx, 32, 14, ell(wx, 11, 3, 3), '#4a3a5a');
        px(ctx, '#c8c0d8', wx, 11);
      }
    });

    const stone = frames(scene, 'toys-stone', 2, 16, 10, (ctx, f) => {
      const b = rect(1, 1, 14, 8);
      shape(ctx, 16, 10, b, f ? '#ffd23f' : '#d8d0e0');
      px(ctx, f ? '#fff6b0' : '#ece8f0', 2, 2, 12, 1);
      px(ctx, f ? '#ffffff' : '#c0b8cc', 4, 0, 2, 1);
      px(ctx, f ? '#ffffff' : '#c0b8cc', 10, 0, 2, 1); // studs
    });

    return {
      walker: mouse('toys-mouse', false),
      walkerFriend: mouse('toys-mouse-friend', true),
      walkerFriendStays: true,
      hopper: ball('toys-ball', false),
      hopperFriend: ball('toys-ball-friend', true),
      wall: abc,
      crate: toybox,
      plank,
      movingPlatform: train,
      stone,
    };
  },

  jewel: { cut: 'round', light: '#8fb0ff', mid: '#2f5fe0', dark: '#16308a' },
};
