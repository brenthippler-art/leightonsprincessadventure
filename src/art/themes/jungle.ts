import { CSS } from '../../constants';
import {
  any,
  cheeks,
  ell,
  eyes,
  fill,
  flower,
  frames,
  px,
  shadeBottom,
  shape,
  skyGradient,
  smile,
  standardTiles,
  wave,
  wavyFill,
} from './common';
import type { Theme } from './types';

/**
 * LEVEL 2: ENCHANTED JUNGLE. Warm misty sky, layers of leafy trees, big ferns.
 * Giraffes (always friendly!) are the stars. Pieces: hopping frogs, rolling coconuts,
 * big-leaf bounce pads, swinging vine planks. Jewel: Emerald.
 */
export const jungleTheme: Theme = {
  key: 'jungle',

  paintFar(ctx, w, h) {
    skyGradient(ctx, w, h, '#bff4dc', '#fff8c8');
    // Soft sun glow, and far misty tree tops.
    ctx.fillStyle = '#fffbe0';
    for (let y = -14; y <= 14; y++) for (let x = -14; x <= 14; x++) if (x * x + y * y <= 196) ctx.fillRect(250 + x, 34 + y, 1, 1);
    wavyFill(ctx, w, h, 120, [[8, 4, 0], [5, 9, 1], [3, 17, 2]], '#a8e0b8');
  },

  paintMiddle(ctx, w, h) {
    // Tree trunks first, then a bumpy canopy over them.
    for (let i = 0; i < 8; i++) px(ctx, '#7a5a3a', (i * 41 + 13) % w, 30, 4, h - 30);
    wavyFill(ctx, w, h, 22, [[7, 5, 0], [5, 11, 1.5], [3, 23, 0.7]], '#5fbf7a', '#8fdc9a');
    fill(ctx, w, h, (x, y) => y > 40 && (x * 3 + y * 5) % 17 === 0, '#4aa866');
  },

  paintNear(ctx, w, h) {
    // Big fern leaves fanning up from the ground.
    for (let x = 0; x < w; x++) {
      const top = Math.round(8 + wave(x, [[6, 8, 0], [4, 16, 1.2]]));
      px(ctx, '#2f8a4a', x, top, 1, h - top);
      if ((x + top) % 3 === 0) px(ctx, '#3fae5a', x, top + 2, 1, h - top - 4);
    }
    for (let i = 0; i < 9; i++) flower(ctx, (i * 37 + 11) % w, 18 + ((i * 7) % 12), '#ff9a4a', '#fff2a0');
  },

  paintTiles(ctx) {
    standardTiles(ctx, {
      top: '#5fd06a',
      topDark: '#2f8a3f',
      fill: '#a8603a',
      fillDark: '#7a4026',
      platform: '#9a6a3a',
      platformDark: '#6b4424',
      sprinkle: ['#ff9a4a', '#ffffff', '#ffd84a'],
    });
    // Treetop platform: a bark branch with leaves hanging underneath.
    px(ctx, CSS.outline, 32, 0, 16, 7);
    px(ctx, '#9a6a3a', 32, 1, 16, 4);
    px(ctx, '#6b4424', 32, 5, 16, 1);
    for (const [x, y] of [[34, 7], [39, 9], [44, 7], [37, 11]]) {
      px(ctx, '#3fae5a', x, y, 3, 2);
      px(ctx, '#2f8a4a', x + 1, y + 2, 1, 1);
    }
  },

  makeSprites(scene) {
    const frog = (key: string, friendly: boolean) =>
      frames(scene, key, 2, 16, 14, (ctx, f) => {
        const W = 16;
        const H = 14;
        const crouch = f === 1;
        const by = crouch ? 10 : 9;
        const body = any(ell(8, by, 6.5, crouch ? 3.5 : 4.5), ell(4.5, by - 4.5, 2.4, 2.4), ell(11.5, by - 4.5, 2.4, 2.4));
        shape(ctx, W, H, body, friendly ? '#8fe07a' : '#6cc45a');
        shadeBottom(ctx, W, H, body, friendly ? '#5cb04a' : '#4a9a3e');
        fill(ctx, W, H, (x, y) => ell(8, by + 1.5, 4, 2)(x, y), '#d8f5b0'); // belly
        eyes(ctx, [4, 11], by - 5, friendly ? 'happy' : 'calm');
        if (friendly) {
          smile(ctx, 8, by - 1, true);
          cheeks(ctx, [2, 12], by - 2);
          flower(ctx, 8, by - 7, '#ff86bf');
        } else {
          px(ctx, CSS.outline, 7, by - 1, 3, 1); // calm little mouth
        }
      });

    const coconut = frames(scene, 'jungle-coconut', 2, 14, 14, (ctx, f) => {
      const ball = ell(7, 7, 6, 6);
      shape(ctx, 14, 14, ball, '#9a6a3a');
      shadeBottom(ctx, 14, 14, ball, '#6b4424');
      // Hairy fibers that move between frames, so it looks like it's rolling.
      fill(ctx, 14, 14, (x, y) => ball(x, y) && (x * 2 + y + f * 3) % 5 === 0, '#c8945a');
    });

    const sprout = frames(scene, 'jungle-sprout', 1, 16, 12, (ctx) => {
      px(ctx, '#7a4026', 7, 7, 2, 5);
      for (const [cx, cy] of [[4, 6], [12, 6], [8, 3]]) shape(ctx, 16, 12, ell(cx, cy, 3.5, 2.2), '#5fd06a');
      flower(ctx, 8, 3, '#ff86bf');
    });

    const leafPad = frames(scene, 'jungle-leafpad', 2, 16, 10, (ctx, f) => {
      const top = f === 0 ? 2 : 5;
      const leaf = (x: number, y: number) => y >= top && y <= 9 && ((x + 0.5 - 8) / 7.5) ** 2 + ((y + 0.5 - 9) / (9.5 - top)) ** 2 <= 1;
      shape(ctx, 16, 10, leaf, '#5fd06a');
      fill(ctx, 16, 10, (x, y) => leaf(x, y) && x === 8, '#2f8a3f'); // the vein
      fill(ctx, 16, 10, (x, y) => leaf(x, y) && y === top + 1, '#a8f0a0');
    });

    const plank = frames(scene, 'jungle-vineplank', 1, 32, 8, (ctx) => {
      px(ctx, CSS.outline, 0, 0, 32, 8);
      px(ctx, '#c8945a', 1, 1, 30, 4);
      px(ctx, '#9a6a3a', 1, 5, 30, 2);
      for (const x of [8, 16, 24]) px(ctx, '#9a6a3a', x, 1, 1, 4);
      for (const x of [2, 27]) px(ctx, '#3fae5a', x, 0, 3, 2);
    });

    return {
      hopper: frog('jungle-frog', false),
      hopperFriend: frog('jungle-frog-friend', true),
      roller: coconut,
      rollerFriend: sprout,
      pad: leafPad,
      vinePlank: plank,
    };
  },

  jewel: { cut: 'step', light: '#a8f5c0', mid: '#2fc46a', dark: '#137a3e' },
};

