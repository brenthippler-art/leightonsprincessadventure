import Phaser from 'phaser';
import { CSS } from '../constants';
import {
  addTexture,
  drawDisc,
  drawMaskOutlined,
  drawRows,
  flipX,
  makeCanvas,
  maskFromRows,
  rotateLeft,
  type Mask,
} from './pixels';

/**
 * All the pictures for buttons and icons, drawn in code at startup.
 * Call `generateUiArt(scene)` once (BootScene does this) and then use the texture keys below.
 */
export const TEX = {
  iconLeft: 'icon-left',
  iconRight: 'icon-right',
  iconJump: 'icon-jump',
  iconWand: 'icon-wand',
  btnLeft: 'btn-left',
  btnRight: 'btn-right',
  btnJump: 'btn-jump',
  btnWand: 'btn-wand',
  fullscreen: 'btn-fullscreen',
  pause: 'btn-pause',
  btnPlay: 'btn-play',
  btnHome: 'btn-home',
  helpArrow: 'help-arrow',
  bigArrow: 'big-arrow',
  btnMusic: 'btn-music',
  btnSfx: 'btn-sfx',
  sparkle: 'sparkle',
} as const;

/** Suffix for the "lit up / pressed" version of a button texture. */
export const LIT = '-lit';
/** Suffix for the switched-off version of a toggle button (music / sound effects). */
export const OFF = '-off';

/** A chunky right-pointing arrow, 13x13, built from math so it's perfectly symmetric. */
export function arrowRightMask(): Mask {
  const size = 13;
  const mid = 6;
  const mask: Mask = [];
  for (let y = 0; y < size; y++) {
    const d = Math.abs(y - mid);
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) {
      const inHead = x >= 6 && x <= 12 - d;
      const inShaft = d <= 2 && x >= 0 && x < 6;
      row.push(inHead || inShaft);
    }
    mask.push(row);
  }
  return mask;
}

export const STAR = maskFromRows([
  '......#......',
  '.....###.....',
  '.....###.....',
  '....#####....',
  '#############',
  '.###########.',
  '..#########..',
  '...#######...',
  '...#######...',
  '..####.####..',
  '..###...###..',
  '.###.....###.',
  '.#.........#.',
]);

const PAUSE = maskFromRows([
  '###..###',
  '###..###',
  '###..###',
  '###..###',
  '###..###',
  '###..###',
  '###..###',
  '###..###',
  '###..###',
  '###..###',
]);

const HOUSE = maskFromRows([
  '......#......',
  '.....###.....',
  '....#####....',
  '...#######...',
  '..#########..',
  '.###########.',
  '#############',
  '..#########..',
  '..#########..',
  '..###...###..',
  '..###...###..',
  '..###...###..',
  '..###...###..',
]);

/** A right-pointing triangle (the universal Play sign). */
function playMask(): Mask {
  const mask: Mask = [];
  for (let y = 0; y < 13; y++) {
    const d = Math.abs(y - 6);
    mask.push(Array.from({ length: 13 }, (_, x) => x >= 3 && x <= 3 + Math.floor((6 - d) * 1.5)));
  }
  return mask;
}

/** Make a mask twice as big (each pixel becomes 2x2), for chunky big icons. */
function double(mask: Mask): Mask {
  return mask.flatMap((row) => {
    const wide = row.flatMap((v) => [v, v]);
    return [wide, [...wide]];
  });
}

const FULLSCREEN = maskFromRows([
  '####..####',
  '#........#',
  '#........#',
  '#........#',
  '..........',
  '..........',
  '#........#',
  '#........#',
  '#........#',
  '####..####',
]);

/** Draw an icon (mask + outline) onto its own small canvas. */
export function iconCanvas(mask: Mask, fill: string): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(mask[0].length + 2, mask.length + 2);
  drawMaskOutlined(ctx, mask, 1, 1, fill, CSS.outline);
  return canvas;
}

/** A round touch button: colored disc + a big icon in the middle (icon pixels doubled for chunkiness). */
function buttonCanvas(radius: number, fill: string, rim: string, icon: HTMLCanvasElement): HTMLCanvasElement {
  const size = radius * 2;
  const [canvas, ctx] = makeCanvas(size, size);
  drawDisc(ctx, radius, radius, radius, fill, rim, 3);
  const iw = icon.width * 2;
  const ih = icon.height * 2;
  ctx.drawImage(icon, Math.floor((size - iw) / 2), Math.floor((size - ih) / 2), iw, ih);
  return canvas;
}

interface ButtonStyle {
  key: string;
  radius: number;
  fill: string;
  rim: string;
  litFill: string;
  icon: HTMLCanvasElement;
}

export function generateUiArt(scene: Phaser.Scene): void {
  // --- Icons (also used small, e.g. in the test screen's input display) ---
  const right = arrowRightMask();
  const icons = {
    left: iconCanvas(flipX(right), CSS.white),
    right: iconCanvas(right, CSS.white),
    jump: iconCanvas(rotateLeft(right), CSS.white),
    wand: iconCanvas(STAR, CSS.gold),
  };
  addTexture(scene, TEX.iconLeft, icons.left);
  addTexture(scene, TEX.iconRight, icons.right);
  addTexture(scene, TEX.iconJump, icons.jump);
  addTexture(scene, TEX.iconWand, icons.wand);

  // --- Touch buttons: a normal and a lit-up version of each ---
  const buttons: ButtonStyle[] = [
    { key: TEX.btnLeft, radius: 24, fill: CSS.pink, rim: CSS.pinkDark, litFill: CSS.pinkLight, icon: icons.left },
    { key: TEX.btnRight, radius: 24, fill: CSS.pink, rim: CSS.pinkDark, litFill: CSS.pinkLight, icon: icons.right },
    { key: TEX.btnJump, radius: 28, fill: CSS.sky, rim: CSS.skyDark, litFill: '#d2f2ff', icon: icons.jump },
    { key: TEX.btnWand, radius: 24, fill: CSS.lilac, rim: CSS.lilacDark, litFill: '#efe3ff', icon: icons.wand },
  ];
  for (const b of buttons) {
    addTexture(scene, b.key, buttonCanvas(b.radius, b.fill, b.rim, b.icon));
    // Lit version: lighter middle and a golden ring, so pressing is obvious.
    addTexture(scene, b.key + LIT, buttonCanvas(b.radius, b.litFill, CSS.gold, b.icon));
  }

  // --- Small square buttons (top-right): fullscreen and pause ---
  const squares: [string, Mask, number][] = [
    [TEX.fullscreen, FULLSCREEN, 3],
    [TEX.pause, PAUSE, 4],
  ];
  for (const [key, mask, inset] of squares) {
    for (const lit of [false, true]) {
      const [canvas, ctx] = makeCanvas(16, 16);
      ctx.fillStyle = lit ? CSS.gold : CSS.outline;
      ctx.fillRect(1, 0, 14, 16);
      ctx.fillRect(0, 1, 16, 14);
      drawMaskOutlined(ctx, mask, inset, 3, CSS.white, lit ? CSS.goldDark : CSS.outline);
      addTexture(scene, key + (lit ? LIT : ''), canvas);
    }
  }

  // --- Big round Play and Home buttons for the pause screen ---
  const play = iconCanvas(playMask(), CSS.white);
  const home = iconCanvas(HOUSE, CSS.white);
  addTexture(scene, TEX.btnPlay, buttonCanvas(26, CSS.grass, CSS.grassDark, play));
  addTexture(scene, TEX.btnPlay + LIT, buttonCanvas(26, '#8ff0aa', CSS.gold, play));
  addTexture(scene, TEX.btnHome, buttonCanvas(26, CSS.pink, CSS.pinkDark, home));
  addTexture(scene, TEX.btnHome + LIT, buttonCanvas(26, CSS.pinkLight, CSS.gold, home));

  // --- Speaker buttons for the pause screen: music (speaker + note) and sounds (speaker + sparkle) ---
  // "On" is bright; "off" is grey with a slash across, so the difference is clear without words.
  for (const kind of ['music', 'sfx'] as const) {
    for (const off of [false, true]) {
      const [icon, ictx] = makeCanvas(18, 13);
      const speaker = maskFromRows(['....#', '...##', '..###', '#####', '#####', '#####', '..###', '...##', '....#']);
      const symbol =
        kind === 'music'
          ? maskFromRows(['...##.', '...#.#', '...#..', '...#..', '...#..', '.###..', '####..', '.##...'])
          : maskFromRows(['..#..', '..#..', '#####', '..#..', '..#..', '.....', '#...#', '.....']);
      const fill = off ? '#d8d0e0' : CSS.white;
      drawMaskOutlined(ictx, speaker, 1, 2, fill, CSS.outline);
      drawMaskOutlined(ictx, symbol, 9, 2, fill, CSS.outline);
      if (off) {
        ictx.fillStyle = CSS.outline; // the "off" slash
        for (let i = 0; i < 13; i++) ictx.fillRect(2 + i, 12 - i, 2, 1);
      }
      const color = kind === 'music' ? [CSS.lilac, CSS.lilacDark, '#efe3ff'] : [CSS.sky, CSS.skyDark, '#d2f2ff'];
      const fillColor = off ? '#a89cb8' : color[0];
      const rim = off ? '#7a6e8a' : color[1];
      const key = kind === 'music' ? TEX.btnMusic : TEX.btnSfx;
      addTexture(scene, key + (off ? OFF : ''), buttonCanvas(20, fillColor, rim, icon));
      addTexture(scene, key + (off ? OFF : '') + LIT, buttonCanvas(20, off ? '#c8bcd8' : color[2], CSS.gold, icon));
    }
  }

  // --- Big gold arrows: the "go this way!" helper, and the map's "continue" arrow ---
  addTexture(scene, TEX.helpArrow, iconCanvas(double(right), CSS.gold));
  addTexture(scene, TEX.bigArrow, buttonCanvas(30, CSS.gold, CSS.goldDark, iconCanvas(right, CSS.white)));

  // --- Sparkle for the wand: a tiny 5x5 twinkle ---
  {
    const [canvas, ctx] = makeCanvas(5, 5);
    drawRows(ctx, ['..y..', '..w..', 'ywwwy', '..w..', '..y..'], { y: CSS.gold, w: CSS.white });
    addTexture(scene, TEX.sparkle, canvas);
  }
}
