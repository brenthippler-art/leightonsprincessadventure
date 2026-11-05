import Phaser from 'phaser';
import { CSS } from '../constants';
import { addTexture, drawMaskOutlined, drawRows, makeCanvas, type Mask } from './pixels';

/**
 * Code-drawn art for things inside levels: the jewel and its pedestal, checkpoint flags,
 * placeholder obstacles, and the HUD crown. (Themes will restyle some of these later.)
 *
 * The jewel is drawn in GRAYS on purpose: the game tints it with each level's jewel color,
 * so one drawing makes all 12 jewels.
 */
export const LEVEL_TEX = {
  jewel: 'jewel',
  jewelMini: 'jewel-mini',
  glow: 'glow',
  pedestal: 'pedestal',
  flag: 'flag',
  thorns: 'thorns',
  blob: 'blob',
  crown: 'hud-crown',
} as const;

export const LEVEL_ANIMS = {
  flagWave: 'flag-wave',
  blobWalk: 'blob-walk',
} as const;

/** Top-left corners of the 12 jewel sockets inside the HUD crown picture (each socket is 4x4). */
export const CROWN_SOCKETS: [number, number][] = [];
for (let row = 0; row < 2; row++) for (let i = 0; i < 6; i++) CROWN_SOCKETS.push([5 + i * 6, 9 + row * 5]);

const GRAYS = { o: CSS.outline, w: '#ffffff', l: '#d8d8d8', m: '#9a9a9a' };

/** Build a frame strip texture from several canvases of the same size. */
export function addStrip(scene: Phaser.Scene, key: string, frames: HTMLCanvasElement[]): void {
  const w = frames[0].width;
  const h = frames[0].height;
  const [canvas, ctx] = makeCanvas(w * frames.length, h);
  frames.forEach((f, i) => ctx.drawImage(f, i * w, 0));
  addTexture(scene, key, canvas);
  const tex = scene.textures.get(key);
  frames.forEach((_, i) => tex.add(i, 0, i * w, 0, w, h));
}

/** A mask of the given size, true wherever `inside(x, y)` says so. */
export function maskOf(w: number, h: number, inside: (x: number, y: number) => boolean): Mask {
  return Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => inside(x, y)));
}

export function generateLevelArt(scene: Phaser.Scene): void {
  // ---- Jewel (11x9, gray so it can be tinted) ----
  {
    const [canvas, ctx] = makeCanvas(11, 9);
    drawRows(
      ctx,
      [
        '..ooooooo..',
        '.owwllllmo.',
        'owwllllllmo',
        'olllllllmmo',
        '.olllllmmo.',
        '..ollmmmo..',
        '...olmmo...',
        '....omo....',
        '.....o.....',
      ],
      GRAYS,
    );
    addTexture(scene, LEVEL_TEX.jewel, canvas);
  }
  // ---- Tiny jewel for the HUD crown sockets (4x4) ----
  {
    const [canvas, ctx] = makeCanvas(4, 4);
    drawRows(ctx, ['wlll', 'llll', 'lllm', 'lmmm'], GRAYS);
    addTexture(scene, LEVEL_TEX.jewelMini, canvas);
  }
  // ---- Soft glow (white, dithered so it fades out in a pixel-art way; tinted in game) ----
  {
    const R = 12;
    const [canvas, ctx] = makeCanvas(R * 2, R * 2);
    const bayer = [
      [0, 0.5],
      [0.75, 0.25],
    ];
    ctx.fillStyle = '#ffffff';
    for (let y = 0; y < R * 2; y++)
      for (let x = 0; x < R * 2; x++) {
        const d = Math.hypot(x + 0.5 - R, y + 0.5 - R) / R;
        if (1 - d > bayer[y % 2][x % 2] + 0.15) ctx.fillRect(x, y, 1, 1);
      }
    addTexture(scene, LEVEL_TEX.glow, canvas);
  }
  // ---- Pedestal (14x10) ----
  {
    const [canvas, ctx] = makeCanvas(14, 10);
    drawRows(
      ctx,
      [
        '.oooooooooooo.',
        'oggggggggggggo',
        'oGGGGGGGGGGGGo',
        '.oooggggggooo.',
        '...ogggggGo...',
        '...ogggggGo...',
        '...ogggggGo...',
        '..oooooooooo..',
        '..oggggggggo..',
        '..oooooooooo..',
      ],
      { o: CSS.outline, g: '#f2e6ff', G: '#c4a8e8' },
    );
    addTexture(scene, LEVEL_TEX.pedestal, canvas);
  }

  // ---- Checkpoint flag (16x24): frame 0 = lowered, frames 1-2 = raised and waving ----
  {
    const frames = [0, 1, 2].map((f) => {
      const [canvas, ctx] = makeCanvas(16, 24);
      // pole
      ctx.fillStyle = CSS.outline;
      ctx.fillRect(2, 2, 4, 22);
      ctx.fillStyle = CSS.cream;
      ctx.fillRect(3, 3, 2, 21);
      // gold ball on top
      drawMaskOutlined(ctx, maskOf(3, 3, () => true), 2, 0, CSS.gold, CSS.outline);
      // the flag cloth
      const top = f === 0 ? 14 : 3;
      const cloth = maskOf(10, 8, (x, y) => {
        const wiggle = f === 2 ? (x > 4 ? 1 : 0) : 0;
        const yy = y - wiggle;
        const half = 3.5 - Math.abs(yy - 3.5);
        return x <= half * 2.6 && yy >= 0;
      });
      drawMaskOutlined(ctx, cloth, 5, top, f === 0 ? '#d9c7d9' : CSS.pink, CSS.outline);
      if (f > 0) {
        ctx.fillStyle = CSS.gold; // a little star on the raised flag
        ctx.fillRect(7, top + 3, 1, 2);
        ctx.fillRect(6, top + 4, 3, 0 + 1);
      }
      return canvas;
    });
    addStrip(scene, LEVEL_TEX.flag, frames);
  }

  // ---- Thorns: a round bramble bush with pale spikes (16x16) ----
  {
    const [canvas, ctx] = makeCanvas(16, 16);
    const dome = (x: number, y: number) => ((x - 7.5) / 6.5) ** 2 + ((y - 15) / 7) ** 2 <= 1;
    const spikes: [number, number][] = [
      [3, 8],
      [2, 7],
      [7, 6],
      [7, 5],
      [12, 8],
      [13, 7],
      [1, 11],
      [0, 11],
      [14, 11],
      [15, 11],
    ];
    const isSpike = (x: number, y: number) => spikes.some(([sx, sy]) => sx === x && sy === y);
    const mask = maskOf(16, 16, (x, y) => (dome(x, y) || isSpike(x, y)) && x > 0 && x < 15 && y > 0);
    drawMaskOutlined(ctx, mask, 0, 0, '#7a3d8f', CSS.outline);
    ctx.fillStyle = '#a85fc0';
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (dome(x, y) && dome(x + 1, y + 2) && y < 12) ctx.fillRect(x, y, 1, 1);
    ctx.fillStyle = CSS.cream;
    for (const [x, y] of spikes) if (mask[y]?.[x]) ctx.fillRect(x, y, 1, 1);
    addTexture(scene, LEVEL_TEX.thorns, canvas);
  }

  // ---- Blob: a grumpy jelly that waddles (16x14, 2 frames) ----
  {
    const frames = [
      { rx: 6.5, ry: 6, cy: 7.5 },
      { rx: 7, ry: 5, cy: 8.5 },
    ].map(({ rx, ry, cy }) => {
      const [canvas, ctx] = makeCanvas(16, 14);
      const inside = (x: number, y: number) => ((x + 0.5 - 8) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
      drawMaskOutlined(ctx, maskOf(16, 14, inside), 0, 0, '#8a6bff', CSS.outline);
      ctx.fillStyle = '#5b3fc9';
      for (let y = 0; y < 14; y++) for (let x = 0; x < 16; x++) if (inside(x, y) && !inside(x, y + 2)) ctx.fillRect(x, y, 1, 1);
      ctx.fillStyle = '#c4b3ff';
      ctx.fillRect(5, Math.round(cy - ry + 2), 2, 1);
      // eyes and a grumpy little frown
      const ey = Math.round(cy - 1);
      ctx.fillStyle = CSS.white;
      ctx.fillRect(5, ey, 2, 2);
      ctx.fillRect(9, ey, 2, 2);
      ctx.fillStyle = CSS.outline;
      ctx.fillRect(6, ey + 1, 1, 1);
      ctx.fillRect(10, ey + 1, 1, 1);
      ctx.fillRect(7, ey + 3, 2, 1);
      return canvas;
    });
    addStrip(scene, LEVEL_TEX.blob, frames);
  }

  // ---- HUD crown (44x22) with 12 empty sockets ----
  {
    const [canvas, ctx] = makeCanvas(44, 22);
    const points = [4, 13, 22, 31, 40];
    const mask = maskOf(44, 22, (x, y) => {
      if (y >= 8 && y <= 20 && x >= 1 && x <= 42) return true;
      if (y < 1 || y > 7) return false;
      const half = (y - 1) * 0.7;
      return points.some((px) => Math.abs(x - px) <= half) && x >= 1 && x <= 42;
    });
    drawMaskOutlined(ctx, mask, 0, 0, CSS.gold, CSS.outline);
    ctx.fillStyle = CSS.goldDark;
    ctx.fillRect(1, 19, 42, 2);
    ctx.fillStyle = '#fff2b0';
    ctx.fillRect(1, 8, 42, 1);
    for (const [sx, sy] of CROWN_SOCKETS) {
      ctx.fillStyle = '#6b3d1e';
      ctx.fillRect(sx, sy, 4, 4);
      ctx.fillStyle = '#4a2410';
      ctx.fillRect(sx, sy, 4, 1);
    }
    addTexture(scene, LEVEL_TEX.crown, canvas);
  }

  // ---- Animations ----
  const anims = scene.anims;
  const make = (key: string, tex: string, frames: number[], frameRate: number) => {
    if (anims.exists(key)) anims.remove(key);
    anims.create({ key, frames: frames.map((frame) => ({ key: tex, frame })), frameRate, repeat: -1 });
  };
  make(LEVEL_ANIMS.flagWave, LEVEL_TEX.flag, [1, 2], 4);
  make(LEVEL_ANIMS.blobWalk, LEVEL_TEX.blob, [0, 1], 4);
}
