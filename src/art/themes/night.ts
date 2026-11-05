import { CSS } from '../../constants';
import { any, cheeks, ell, eyes, fill, flower, frames, px, rect, shadeBottom, shape, skyGradient, standardTiles, wave, wavyFill } from './common';
import type { Theme } from './types';

/**
 * LEVEL 11: STARRY NIGHT SKY. A deep blue night full of twinkling stars and a big smiling moon,
 * soft hills with glowing flowers and fireflies (cozy, never spooky).
 * Pieces: little owls floating in a wave (flyers), shooting stars that drop after a glow and a
 * shadow (droppers; the wand turns them into gentle twinkles), slow floating star platforms
 * (moving platforms), star stepping stones, moon-rock blocks. Jewel: Moonstone.
 */
export const nightTheme: Theme = {
  key: 'night',

  paintFar(ctx, w, h) {
    skyGradient(ctx, w, h, '#1f2a6a', '#5a4a9a');
    for (let i = 0; i < 70; i++) {
      const x = (i * 43 + 7) % w;
      const y = (i * 29 + 3) % (h - 40);
      px(ctx, i % 5 === 0 ? '#fff0a0' : '#ffffff', x, y);
      if (i % 9 === 0) {
        px(ctx, '#ffffff', x - 1, y);
        px(ctx, '#ffffff', x + 1, y);
        px(ctx, '#ffffff', x, y - 1);
        px(ctx, '#ffffff', x, y + 1);
      }
    }
    // A big, friendly, smiling moon.
    for (let y = -16; y <= 16; y++) for (let x = -16; x <= 16; x++) if (x * x + y * y <= 256) px(ctx, '#fff4c0', 250 + x, 40 + y);
    fill(ctx, w, h, (x, y) => ell(244, 36, 3, 2)(x, y) || ell(256, 48, 2.5, 2)(x, y), '#f0e0a0');
    px(ctx, '#4a3a5a', 245, 41, 2, 1);
    px(ctx, '#4a3a5a', 254, 41, 2, 1);
    px(ctx, '#4a3a5a', 248, 45, 4, 1);
    px(ctx, '#4a3a5a', 247, 44);
    px(ctx, '#4a3a5a', 252, 44);
  },

  paintMiddle(ctx, w, h) {
    wavyFill(ctx, w, h, 40, [[9, 2, 0], [5, 5, 1.3]], '#3a3a8a', '#4a4aa0');
    // Cozy little houses with warm windows on the hills.
    for (const hx of [40, 150, 260]) {
      shape(ctx, w, h, rect(hx, 46, 14, 12), '#2a2a6a');
      shape(ctx, w, h, (x, y) => y >= 38 && y < 47 && Math.abs(x - (hx + 7)) <= (y - 38) + 1, '#2a2a6a');
      px(ctx, '#ffe066', hx + 4, 50, 3, 3);
      px(ctx, '#ffe066', hx + 9, 50, 3, 3);
    }
  },

  paintNear(ctx, w, h) {
    for (let x = 0; x < w; x++) {
      const top = Math.round(18 + wave(x, [[3, 7, 0], [2, 15, 1]]));
      px(ctx, '#2a5a6a', x, top, 1, h - top);
    }
    // Glowing flowers and fireflies.
    for (let i = 0; i < 12; i++) flower(ctx, (i * 29 + 5) % w, 22 + ((i * 3) % 6), '#c9a3ff', '#fff0a0');
    for (let i = 0; i < 10; i++) px(ctx, '#fff0a0', (i * 37 + 19) % w, 4 + ((i * 7) % 12));
  },

  paintTiles(ctx) {
    standardTiles(ctx, {
      top: '#4fa88a',
      topDark: '#2a7a6a',
      fill: '#3a3a7a',
      fillDark: '#2a2a5a',
      platform: '#c8d0ff',
      platformDark: '#8f98d8',
      sprinkle: ['#c9a3ff', '#fff0a0', '#ffffff'],
    });
  },

  makeSprites(scene) {
    const owl = (key: string, friendly: boolean) =>
      frames(scene, key, 2, 16, 14, (ctx, f) => {
        const W = 16;
        const H = 14;
        const color = friendly ? '#ffc8a0' : '#b08a6a';
        const wings = f === 0 ? any(ell(2.5, 6, 2.5, 3.5), ell(13.5, 6, 2.5, 3.5)) : any(ell(2.5, 9, 2.5, 3), ell(13.5, 9, 2.5, 3));
        shape(ctx, W, H, wings, friendly ? '#ffa880' : '#8a6a4a');
        const body = any(ell(8, 7.5, 5.5, 5.5), rect(4, 1, 2, 3), rect(10, 1, 2, 3)); // round body + ear tufts
        shape(ctx, W, H, body, color);
        shadeBottom(ctx, W, H, body, friendly ? '#f0a880' : '#8a6a4a');
        // Big round eyes in pale circles.
        shape(ctx, W, H, any(ell(6, 6, 2.2, 2.2), ell(10, 6, 2.2, 2.2)), '#fff4d8');
        eyes(ctx, [5, 9], 5, friendly ? 'happy' : 'calm');
        px(ctx, '#ffd84a', 7, 8, 2, 2); // beak
        if (friendly) cheeks(ctx, [3, 12], 9);
      });

    const shooting = frames(scene, 'night-shootingstar', 1, 12, 16, (ctx) => {
      // A star falling with its sparkly tail pointing up.
      for (let y = 0; y < 8; y++) px(ctx, y % 2 ? '#fff0a0' : '#ffffff', 5 + (y % 3 === 0 ? 1 : 0), y, 2, 1);
      const star = (x: number, y: number) => {
        const dx = x + 0.5 - 6;
        const dy = y + 0.5 - 11;
        const a = Math.atan2(dy, dx) + Math.PI / 2;
        return Math.hypot(dx, dy) <= 1.8 + 2.6 * Math.abs(Math.cos((5 * a) / 2)) ** 3;
      };
      shape(ctx, 12, 16, star, '#ffe066');
      px(ctx, '#ffffff', 5, 10);
    });

    const twinkle = frames(scene, 'night-twinkle', 1, 9, 9, (ctx) => {
      px(ctx, '#fff0a0', 4, 0, 1, 9);
      px(ctx, '#fff0a0', 0, 4, 9, 1);
      px(ctx, '#ffffff', 3, 3, 3, 3);
    });

    const cloudlet = frames(scene, 'night-cloudlet', 1, 16, 8, (ctx) => {
      shape(ctx, 16, 8, any(ell(5, 4, 4, 3), ell(11, 4, 4, 3), ell(8, 2.5, 3, 2.5)), '#8f98d8', '#3a3a7a');
    });

    const starPlatform = frames(scene, 'night-starplat', 1, 32, 10, (ctx) => {
      // A glowing platform with little stars along it.
      px(ctx, CSS.outline, 0, 0, 32, 8);
      px(ctx, '#c8d0ff', 1, 1, 30, 4);
      px(ctx, '#8f98d8', 1, 5, 30, 2);
      for (const x of [5, 15, 25]) {
        px(ctx, '#ffe066', x, 2, 3, 1);
        px(ctx, '#ffe066', x + 1, 1, 1, 3);
      }
      px(ctx, '#fff0a0', 8, 8, 1, 2);
      px(ctx, '#fff0a0', 22, 8, 1, 2); // twinkles underneath
    });

    const star = frames(scene, 'night-star', 2, 16, 10, (ctx, f) => {
      const s = (x: number, y: number) => {
        const dx = x + 0.5 - 8;
        const dy = y + 0.5 - 5.5;
        const a = Math.atan2(dy, dx) + Math.PI / 2;
        return Math.hypot(dx * 0.75, dy) <= 2.2 + 2.6 * Math.abs(Math.cos((5 * a) / 2)) ** 3;
      };
      shape(ctx, 16, 10, s, f ? '#ffe066' : '#8f98d8');
      if (f) px(ctx, '#ffffff', 6, 3);
    });

    const moonRock = frames(scene, 'night-moonrock', 1, 16, 16, (ctx) => {
      const b = rect(1, 1, 14, 14);
      shape(ctx, 16, 16, b, '#c8d0ff');
      shadeBottom(ctx, 16, 16, b, '#8f98d8', 3);
      fill(ctx, 16, 16, (x, y) => ell(5, 5, 1.6, 1.6)(x, y) || ell(11, 10, 2, 2)(x, y), '#a8b0e8'); // craters
    });

    return {
      flyer: owl('night-owl', false),
      flyerFriend: owl('night-owl-friend', true),
      drop: shooting,
      dropFriend: twinkle,
      hanger: cloudlet,
      movingPlatform: starPlatform,
      stone: star,
      block: moonRock,
    };
  },

  jewel: { cut: 'oval', light: '#f4faff', mid: '#b8d0f0', dark: '#7f98c8' },
  jewelGlow: [0xb8d0f0, 0xe0ecff, 0xc8c0ff, 0xffffff],
};
