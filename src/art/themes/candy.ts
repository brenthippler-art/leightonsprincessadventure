import { CSS } from '../../constants';
import { any, cheeks, clouds, ell, eyes, fill, frames, px, rect, shadeBottom, shape, skyGradient, smile, standardTiles, wavyFill } from './common';
import type { Theme } from './types';

/**
 * LEVEL 5: SWEET TREAT VALLEY. Pink-and-peach sky with cotton-candy clouds, minty hills with
 * lollipops, gumdrops everywhere. Ground is frosted chocolate cake; floating platforms are cupcakes.
 * Pieces: wobbly gummy bears (walkers), rolling peppermints, gumdrop bounce pads,
 * chocolate-block walls, macaron stepping stones. Jewel: Rose Quartz.
 */
export const candyTheme: Theme = {
  key: 'candy',

  paintFar(ctx, w, h) {
    skyGradient(ctx, w, h, '#ffc8e8', '#fff0d8');
    clouds(ctx, [[60, 30, 1], [190, 20, 0.8], [280, 46, 1]], '#ffe4f2');
    clouds(ctx, [[120, 52, 0.6]], '#ffffff');
  },

  paintMiddle(ctx, w, h) {
    // Lollipops on sticks behind the hills.
    const pops = ['#ff86bf', '#9ef0c8', '#ffd84a', '#c9a3ff'];
    for (let i = 0; i < 6; i++) {
      const x = (i * 57 + 20) % w;
      px(ctx, '#ffffff', x, 22, 2, 40);
      for (let y = -8; y <= 8; y++)
        for (let xx = -8; xx <= 8; xx++) {
          const d = Math.hypot(xx, y);
          if (d <= 8) px(ctx, Math.floor(d / 2.5) % 2 ? '#ffffff' : pops[i % pops.length], x + 1 + xx, 16 + y);
        }
    }
    wavyFill(ctx, w, h, 40, [[8, 2, 0.3], [5, 5, 1.2]], '#a8f0d0', '#d0fae8');
  },

  paintNear(ctx, w, h) {
    wavyFill(ctx, w, h, 18, [[3, 7, 0], [2, 15, 1]], '#ffb8d8', '#ffd8ea');
    // Little gumdrops dotted along the front.
    const drops = ['#ff6b8a', '#6fdc8c', '#ffd84a', '#9a7aff'];
    for (let i = 0; i < 14; i++) {
      const x = (i * 23 + 6) % w;
      for (let y = 0; y < 6; y++) px(ctx, drops[i % drops.length], x - Math.floor(y / 2), 14 + y, 2 + Math.floor(y / 2) * 2, 1);
      px(ctx, '#ffffff', x, 15);
    }
  },

  paintTiles(ctx) {
    standardTiles(ctx, {
      top: '#ff9fcf',
      topDark: '#e870a8',
      fill: '#a8683a',
      fillDark: '#7a4626',
      platform: '#ffffff',
      platformDark: '#ffc8e0',
      sprinkle: ['#6fdc8c', '#ffd84a', '#4f9dff'],
    });
    // Frosting drips over the cake.
    for (const x of [3, 9, 13]) px(ctx, '#ff9fcf', x, 5, 2, 2);
    // Cupcake platform: swirly frosting top with a cherry, striped paper cup underneath.
    px(ctx, CSS.outline, 32, 0, 16, 12);
    px(ctx, '#fff4fa', 33, 1, 14, 4);
    px(ctx, '#ffc8e0', 33, 4, 14, 1);
    px(ctx, '#ff4f6a', 39, 0, 3, 2); // cherry
    for (let x = 33; x < 47; x++) px(ctx, x % 3 === 0 ? '#ff86bf' : '#ffd0e8', x, 5, 1, 6); // paper cup
  },

  makeSprites(scene) {
    const bear = (key: string, friendly: boolean) =>
      frames(scene, key, 2, 14, 16, (ctx, f) => {
        const W = 14;
        const H = 16;
        const color = friendly ? '#ffa8c8' : '#ff6b8a';
        const shade = friendly ? '#f080a8' : '#d84a6a';
        const legs = any(rect(3 + f, 12, 3, 3), rect(8 - f, 12, 3, 3));
        const body = any(ell(7, 9, 4.5, 4), ell(7, 4.5, 4, 3.5), ell(3.5, 1.8, 1.6, 1.6), ell(10.5, 1.8, 1.6, 1.6), legs);
        shape(ctx, W, H, body, color);
        shadeBottom(ctx, W, H, body, shade);
        px(ctx, '#ffffff', 4, 3); // gummy shine
        eyes(ctx, [5, 8], 4, friendly ? 'happy' : 'calm');
        if (friendly) {
          smile(ctx, 7, 6, true);
          cheeks(ctx, [3, 10], 6, '#ffffff');
        } else px(ctx, CSS.outline, 6, 7, 2, 1);
      });

    const mint = frames(scene, 'candy-mint', 2, 14, 14, (ctx, f) => {
      const c = ell(7, 7, 6, 6);
      shape(ctx, 14, 14, c, '#ffffff');
      // Peppermint swirl that turns between frames.
      fill(ctx, 14, 14, (x, y) => {
        if (!c(x, y)) return false;
        const a = Math.atan2(y - 6.5, x - 6.5) + (f * Math.PI) / 4;
        return Math.floor(((a + Math.PI) / (Math.PI * 2)) * 8) % 2 === 0;
      }, '#ff4f6a');
      px(ctx, '#ffffff', 4, 3, 2, 1);
    });

    const gumdrop = frames(scene, 'candy-gumdrop', 2, 16, 10, (ctx, f) => {
      const top = f === 0 ? 1 : 4;
      const g = (x: number, y: number) => y >= top && y <= 9 && ((x + 0.5 - 8) / 7) ** 2 + ((y + 0.5 - 10) / (10 - top)) ** 2 <= 1;
      shape(ctx, 16, 10, g, '#6fdc8c');
      fill(ctx, 16, 10, (x, y) => g(x, y) && (x * 3 + y * 5) % 7 === 0, '#d8ffe0'); // sugar crystals
      shadeBottom(ctx, 16, 10, g, '#3fae5a');
    });

    const choc = frames(scene, 'candy-choc', 1, 16, 16, (ctx) => {
      const b = rect(1, 1, 14, 14);
      shape(ctx, 16, 16, b, '#8a5030');
      px(ctx, '#6b3a20', 1, 8, 14, 1);
      px(ctx, '#6b3a20', 8, 1, 1, 14);
      px(ctx, '#b07048', 2, 2, 5, 1);
      px(ctx, '#b07048', 9, 9, 5, 1);
    });

    const macaron = frames(scene, 'candy-macaron', 2, 16, 10, (ctx, f) => {
      const top = f ? '#ff9fcf' : '#f0d8c8';
      shape(ctx, 16, 10, ell(8, 2.5, 7.5, 2.5), top);
      px(ctx, f ? '#ffffff' : '#fff0e0', 2, 4, 12, 2); // cream filling
      shape(ctx, 16, 10, ell(8, 7.5, 7.5, 2.5), top);
      if (f) px(ctx, '#ffffff', 4, 1, 2, 1);
    });

    const plank = frames(scene, 'candy-plank', 1, 16, 8, (ctx) => {
      px(ctx, CSS.outline, 0, 0, 16, 8);
      for (let x = 1; x < 15; x++) px(ctx, Math.floor(x / 3) % 2 ? '#ffffff' : '#ff6b8a', x, 1, 1, 6); // candy-cane stripes
    });

    return {
      walker: bear('candy-bear', false),
      walkerFriend: bear('candy-bear-friend', true),
      walkerFriendStays: true,
      roller: mint,
      pad: gumdrop,
      wall: choc,
      stone: macaron,
      plank,
    };
  },

  jewel: { cut: 'oval', light: '#ffe0ee', mid: '#ff9fc8', dark: '#d8608f' },
};

