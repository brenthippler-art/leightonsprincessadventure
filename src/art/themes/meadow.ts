import { CSS } from '../../constants';
import { any, clouds, ell, eyes, fill, flower, frames, px, rect, shadeBottom as shade, shape, skyGradient, smile, standardTiles, wavyFill } from './common';
import type { Theme } from './types';

/**
 * LEVEL 1: FLOWER MEADOW. Blue sky, rolling green hills, flowers everywhere.
 * Pieces: bees (walk and float) that become butterflies, hedge walls. Jewel: Ruby.
 */
export const meadowTheme: Theme = {
  key: 'meadow',

  paintFar(ctx, w, h) {
    skyGradient(ctx, w, h, '#8fd8ff', '#e8f8ff');
    clouds(ctx, [[50, 28, 1], [170, 16, 0.7], [260, 40, 1.1]], '#ffffff');
  },

  paintMiddle(ctx, w, h) {
    const tops = wavyFill(ctx, w, h, 28, [[12, 2, 0.4], [7, 3, 1.1], [3, 7, 0.2]], '#9fe39a', '#c7f2b8');
    // Tiny far-away flowers dotted over the hills.
    const colors = ['#ff9fc8', '#ffffff', '#ffe066'];
    for (let i = 0; i < 40; i++) {
      const x = (i * 37 + 5) % w;
      px(ctx, colors[i % 3], x, tops[x] + 6 + ((i * 13) % 30));
    }
  },

  paintNear(ctx, w, h) {
    wavyFill(ctx, w, h, 10, [[5, 6, 0], [3, 13, 2], [2, 19, 1]], '#4fae5a', '#6fcf73');
    const petals = ['#ff86bf', '#ffffff', '#ffd84a', '#c9a3ff'];
    for (let i = 0; i < 16; i++) {
      const x = (i * 21 + 7) % w;
      const y = 14 + ((i * 11) % 10);
      px(ctx, '#3f9a4a', x, y + 1, 1, 6); // stem
      flower(ctx, x, y, petals[i % petals.length]);
    }
  },

  paintTiles(ctx) {
    standardTiles(ctx, {
      top: '#7ee07a',
      topDark: '#3fa04a',
      fill: '#c98a5a',
      fillDark: '#8a5534',
      platform: '#ffd98a',
      platformDark: '#c99a4a',
      sprinkle: ['#ff86bf', '#ffffff', '#ffe066'],
    });
  },

  makeSprites(scene) {
    // A round, friendly bee (never a stinger). Wings flap between the two frames.
    const bee = frames(scene, 'meadow-bee', 2, 16, 14, (ctx, f) => {
      const W = 16;
      const H = 14;
      const wings = f === 0 ? any(ell(6, 4, 2.6, 2.6), ell(10, 4, 2.6, 2.6)) : any(ell(5, 5.5, 3, 1.6), ell(11, 5.5, 3, 1.6));
      shape(ctx, W, H, wings, '#e8f8ff');
      const body = ell(8, 9, 5.5, 4);
      shape(ctx, W, H, body, '#ffd84a');
      fill(ctx, W, H, (x, y) => body(x, y) && (x === 6 || x === 9), '#4a3a5a'); // stripes
      shade(ctx, W, H, body, '#e8a830');
      eyes(ctx, [11], 8, 'calm');
      smile(ctx, 12, 10);
      px(ctx, '#4a3a5a', 12, 4, 1, 2); // antenna
      px(ctx, '#4a3a5a', 13, 3);
    });

    // The butterfly a bee turns into.
    const butterfly = frames(scene, 'meadow-butterfly', 2, 14, 12, (ctx, f) => {
      const W = 14;
      const H = 12;
      const open = f === 0;
      const wings = open
        ? any(ell(3.5, 4, 3.2, 3.2), ell(10.5, 4, 3.2, 3.2), ell(4.5, 8.5, 2.4, 2.2), ell(9.5, 8.5, 2.4, 2.2))
        : any(ell(5, 4.5, 2, 3.2), ell(9, 4.5, 2, 3.2), ell(5.5, 8.5, 1.5, 2), ell(8.5, 8.5, 1.5, 2));
      shape(ctx, W, H, wings, '#ff9fd8');
      fill(ctx, W, H, (x, y) => wings(x, y) && y >= 7, '#c9a3ff');
      px(ctx, CSS.gold, open ? 3 : 5, 4);
      px(ctx, CSS.gold, open ? 10 : 8, 4);
      px(ctx, CSS.outline, 6, 2, 2, 9); // body
      px(ctx, CSS.outline, 5, 1);
      px(ctx, CSS.outline, 8, 1);
    });

    // A neat hedge block with flowers (the low and tall walls).
    const hedge = frames(scene, 'meadow-hedge', 1, 16, 16, (ctx) => {
      const body = any(rect(1, 2, 14, 13), ell(8, 3, 6.5, 2.5));
      shape(ctx, 16, 16, body, '#5cc46a');
      shade(ctx, 16, 16, body, '#3f9a4a', 3);
      fill(ctx, 16, 16, (x, y) => body(x, y) && (x * 7 + y * 3) % 11 === 0 && y < 12, '#8fe08a');
      flower(ctx, 5, 6, '#ff86bf');
      flower(ctx, 11, 9, '#ffffff');
    });

    return {
      walker: bee,
      walkerFriend: butterfly,
      flyer: bee,
      flyerFriend: butterfly,
      wall: hedge,
    };
  },

  jewel: { cut: 'round', light: '#ff9aa8', mid: '#e8304a', dark: '#9a1030' },
};
