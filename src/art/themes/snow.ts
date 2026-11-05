import { any, cheeks, ell, eyes, fill, frames, px, rect, shadeBottom, shape, skyGradient, smile, standardTiles, wave, wavyFill } from './common';
import type { Theme } from './types';

/**
 * LEVEL 8: SNOWY MOUNTAIN. Pale winter sky, snowy peaks, frosted pine trees, soft snowflakes.
 * The snow is NOT slippery (she moves exactly like everywhere else).
 * Pieces: rolling snowballs (become little smiling snowmen), icicles that drop after a shadow
 * warning (become snowflakes), snow-block walls, ice blocks for Shape Match, snow-pile stones.
 * Jewel: Diamond.
 */
export const snowTheme: Theme = {
  key: 'snow',

  paintFar(ctx, w, h) {
    skyGradient(ctx, w, h, '#c8e4ff', '#f4faff');
    // Snowy mountain peaks.
    for (const [cx, peak, half] of [[70, 50, 70], [200, 34, 90], [300, 60, 60]]) {
      for (let y = peak; y < h; y++) {
        const span = ((y - peak) / (h - peak)) * half * 1.6;
        for (let x = Math.round(cx - span); x <= cx + span; x++) {
          const snowy = y < peak + 18 + Math.sin(x / 4) * 3;
          px(ctx, snowy ? '#ffffff' : '#a8c4e0', ((x % w) + w) % w, y);
        }
      }
    }
    for (let i = 0; i < 30; i++) px(ctx, '#ffffff', (i * 41 + 7) % w, (i * 23 + 5) % h, 1, 1);
  },

  paintMiddle(ctx, w, h) {
    wavyFill(ctx, w, h, 56, [[5, 3, 0], [3, 7, 1]], '#d4e4f6', '#ffffff');
    // Frosted pine trees.
    for (let i = 0; i < 8; i++) {
      const x = (i * 41 + 15) % w;
      for (let y = 0; y < 30; y++) {
        const half = Math.floor(y / 3) + 1;
        px(ctx, y % 9 < 2 ? '#ffffff' : '#4f9a7a', x - half, 20 + y, half * 2 + 1, 1);
      }
      px(ctx, '#7a5a3a', x - 1, 50, 3, 6);
    }
  },

  paintNear(ctx, w, h) {
    for (let x = 0; x < w; x++) {
      const top = Math.round(18 + wave(x, [[4, 5, 0], [2, 11, 1]]));
      // Soft BLUE drifts (not white), so the white snow ground always stands out and gaps are easy to see.
      px(ctx, '#ffffff', x, top, 1, 1);
      px(ctx, '#c4d8f0', x, top + 1, 1, h - top);
    }
    for (let i = 0; i < 16; i++) {
      // Big soft snowflakes drifting in front.
      const x = (i * 29 + 11) % w;
      const y = (i * 7) % 16;
      px(ctx, '#ffffff', x - 1, y, 3, 1);
      px(ctx, '#ffffff', x, y - 1, 1, 3);
    }
  },

  paintTiles(ctx) {
    standardTiles(ctx, {
      top: '#ffffff',
      topDark: '#c8dcf0',
      fill: '#8aa8c8',
      fillDark: '#6a88aa',
      platform: '#d8f4ff',
      platformDark: '#9ac8e8',
      sprinkle: ['#e0f4ff', '#ffffff', '#c8e8ff'],
    });
  },

  makeSprites(scene) {
    const snowball = frames(scene, 'snow-ball', 2, 14, 14, (ctx, f) => {
      const b = ell(7, 7, 6, 6);
      shape(ctx, 14, 14, b, '#ffffff');
      shadeBottom(ctx, 14, 14, b, '#c8dcf0', 3);
      // Little lumps that move as it rolls.
      fill(ctx, 14, 14, (x, y) => b(x, y) && (x * 3 + y * 2 + f * 4) % 9 === 0, '#d8e8fa');
    });

    const snowman = frames(scene, 'snow-snowman', 1, 14, 18, (ctx) => {
      const body = any(ell(7, 13, 5.5, 4.5), ell(7, 6, 4, 3.8));
      shape(ctx, 14, 18, body, '#ffffff');
      shadeBottom(ctx, 14, 18, body, '#d8e8fa');
      eyes(ctx, [5, 8], 5, 'happy');
      px(ctx, '#ff9a4a', 7, 7, 2, 1); // carrot nose
      smile(ctx, 7, 8);
      cheeks(ctx, [3, 10], 7);
      px(ctx, '#ff6b8a', 3, 9, 8, 2); // scarf
    });

    const icicle = frames(scene, 'snow-icicle', 1, 10, 12, (ctx) => {
      // A rounded, shiny drop of ice (cute, not sharp).
      const d = any(ell(5, 4, 4, 3.5), (x, y) => y >= 4 && y <= 10 && Math.abs(x + 0.5 - 5) <= (11 - y) * 0.45);
      shape(ctx, 10, 12, d, '#bfeaff');
      px(ctx, '#ffffff', 3, 2, 2, 2);
    });

    const flake = frames(scene, 'snow-flake', 1, 9, 9, (ctx) => {
      for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]])
        for (let i = -3; i <= 3; i++) px(ctx, '#ffffff', 4 + dx * i, 4 + dy * i);
      px(ctx, '#bfeaff', 4, 4);
    });

    const ledge = frames(scene, 'snow-ledge', 1, 16, 8, (ctx) => {
      const l = any(rect(0, 0, 16, 5), ell(8, 5, 6, 3));
      shape(ctx, 16, 8, l, '#ffffff');
      shadeBottom(ctx, 16, 8, l, '#c8dcf0');
    });

    const snowBlock = frames(scene, 'snow-block', 1, 16, 16, (ctx) => {
      const b = rect(1, 1, 14, 14);
      shape(ctx, 16, 16, b, '#ffffff');
      shadeBottom(ctx, 16, 16, b, '#c8dcf0', 3);
      px(ctx, '#e0ecfa', 3, 5, 6, 1);
    });

    const ice = frames(scene, 'snow-ice', 1, 16, 16, (ctx) => {
      const b = rect(1, 1, 14, 14);
      shape(ctx, 16, 16, b, '#bfeaff');
      shadeBottom(ctx, 16, 16, b, '#8fc8e8', 3);
      px(ctx, '#ffffff', 2, 2, 4, 1);
      px(ctx, '#ffffff', 2, 3, 1, 3);
    });

    const pile = frames(scene, 'snow-pile', 2, 16, 10, (ctx, f) => {
      const p = ell(8, 8, 7.5, 6);
      shape(ctx, 16, 10, (x, y) => p(x, y) && y < 10, f ? '#fff6c0' : '#ffffff');
      if (f) {
        px(ctx, '#ffe066', 4, 4);
        px(ctx, '#ffe066', 11, 5);
        px(ctx, '#ffffff', 8, 3);
      }
    });

    return {
      roller: snowball,
      rollerFriend: snowman,
      drop: icicle,
      dropFriend: flake,
      hanger: ledge,
      wall: snowBlock,
      block: ice,
      stone: pile,
    };
  },

  jewel: { cut: 'round', light: '#ffffff', mid: '#e0f8ff', dark: '#9ac8e8' },
  jewelGlow: [0xffffff, 0xc8f4ff, 0xffd8f0, 0xffffff, 0xd8ffe8],
};

