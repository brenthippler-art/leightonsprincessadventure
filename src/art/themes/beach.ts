import { CSS } from '../../constants';
import { any, cheeks, ell, eyes, fill, frames, px, rect, shadeBottom, shape, skyGradient, smile, standardTiles, wave, wavyFill } from './common';
import type { Theme } from './types';

/**
 * LEVEL 3: SUNNY BEACH. Bright sky, a sparkling sea on the horizon, sand dunes and palm trees.
 * Pieces: sideways-walking crabs (who become waving, smiling crabs), rolling beach balls,
 * seashell bounce pads, sandcastle stepping stones, and shallow water in the gaps. Jewel: Aquamarine.
 */
export const beachTheme: Theme = {
  key: 'beach',
  waterInGaps: true,

  paintFar(ctx, w, h) {
    skyGradient(ctx, w, 120, '#7fd4ff', '#fff3d6');
    // Big friendly sun.
    ctx.fillStyle = '#ffe680';
    for (let y = -13; y <= 13; y++) for (let x = -13; x <= 13; x++) if (x * x + y * y <= 169) ctx.fillRect(60 + x, 32 + y, 1, 1);
    // The sea on the horizon, with little white wave lines.
    px(ctx, '#4fc3e8', 0, 120, w, h - 120);
    px(ctx, '#7fd8f2', 0, 120, w, 2);
    for (let i = 0; i < 18; i++) px(ctx, '#e8fbff', (i * 47 + 9) % w, 126 + ((i * 7) % 40), 6, 1);
  },

  paintMiddle(ctx, w, h) {
    wavyFill(ctx, w, h, 46, [[6, 2, 0.8], [4, 5, 0.1]], '#f7dfa0', '#fff0c4');
    // Two far palm trees.
    for (const bx of [70, 230]) {
      for (let y = 0; y < 34; y++) px(ctx, '#a8784a', bx + Math.round(Math.sin(y / 9) * 2), 20 + y, 2, 1);
      for (const [dx, dy] of [[-8, 18], [8, 18], [-5, 15], [5, 15], [0, 14]]) px(ctx, '#4fae5a', bx + dx - 3, dy, 7, 2);
    }
  },

  paintNear(ctx, w, h) {
    for (let x = 0; x < w; x++) {
      const top = Math.round(20 + wave(x, [[3, 7, 0], [2, 15, 1]]));
      px(ctx, '#f0d090', x, top, 1, h - top);
    }
    // Beach grass tufts and shells.
    for (let i = 0; i < 12; i++) {
      const x = (i * 29 + 5) % w;
      px(ctx, '#7fc46a', x, 14, 1, 8);
      px(ctx, '#7fc46a', x + 2, 16, 1, 6);
      px(ctx, '#ff9fb8', (x + 13) % w, 30, 2, 1);
    }
  },

  paintTiles(ctx) {
    standardTiles(ctx, {
      top: '#ffe3a3',
      topDark: '#e8c27a',
      fill: '#f2cf8a',
      fillDark: '#d9b06a',
      platform: '#c8945a',
      platformDark: '#9a6a3a',
      sprinkle: ['#ff9fb8', '#ffffff', '#ffd0a0'],
    });
    px(ctx, '#fff3cf', 0, 0, 16, 1); // sunlit top edge of the sand
  },

  makeSprites(scene) {
    const crab = (key: string, friendly: boolean) =>
      frames(scene, key, 2, 16, 12, (ctx, f) => {
        const W = 16;
        const H = 12;
        const color = friendly ? '#ff9a8a' : '#ff7a5a';
        // Legs scuttle between frames.
        for (const [x, k] of [[3, 0], [5, 1], [10, 0], [12, 1]]) px(ctx, CSS.outline, x, 9 + ((f + k) % 2), 1, 2);
        const claws = friendly
          ? any(ell(2.5, 2.5 + f, 2.2, 2.2), ell(13.5, 2.5 + (1 - f), 2.2, 2.2)) // waving up high
          : any(ell(2, 6, 2, 2), ell(14, 6, 2, 2));
        shape(ctx, W, H, claws, color);
        const body = ell(8, 7.5, 5.5, 3.5);
        shape(ctx, W, H, body, color);
        shadeBottom(ctx, W, H, body, friendly ? '#e87a6a' : '#d4503a');
        eyes(ctx, [6, 9], 4, friendly ? 'happy' : 'calm');
        if (friendly) {
          smile(ctx, 8, 7, true);
          cheeks(ctx, [4, 11], 7, '#ffd0d8');
        } else px(ctx, CSS.outline, 7, 8, 2, 1);
      });

    const ball = frames(scene, 'beach-ball', 2, 14, 14, (ctx, f) => {
      const b = ell(7, 7, 6, 6);
      shape(ctx, 14, 14, b, '#ffffff');
      const stripes = ['#ff6b6b', '#4f9dff', '#ffd84a'];
      fill(ctx, 14, 14, (x, y) => b(x, y) && Math.floor((x + y + f * 2) / 3) % 2 === 0, stripes[0]);
      fill(ctx, 14, 14, (x, y) => b(x, y) && Math.floor((x - y + 20 + f * 2) / 3) % 3 === 0, stripes[1]);
      px(ctx, '#ffffff', 4, 3, 2, 2);
    });

    const shellPad = frames(scene, 'beach-shellpad', 2, 16, 10, (ctx, f) => {
      const top = f === 0 ? 1 : 4;
      const shell = (x: number, y: number) => y >= top && y <= 9 && ((x + 0.5 - 8) / 7.5) ** 2 + ((y + 0.5 - 10) / (10 - top)) ** 2 <= 1;
      shape(ctx, 16, 10, shell, '#ffb8c8');
      fill(ctx, 16, 10, (x, y) => shell(x, y) && (x === 4 || x === 8 || x === 12), '#ff86a8'); // ridges
      fill(ctx, 16, 10, (x, y) => shell(x, y) && y === top + 1, '#ffe0e8');
    });

    const castle = frames(scene, 'beach-castle', 2, 16, 12, (ctx, f) => {
      const c = any(rect(1, 5, 14, 7), rect(1, 2, 3, 3), rect(6, 2, 4, 3), rect(12, 2, 3, 3));
      shape(ctx, 16, 12, c, f ? '#ffe9a8' : '#f2cf8a');
      shadeBottom(ctx, 16, 12, c, '#d9b06a');
      px(ctx, CSS.outline, 7, 8, 2, 3); // door
      if (f) {
        // Lit: a pink flag pops up on top and the sand glows.
        px(ctx, CSS.outline, 8, 0, 1, 3);
        px(ctx, '#ff6fb5', 9, 0, 3, 2);
      }
    });

    const block = frames(scene, 'beach-block', 1, 16, 16, (ctx) => {
      const b = rect(1, 1, 14, 14);
      shape(ctx, 16, 16, b, '#ffe9a8');
      shadeBottom(ctx, 16, 16, b, '#d9b06a', 3);
    });

    return {
      walker: crab('beach-crab', false),
      walkerFriend: crab('beach-crab-friend', true),
      walkerFriendStays: true,
      roller: ball,
      pad: shellPad,
      stone: castle,
      block,
    };
  },

  jewel: { cut: 'oval', light: '#e0fbff', mid: '#6fd8f0', dark: '#2f9ec0' },
};
