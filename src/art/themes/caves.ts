import Phaser from 'phaser';
import { any, cheeks, ell, eyes, fill, frames, px, rect, shadeBottom, shape, skyGradient, smile, standardTiles, wave, wavyFill } from './common';
import type { Theme } from './types';

/**
 * LEVEL 10: CRYSTAL CAVES. A cozy lilac cave lit by glowing crystals (never dark or spooky).
 * Pieces: slow little bats (flyers; the wand makes them happy and they flutter away), drips that
 * drop from rocky points after a glow-and-shadow warning, crystal bells for the pattern puzzle,
 * glowing crystal clusters along the path. Jewel: Amethyst.
 */
const GEMS = ['#9ef0ff', '#ff9fd8', '#c9a3ff', '#a8f5c0'];

export const cavesTheme: Theme = {
  key: 'caves',

  paintFar(ctx, w, h) {
    skyGradient(ctx, w, h, '#6a4aa0', '#b08ad8');
    // Twinkling crystal glints far away.
    for (let i = 0; i < 40; i++) px(ctx, GEMS[i % GEMS.length], (i * 37 + 11) % w, (i * 53 + 7) % h);
    // Rocky ceiling with rounded stalactites.
    for (let x = 0; x < w; x++) {
      const drop = Math.round(10 + wave(x, [[6, 9, 0], [4, 23, 1]]));
      px(ctx, '#4a3478', x, 0, 1, Math.max(0, drop));
    }
  },

  paintMiddle(ctx, w, h) {
    wavyFill(ctx, w, h, 30, [[10, 3, 0.5], [6, 8, 1.7]], '#8a68c0', '#a888d8');
    // Big soft crystal columns in the rock.
    for (let i = 0; i < 6; i++) {
      const x = (i * 59 + 20) % w;
      const c = GEMS[i % GEMS.length];
      fill(ctx, w, h, (xx, y) => y > 40 && Math.abs(xx - x) <= (y - 40) * 0.2 && y < 70, c);
    }
  },

  paintNear(ctx, w, h) {
    wavyFill(ctx, w, h, 20, [[4, 7, 0], [2, 17, 1]], '#5a4290', '#6f54a8');
    for (let i = 0; i < 12; i++) {
      const x = (i * 27 + 9) % w;
      const c = GEMS[i % GEMS.length];
      fill(ctx, w, h, (xx, y) => y >= 10 && y < 24 && Math.abs(xx - x) <= (24 - y) * 0.3, c);
      px(ctx, '#ffffff', x, 14);
    }
  },

  paintTiles(ctx) {
    standardTiles(ctx, {
      top: '#b8a0e8',
      topDark: '#8a6cc8',
      fill: '#6f54a8',
      fillDark: '#5a4290',
      platform: '#9ef0ff',
      platformDark: '#5ac8e0',
      sprinkle: ['#9ef0ff', '#ff9fd8', '#ffffff'],
    });
  },

  makeSprites(scene) {
    const bat = (key: string, friendly: boolean) =>
      frames(scene, key, 2, 18, 12, (ctx, f) => {
        const W = 18;
        const H = 12;
        const color = friendly ? '#ffb8e0' : '#8a68c0';
        const wings = f === 0 ? any(ell(3.5, 4, 3.5, 2.5), ell(14.5, 4, 3.5, 2.5)) : any(ell(3.5, 8, 3.5, 2.2), ell(14.5, 8, 3.5, 2.2));
        shape(ctx, W, H, wings, friendly ? '#ff9fd8' : '#6f54a8');
        const body = any(ell(9, 6.5, 4.5, 4.5), rect(6, 1, 2, 3), rect(10, 1, 2, 3)); // round body + ears
        shape(ctx, W, H, body, color);
        shadeBottom(ctx, W, H, body, friendly ? '#f090c8' : '#6f54a8');
        eyes(ctx, [7, 10], 5, friendly ? 'happy' : 'calm');
        if (friendly) {
          smile(ctx, 9, 8);
          cheeks(ctx, [5, 12], 8);
        }
      });

    const drip = frames(scene, 'caves-drip', 1, 10, 12, (ctx) => {
      const d = any(ell(5, 7.5, 3.8, 3.8), (x, y) => y >= 1 && y <= 7 && Math.abs(x + 0.5 - 5) <= (y - 0.5) * 0.55);
      shape(ctx, 10, 12, d, '#9ef0ff');
      px(ctx, '#ffffff', 3, 6, 2, 2);
    });

    const pointRock = frames(scene, 'caves-point', 1, 16, 10, (ctx) => {
      const r = any(rect(0, 0, 16, 4), (x, y) => y >= 4 && y < 9 && Math.abs(x + 0.5 - 8) <= (9 - y) * 1.1);
      shape(ctx, 16, 10, r, '#6f54a8');
      px(ctx, '#9ef0ff', 7, 5, 2, 2);
    });

    const sparkle = frames(scene, 'caves-sparkle', 1, 9, 9, (ctx) => {
      px(ctx, '#ff9fd8', 4, 0, 1, 9);
      px(ctx, '#ff9fd8', 0, 4, 9, 1);
      px(ctx, '#ffffff', 3, 3, 3, 3);
    });

    const crystalBell = frames(scene, 'caves-bell', 1, 14, 14, (ctx) => {
      // A crystal bell, drawn pale so each bell can be tinted its own color.
      const b = any((x, y) => y >= 1 && y <= 10 && Math.abs(x + 0.5 - 7) <= 1.5 + y * 0.45, rect(1, 10, 12, 2));
      shape(ctx, 14, 14, b, '#ffffff');
      fill(ctx, 14, 14, (x, y) => b(x, y) && (x === 5 || x === 9) && y > 3, '#e0e0e0');
      px(ctx, '#ffffff', 6, 13, 2, 1);
    });

    const crate = frames(scene, 'caves-geode', 1, 16, 16, (ctx) => {
      const b = rect(1, 1, 14, 14);
      shape(ctx, 16, 16, b, '#8a68c0');
      fill(ctx, 16, 16, ell(8, 8, 4, 4), '#c9a3ff');
      px(ctx, '#ffffff', 6, 6, 2, 2);
    });

    return {
      flyer: bat('caves-bat', false),
      flyerFriend: bat('caves-bat-friend', true),
      drop: drip,
      hanger: pointRock,
      dropFriend: sparkle,
      bell: crystalBell,
      crate,
      block: crate,
    };
  },

  jewel: { cut: 'step', light: '#e0c8ff', mid: '#a05ae0', dark: '#5a2a9a' },
};

/** A glowing crystal cluster (decoration). 2 frames so its sparkle twinkles. */
export function crystalTexture(scene: Phaser.Scene): string {
  const key = 'caves-crystal';
  if (scene.textures.exists(key)) return key;
  return frames(scene, key, 2, 20, 22, (ctx, f) => {
    const spikes: [number, number, number, string][] = [
      [10, 2, 3.2, '#9ef0ff'],
      [5, 8, 2.6, '#ff9fd8'],
      [15, 7, 2.6, '#c9a3ff'],
    ];
    for (const [cx, top, half, c] of spikes) {
      const p = (x: number, y: number) => y >= top && y <= 21 && Math.abs(x + 0.5 - cx) <= Math.min(half, (y - top) * 0.9 + 0.5);
      shape(ctx, 20, 22, p, c);
      fill(ctx, 20, 22, (x, y) => p(x, y) && x + 0.5 < cx && y > top + 2, '#ffffff');
    }
    px(ctx, '#5a4290', 2, 19, 16, 3);
    if (f) {
      px(ctx, '#ffffff', 9, 0, 1, 3);
      px(ctx, '#ffffff', 8, 1, 3, 1);
    }
  });
}
