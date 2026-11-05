import Phaser from 'phaser';
import { CSS, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { maskOf } from './levelArt';
import { addTexture, drawMaskOutlined, makeCanvas, maskFromRows } from './pixels';
import { any, ell, fill, px, rect, shadeBottom, shape, skyGradient, wavyFill, type Pred } from './themes/common';

/**
 * Art for the menu screens: the sunset castle (title), the storybook map and its 12 land icons,
 * the padlock, yes/no buttons (parent reset), the throne and the big star (story and ending).
 * All drawn in code.
 */
export const MAP_TEX = {
  sunset: 'menu-sunset',
  parchment: 'menu-parchment',
  land: (id: number) => `menu-land-${id}`,
  padlock: 'menu-padlock',
  dot: 'menu-dot',
  yes: 'menu-yes',
  no: 'menu-no',
  throne: 'menu-throne',
  star: 'menu-star',
  confetti: 'menu-confetti',
  windFace: 'menu-wind',
  switchOn: 'menu-switch-on',
  switchOff: 'menu-switch-off',
} as const;

/** Background color of each land's map icon (index 0 = land 1). */
const LAND_COLORS = ['#9fe39a', '#5fbf7a', '#ffe3a3', '#7fd8ff', '#ffc8e8', '#f2d06a', '#d8c8ff', '#e8f4ff', '#ffd0a0', '#b08ad8', '#3a3a8a', '#ffd8e8'];

type Painter = (ctx: CanvasRenderingContext2D) => void;
const W = 24;

/** A tiny picture for each land, drawn on its round colored badge. */
const LAND_PICTURES: Painter[] = [
  // 1 Flower Meadow: a big pink flower on a green hill
  (c) => {
    shape(c, W, W, ell(12, 22, 11, 5), '#5cc46a');
    px(c, '#3f9a4a', 11, 10, 2, 9);
    shape(c, W, W, any(ell(12, 6, 3, 3), ell(8, 9, 3, 3), ell(16, 9, 3, 3), ell(10, 13, 3, 3), ell(14, 13, 3, 3)), '#ff86bf');
    shape(c, W, W, ell(12, 10, 2.2, 2.2), CSS.gold);
  },
  // 2 Enchanted Jungle: a friendly giraffe's head
  (c) => {
    shape(c, W, W, any(rect(9, 3, 2, 4), rect(14, 3, 2, 4)), '#b0602a');
    const head = any(ell(12, 11, 6, 5), ell(9, 16, 4.5, 3.5), rect(13, 14, 5, 9));
    shape(c, W, W, head, '#ffd36a');
    fill(c, W, W, (x, y) => head(x, y) && (x * 5 + y * 3) % 7 === 0 && y > 6, '#d08a3a');
    px(c, CSS.outline, 10, 9, 2, 2);
    px(c, '#ffb09a', 6, 16, 2, 1);
  },
  // 3 Sunny Beach: sun, sea, sand
  (c) => {
    shape(c, W, W, ell(16, 7, 4.5, 4.5), '#ffd84a');
    fill(c, W, W, (x, y) => y >= 13 && y < 17 && x > 1 && x < 22, '#4fc3e8');
    fill(c, W, W, (x, y) => y === 13 && (x % 4 === 0), '#ffffff');
    fill(c, W, W, (x, y) => y >= 17 && y < 22 && x > 2 && x < 21, '#ffe3a3');
  },
  // 4 Under the Sea: a smiling fish and bubbles
  (c) => {
    shape(c, W, W, any(ell(11, 12, 6, 4.5), ell(18, 12, 2.5, 4)), '#ffb070');
    px(c, CSS.outline, 8, 10, 2, 2);
    for (const [x, y] of [[5, 5], [15, 4], [19, 7]]) px(c, '#ffffff', x, y, 2, 2);
  },
  // 5 Sweet Treat Valley: a cupcake with a cherry
  (c) => {
    shape(c, W, W, (x, y) => y >= 13 && y < 21 && Math.abs(x + 0.5 - 12) <= 6 - (y - 13) * 0.3, '#ff86bf');
    fill(c, W, W, (x, y) => y >= 14 && y < 20 && x % 3 === 0 && Math.abs(x + 0.5 - 12) < 5, '#ffd0e8');
    shape(c, W, W, any(ell(12, 11, 7, 3.5), ell(12, 8, 4, 3)), '#fff4fa');
    shape(c, W, W, ell(12, 4, 2, 2), '#ff4f6a');
  },
  // 6 Farmyard: a red barn
  (c) => {
    shape(c, W, W, any(rect(5, 10, 14, 11), (x, y) => y >= 4 && y < 11 && Math.abs(x + 0.5 - 12) <= (y - 4) + 1.5), '#e85a4a');
    px(c, '#ffffff', 9, 14, 6, 7);
    px(c, '#e85a4a', 10, 15, 4, 6);
    for (let i = 0; i < 4; i++) {
      px(c, '#ffffff', 10 + i, 15 + Math.round(i * 1.5));
      px(c, '#ffffff', 13 - i, 15 + Math.round(i * 1.5));
    }
  },
  // 7 Rainbow Clouds: a rainbow and a cloud
  (c) => {
    const bands = ['#ff8a8a', '#ffe680', '#9ee89a', '#8fd0ff'];
    bands.forEach((col, i) => fill(c, W, W, (x, y) => y < 16 && Math.abs(Math.hypot(x - 12, (y - 16) * 1.2) - (10 - i * 1.6)) < 0.9, col));
    shape(c, W, W, any(ell(9, 16, 4, 3), ell(14, 15, 4.5, 3.5), ell(17, 17, 3, 2.5)), '#ffffff');
  },
  // 8 Snowy Mountain: a snow-capped peak
  (c) => {
    const m: Pred = (x, y) => y >= 5 && y < 21 && Math.abs(x + 0.5 - 12) <= (y - 4) * 0.6;
    shape(c, W, W, m, '#8aa8c8');
    fill(c, W, W, (x, y) => m(x, y) && y < 11 + Math.sin(x) , '#ffffff');
  },
  // 9 Toy Workshop: stacked toy blocks
  (c) => {
    shape(c, W, W, rect(4, 13, 8, 8), '#ff6b6b');
    shape(c, W, W, rect(12, 13, 8, 8), '#4f9dff');
    shape(c, W, W, rect(8, 5, 8, 8), '#ffd23f');
    px(c, '#ffffff', 10, 7, 3, 3);
  },
  // 10 Crystal Caves: a glowing crystal cluster
  (c) => {
    for (const [cx, top, col] of [[12, 3, '#9ef0ff'], [7, 9, '#ff9fd8'], [17, 8, '#c9a3ff']] as const)
      shape(c, W, W, (x, y) => y >= top && y < 21 && Math.abs(x + 0.5 - cx) <= Math.min(3, (y - top) * 0.8 + 0.5), col);
    px(c, '#ffffff', 11, 7, 1, 4);
  },
  // 11 Starry Night Sky: a crescent moon and a star
  (c) => {
    shape(c, W, W, (x, y) => (x + 0.5 - 10) ** 2 + (y + 0.5 - 12) ** 2 <= 36 && (x + 0.5 - 13) ** 2 + (y + 0.5 - 10) ** 2 > 25, '#fff0a0');
    px(c, '#ffe066', 17, 5, 1, 5);
    px(c, '#ffe066', 15, 7, 5, 1);
  },
  // 12 Royal Castle: a pink castle with a flag
  (c) => {
    const castle = any(rect(5, 11, 14, 10), rect(4, 7, 4, 14), rect(16, 7, 4, 14), rect(10, 5, 4, 16));
    shape(c, W, W, castle, '#ffb8d8');
    px(c, CSS.outline, 11, 15, 2, 6);
    px(c, CSS.outline, 12, 1, 1, 5);
    px(c, '#ff4f6a', 13, 1, 3, 2);
  },
];

export function generateMapArt(scene: Phaser.Scene): void {
  // ---- Title background: a castle at sunset ----
  {
    const [c, ctx] = makeCanvas(GAME_WIDTH, GAME_HEIGHT);
    skyGradient(ctx, GAME_WIDTH, 80, '#6a4aa0', '#ff8aa8');
    skyGradient(ctx, GAME_WIDTH, GAME_HEIGHT, '#ff8aa8', '#ffd08a', 80);
    // The setting sun, half behind the hills.
    for (let y = -24; y <= 0; y++) for (let x = -24; x <= 24; x++) if (x * x + y * y <= 576) px(ctx, y > -6 ? '#ffe680' : '#fff0a0', 236 + x, 128 + y);
    wavyFill(ctx, GAME_WIDTH, GAME_HEIGHT, 128, [[6, 2, 0], [3, 5, 1]], '#a85a8a', '#c8709a');
    wavyFill(ctx, GAME_WIDTH, GAME_HEIGHT, 148, [[4, 3, 1], [2, 7, 0]], '#7a3a7a', '#904a8a');
    // Castle silhouette with warm lit windows and pink flags.
    const castle = any(rect(110, 96, 100, 60), rect(100, 76, 20, 80), rect(200, 76, 20, 80), rect(145, 62, 30, 94), (x, y) => y >= 50 && y < 63 && Math.abs(x - 160) <= (y - 50) * 1.2);
    shape(ctx, GAME_WIDTH, GAME_HEIGHT, castle, '#4a3070', '#2a1438');
    for (const [x0, y0] of [[100, 72], [200, 72]]) shape(ctx, GAME_WIDTH, GAME_HEIGHT, (x, y) => y >= y0 - 10 && y < y0 + 4 && Math.abs(x - (x0 + 10)) <= (y - (y0 - 10)) * 0.9, '#4a3070', '#2a1438');
    for (let x = 112; x < 210; x += 8) px(ctx, '#4a3070', x, 92, 4, 4); // battlements
    for (const [x, y] of [[106, 100], [206, 100], [130, 112], [150, 80], [164, 80], [182, 112], [158, 104]]) px(ctx, '#ffe066', x, y, 4, 6);
    px(ctx, '#2a1438', 154, 130, 12, 26); // door
    for (const fx of [110, 210, 160]) {
      const fy = fx === 160 ? 38 : 58;
      px(ctx, '#2a1438', fx, fy, 1, 10);
      px(ctx, '#ff86bf', fx + 1, fy, 6, 3);
    }
    addTexture(scene, MAP_TEX.sunset, c);
  }

  // ---- Map background: a storybook page ----
  {
    const [c, ctx] = makeCanvas(GAME_WIDTH, GAME_HEIGHT);
    px(ctx, '#f6e8c8', 0, 0, GAME_WIDTH, GAME_HEIGHT);
    // Darker, dithered edges like an old page.
    fill(ctx, GAME_WIDTH, GAME_HEIGHT, (x, y) => {
      const edge = Math.min(x, y, GAME_WIDTH - 1 - x, GAME_HEIGHT - 1 - y);
      return edge < 6 && (x + y) % (edge < 3 ? 1 : 2) === 0;
    }, '#e8d0a0');
    // Little storybook doodles: trees, waves, hills.
    for (const [x, y] of [[60, 40], [210, 44], [30, 100], [300, 96], [170, 100]]) {
      shape(ctx, GAME_WIDTH, GAME_HEIGHT, ell(x, y, 4, 4), '#c8e0a8', '#c8b080');
      px(ctx, '#c8b080', x, y + 4, 1, 4);
    }
    for (const [x, y] of [[110, 140], [250, 140], [20, 30]]) {
      for (let i = 0; i < 12; i++) px(ctx, '#b8d8e8', x + i, y + Math.round(Math.sin(i / 2) * 1.5));
    }
    addTexture(scene, MAP_TEX.parchment, c);
  }

  // ---- Land icons ----
  LAND_PICTURES.forEach((paint, i) => {
    const [c, ctx] = makeCanvas(W, W);
    shape(ctx, W, W, ell(12, 12, 11.5, 11.5), LAND_COLORS[i]);
    shadeBottom(ctx, W, W, ell(12, 12, 11.5, 11.5), 'rgba(0,0,0,0.12)');
    paint(ctx);
    addTexture(scene, MAP_TEX.land(i + 1), c);
  });

  // ---- Soft padlock (locked lands) ----
  {
    const [c, ctx] = makeCanvas(14, 16);
    const lock = maskOf(12, 14, (x, y) => (y >= 6 ? x >= 0 && x <= 11 : (() => {
      const d = Math.hypot(x + 0.5 - 6, y + 0.5 - 6.5);
      return d <= 5 && d >= 3;
    })()));
    drawMaskOutlined(ctx, lock, 1, 1, '#c9b8e8', '#7a6e9a');
    px(ctx, '#7a6e9a', 6, 9, 2, 3);
    addTexture(scene, MAP_TEX.padlock, c);
  }

  // ---- Path dot ----
  {
    const [c, ctx] = makeCanvas(3, 3);
    px(ctx, '#c8945a', 0, 1, 3, 1);
    px(ctx, '#c8945a', 1, 0, 1, 3);
    addTexture(scene, MAP_TEX.dot, c);
  }

  // ---- Yes / No round buttons (parent reset question) ----
  const check = maskFromRows([
    '..........##',
    '.........###',
    '........###.',
    '.......###..',
    '##....###...',
    '###..###....',
    '.######.....',
    '..####......',
    '...##.......',
  ]);
  const cross = maskOf(11, 11, (x, y) => Math.abs(x - y) <= 1 || Math.abs(x - (10 - y)) <= 1);
  for (const [key, mask, col, rim] of [
    [MAP_TEX.yes, check, CSS.grass, CSS.grassDark],
    [MAP_TEX.no, cross, CSS.pink, CSS.pinkDark],
  ] as const) {
    const [c, ctx] = makeCanvas(40, 40);
    shape(ctx, 40, 40, ell(20, 20, 19, 19), col, rim);
    const [ic, ictx] = makeCanvas(mask[0].length + 2, mask.length + 2);
    drawMaskOutlined(ictx, mask, 1, 1, CSS.white, CSS.outline);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(ic, Math.round(20 - ic.width), Math.round(20 - ic.height), ic.width * 2, ic.height * 2);
    addTexture(scene, key, c);
  }

  // ---- Throne ----
  {
    const [c, ctx] = makeCanvas(32, 44);
    const back = any(rect(4, 2, 24, 30), ell(16, 4, 12, 4));
    shape(ctx, 32, 44, back, '#ffc84a');
    fill(ctx, 32, 44, any(rect(7, 7, 18, 22), ell(16, 8, 9, 3)), '#d83a5a');
    shape(ctx, 32, 44, any(rect(1, 28, 30, 6), rect(3, 34, 4, 9), rect(25, 34, 4, 9)), '#ffc84a');
    fill(ctx, 32, 44, rect(2, 29, 28, 3), '#e85a7a'); // the cushion
    px(ctx, '#ffffff', 15, 1, 2, 2);
    addTexture(scene, MAP_TEX.throne, c);
  }

  // ---- Big star (final screen) ----
  {
    const [c, ctx] = makeCanvas(40, 40);
    const star: Pred = (x, y) => {
      const dx = x + 0.5 - 20;
      const dy = y + 0.5 - 21;
      const a = Math.atan2(dy, dx) + Math.PI / 2;
      return Math.hypot(dx, dy) <= 8 + 11 * Math.abs(Math.cos((5 * a) / 2)) ** 2.5;
    };
    shape(ctx, 40, 40, star, '#ffe066');
    fill(ctx, 40, 40, (x, y) => star(x, y) && y < 18 && x < 20, '#fff6b0');
    px(ctx, CSS.outline, 16, 20, 2, 3);
    px(ctx, CSS.outline, 22, 20, 2, 3);
    px(ctx, CSS.outline, 17, 25, 6, 1); // a happy face
    addTexture(scene, MAP_TEX.star, c);
  }

  // ---- On/off switches for the parent panel (green with the knob right = on; grey, knob left = off) ----
  for (const on of [true, false]) {
    const [c, ctx] = makeCanvas(26, 14);
    shape(ctx, 26, 14, any(ell(7, 7, 6, 6), ell(19, 7, 6, 6), rect(7, 1, 12, 12)), on ? CSS.grass : '#c8c0d0', on ? CSS.grassDark : '#8f88a0');
    shape(ctx, 26, 14, ell(on ? 19 : 7, 7, 4.5, 4.5), CSS.white);
    addTexture(scene, on ? MAP_TEX.switchOn : MAP_TEX.switchOff, c);
  }

  // ---- Confetti (white, tinted in the game) and the friendly wind cloud for the story ----
  {
    const [c, ctx] = makeCanvas(3, 2);
    px(ctx, '#ffffff', 0, 0, 3, 2);
    addTexture(scene, MAP_TEX.confetti, c);
    const [wc, wctx] = makeCanvas(40, 26);
    const cloud = any(ell(20, 14, 16, 9), ell(12, 9, 8, 7), ell(26, 8, 9, 7));
    shape(wctx, 40, 26, cloud, '#e8ecff');
    px(wctx, CSS.outline, 12, 11, 2, 2);
    px(wctx, CSS.outline, 20, 11, 2, 2); // eyes
    shape(wctx, 40, 26, ell(6, 16, 3, 2.5), '#ffffff'); // puffed-out "whoosh" lips
    px(wctx, '#ff9fc8', 9, 14, 2, 1);
    addTexture(scene, MAP_TEX.windFace, wc);
  }

}
