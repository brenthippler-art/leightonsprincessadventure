import { clouds, skyGradient, standardTiles, wavyFill, flower } from './common';
import type { Theme } from './types';

/** The plain placeholder look used by the test levels (no reskinned pieces). */
export const testTheme: Theme = {
  key: 'test',
  paintFar(ctx, w, h) {
    skyGradient(ctx, w, h, '#ffd6ec', '#fff4e0');
    clouds(ctx, [[40, 30, 1], [150, 18, 0.7], [250, 42, 1.2]], '#ffffff');
  },
  paintMiddle(ctx, w, h) {
    wavyFill(ctx, w, h, 24, [[14, 2, 0], [8, 3, 1.3], [3, 7, 0.5]], '#d6b8ff', '#e9dbff');
  },
  paintNear(ctx, w, h) {
    wavyFill(ctx, w, h, 8, [[6, 5, 0], [4, 11, 2], [2, 17, 1]], '#6cc48a', '#9fe3b0');
    for (let i = 0; i < 12; i++) flower(ctx, (i * 27 + 11) % w, 26 + ((i * 7) % 9), '#ff86bf');
  },
  paintTiles(ctx) {
    standardTiles(ctx, {
      top: '#6fdc8c',
      topDark: '#2f9e57',
      fill: '#c98a5a',
      fillDark: '#8a5534',
      platform: '#ffcf7a',
      platformDark: '#c98a3a',
    });
  },
  jewel: { cut: 'round', light: '#ff9ab0', mid: '#ff4f7a', dark: '#b0204a' },
};
