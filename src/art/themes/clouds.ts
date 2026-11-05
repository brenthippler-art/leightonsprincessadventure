import { CSS } from '../../constants';
import { any, cheeks, clouds, ell, eyes, fill, frames, px, shadeBottom, shape, skyGradient, smile, wave, wavyFill } from './common';
import type { Theme } from './types';

/**
 * LEVEL 7: RAINBOW CLOUDS. A lilac sky with a big rainbow, puffy cloud banks, and fluffy
 * cloud ground; the gaps are open sky. Pieces: little bluebirds floating in a wave (flyers),
 * sleepy grey rainclouds (walkers; the wand turns them into smiling white clouds),
 * wobbly cloud platforms, slow moving platforms, star stepping stones. Jewel: Opal.
 */
const RAINBOW = ['#ff8a8a', '#ffb870', '#ffe680', '#9ee89a', '#8fd0ff', '#c9a3ff'];

export const cloudsTheme: Theme = {
  key: 'clouds',

  paintFar(ctx, w, h) {
    skyGradient(ctx, w, h, '#d8c8ff', '#d8f4ff');
    // A big rainbow arc.
    for (let x = 0; x < w; x++)
      for (let y = 0; y < h; y++) {
        const d = Math.hypot(x - 160, (y - 170) * 1.1);
        const band = Math.floor((150 - d) / 5);
        if (band >= 0 && band < RAINBOW.length) px(ctx, RAINBOW[band], x, y);
      }
    clouds(ctx, [[40, 40, 1], [280, 30, 1.1], [160, 70, 0.8]], '#ffffff');
  },

  paintMiddle(ctx, w, h) {
    wavyFill(ctx, w, h, 36, [[8, 3, 0], [5, 7, 1.3], [3, 13, 0.4]], '#ffe8f6', '#ffffff');
    wavyFill(ctx, w, h, 60, [[6, 4, 2], [3, 9, 0.5]], '#f0e4ff', '#ffffff');
  },

  paintNear(ctx, w, h) {
    for (let x = 0; x < w; x++) {
      const top = Math.round(14 + wave(x, [[5, 9, 0], [3, 19, 1]]));
      // Lilac (not white), so the white cloud GROUND always stands out and gaps are easy to see.
      px(ctx, '#e6d4ff', x, top, 1, h - top);
      if (top % 3 === 0) px(ctx, '#d8c4fa', x, top + 6, 1, 4);
    }
  },

  paintTiles(ctx) {
    const T = 16;
    // 0: fluffy cloud top (bumpy edge), 1: cloud inside, 2: rainbow-striped plank.
    for (let x = 0; x < T; x++) {
      const bump = Math.round(1.5 + Math.sin((x / T) * Math.PI * 2) * 1.5);
      px(ctx, '#9a88d0', x, bump, 1, 2); // a clear edge on top of the cloud ground
      px(ctx, '#ffffff', x, bump + 2, 1, T - bump - 2);
    }
    fill(ctx, T, T, (x, y) => y > 9 && (x * 5 + y * 3) % 9 === 0, '#ece8ff');
    px(ctx, '#ffffff', T, 0, T, T);
    fill(ctx, T * 2, T, (x, y) => x >= T && (x * 3 + y * 7) % 11 === 0, '#ece8ff');
    px(ctx, CSS.outline, 32, 0, 16, 9);
    RAINBOW.forEach((c, i) => px(ctx, c, 33, 1 + i, 14, 1));
  },

  makeSprites(scene) {
    const bird = (key: string, friendly: boolean) =>
      frames(scene, key, 2, 16, 12, (ctx, f) => {
        const W = 16;
        const H = 12;
        const color = friendly ? '#ffb8d8' : '#7fb8ff';
        const body = any(ell(8, 7, 5, 4), ell(12, 5, 3, 3));
        const wing = f === 0 ? ell(7, 3, 3.5, 2) : ell(7, 9, 3.5, 2);
        shape(ctx, W, H, any(body, wing), color);
        shadeBottom(ctx, W, H, body, friendly ? '#f090b8' : '#5a90d8');
        px(ctx, '#ffd84a', 15, 5, 1, 2); // beak
        eyes(ctx, [12], 4, friendly ? 'happy' : 'calm');
        if (friendly) cheeks(ctx, [13], 6);
      });

    const raincloud = (key: string, friendly: boolean) =>
      frames(scene, key, 2, 16, 14, (ctx, f) => {
        const W = 16;
        const H = 14;
        const puff = any(ell(8, 7, 7, 4), ell(5, 5, 3.5, 3.5), ell(10, 4, 4, 3.5));
        shape(ctx, W, H, puff, friendly ? '#ffffff' : '#b8b4d0');
        shadeBottom(ctx, W, H, puff, friendly ? '#e8e4ff' : '#9a94b8');
        eyes(ctx, [5, 10], 6, friendly ? 'happy' : 'calm');
        if (friendly) {
          smile(ctx, 8, 8, true);
          cheeks(ctx, [3, 12], 8);
        } else {
          // Sleepy drizzle drops that alternate between frames.
          px(ctx, '#8fd0ff', 4 + f * 2, 12, 1, 2);
          px(ctx, '#8fd0ff', 9 + f * 2, 12, 1, 2);
        }
      });

    const star = frames(scene, 'clouds-star', 2, 16, 10, (ctx, f) => {
      const s = (x: number, y: number) => {
        const dx = x + 0.5 - 8;
        const dy = y + 0.5 - 5.5;
        const a = Math.atan2(dy, dx) + Math.PI / 2;
        return Math.hypot(dx * 0.75, dy) <= 2.2 + 2.6 * Math.abs(Math.cos((5 * a) / 2)) ** 3;
      };
      shape(ctx, 16, 10, s, f ? '#ffe066' : '#e0dcf0');
      if (f) px(ctx, '#ffffff', 6, 3);
    });

    return {
      flyer: bird('clouds-bird', false),
      flyerFriend: bird('clouds-bird-friend', true),
      walker: raincloud('clouds-rain', false),
      walkerFriend: raincloud('clouds-rain-friend', true),
      walkerFriendStays: true,
      stone: star,
    };
  },

  jewel: { cut: 'opal', light: '#ffffff', mid: '#f0e8fa', dark: '#d0c4e8' },
  jewelGlow: [0xff8a8a, 0xffb870, 0xffe680, 0x9ee89a, 0x8fd0ff, 0xc9a3ff],
};

