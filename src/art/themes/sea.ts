import { CSS } from '../../constants';
import { any, cheeks, ell, eyes, fill, frames, px, rect, shadeBottom, shape, skyGradient, smile, standardTiles, wave, wavyFill } from './common';
import type { Theme } from './types';

/**
 * LEVEL 4: UNDER THE SEA. Sunbeams through blue water, rocks and kelp, bright coral.
 * Underwater physics: floaty, and tapping jump swims upward.
 * Pieces: slow jellyfish (flyers), round pufferfish (walkers), bubble lifts, seashell shape blocks.
 * Jewel: Pearl.
 */
export const seaTheme: Theme = {
  key: 'sea',
  underwater: true,

  paintFar(ctx, w, h) {
    skyGradient(ctx, w, h, '#7fd8ff', '#2f7fc8');
    // Slanted sunbeams (dithered so they look soft).
    fill(ctx, w, h, (x, y) => y < 140 && ((x + y * 0.5) % 64) < 10 && (x + y) % 2 === 0, '#a8e8ff');
    // Little bubbles drifting up.
    for (let i = 0; i < 24; i++) {
      const x = (i * 53 + 17) % w;
      const y = (i * 31 + 9) % h;
      px(ctx, '#d8f6ff', x, y, 2, 2);
      px(ctx, '#ffffff', x, y);
    }
  },

  paintMiddle(ctx, w, h) {
    wavyFill(ctx, w, h, 50, [[10, 3, 0], [6, 7, 1.4]], '#2f8fb8', '#4fa8cc');
    // Swaying kelp strands.
    for (let i = 0; i < 10; i++) {
      const bx = (i * 33 + 7) % w;
      for (let y = 10; y < h; y++) px(ctx, '#3fbf8f', bx + Math.round(Math.sin(y / 6 + i) * 2), y, 2, 1);
    }
  },

  paintNear(ctx, w, h) {
    const corals = ['#ff8fb8', '#ffb070', '#b88fff', '#ffe066'];
    for (let i = 0; i < 14; i++) {
      const x = (i * 23 + 4) % w;
      const c = corals[i % corals.length];
      const tall = 10 + ((i * 7) % 12);
      // Branchy coral: a stem with little bumps.
      px(ctx, c, x, h - tall, 3, tall);
      px(ctx, c, x - 2, h - tall + 4, 2, 3);
      px(ctx, c, x + 3, h - tall + 7, 2, 3);
    }
    for (let x = 0; x < w; x++) {
      const top = Math.round(32 + wave(x, [[2, 9, 0]]));
      px(ctx, '#e8cf90', x, top, 1, h - top);
    }
  },

  paintTiles(ctx) {
    standardTiles(ctx, {
      top: '#f2d9a0',
      topDark: '#d9bc7a',
      fill: '#d9bc7a',
      fillDark: '#b89a5a',
      platform: '#ff9fc8',
      platformDark: '#d870a0',
      sprinkle: ['#ff8fb8', '#ffffff', '#b88fff'],
    });
  },

  makeSprites(scene) {
    const jelly = (key: string, friendly: boolean) =>
      frames(scene, key, 2, 14, 16, (ctx, f) => {
        const W = 14;
        const H = 16;
        const color = friendly ? '#ffb8e0' : '#c9a3ff';
        // Wavy tentacles that sway between frames.
        for (const [x, k] of [[3, 0], [6, 1], [9, 0], [11, 1]])
          for (let y = 9; y < 15; y++) px(ctx, friendly ? '#ff9fd8' : '#a888e8', x + ((y + f + k) % 3 === 0 ? 1 : 0), y);
        const bell = any(ell(7, 6, 6, f === 0 ? 5 : 4.5), rect(1, 7, 12, 2));
        shape(ctx, W, H, bell, color);
        fill(ctx, W, H, (x, y) => bell(x, y) && y <= 3, '#ffffff');
        shadeBottom(ctx, W, H, bell, friendly ? '#ff9fd8' : '#a888e8');
        eyes(ctx, [4, 9], 5, friendly ? 'happy' : 'calm');
        if (friendly) {
          smile(ctx, 7, 7, true);
          cheeks(ctx, [2, 11], 7, '#ff86bf');
        }
      });

    const fish = (key: string, friendly: boolean) =>
      frames(scene, key, 2, 16, 14, (ctx, f) => {
        const W = 16;
        const H = 14;
        const color = friendly ? '#ffb070' : '#ffd85a';
        // Tail flaps between frames.
        shape(ctx, W, H, any(ell(14, 7 + (f ? 1 : -1), 2, 3)), friendly ? '#ff9a4a' : '#f0b030');
        const body = ell(8, 7, 6.5, 5.5);
        shape(ctx, W, H, body, color);
        shadeBottom(ctx, W, H, body, friendly ? '#ff9a4a' : '#e8b030');
        // Soft round bumps instead of spikes (nothing scary).
        if (!friendly) fill(ctx, W, H, (x, y) => body(x, y) && !body(x, y - 1) && x % 3 === 0, '#fff0a0');
        eyes(ctx, [4], 5, friendly ? 'happy' : 'calm');
        if (friendly) smile(ctx, 4, 8, true);
        else px(ctx, CSS.outline, 3, 9, 2, 1);
        shape(ctx, W, H, ell(9, 9, 2, 1.5), friendly ? '#ffd0a0' : '#fff0a0'); // little fin
      });

    const rock = frames(scene, 'sea-rock', 1, 16, 16, (ctx) => {
      const r = any(rect(1, 3, 14, 12), ell(8, 4, 6.5, 3));
      shape(ctx, 16, 16, r, '#9ab8c8');
      shadeBottom(ctx, 16, 16, r, '#6f8fa8', 3);
      px(ctx, '#ff8fb8', 3, 2, 2, 1); // a little coral on top
    });

    return {
      flyer: jelly('sea-jelly', false),
      flyerFriend: jelly('sea-jelly-friend', true),
      walker: fish('sea-puffer', false),
      walkerFriend: fish('sea-fish-friend', true),
      block: rock,
    };
  },

  jewel: { cut: 'pearl', light: '#ffffff', mid: '#f0eaf6', dark: '#c8bcd8' },
};
