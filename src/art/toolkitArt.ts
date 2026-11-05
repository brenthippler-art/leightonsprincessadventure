import Phaser from 'phaser';
import { CSS, TILE_SIZE } from '../constants';
import type { GemColor, ShapeKind } from '../levels/types';
import { addStrip, maskOf } from './levelArt';
import { addTexture, drawMaskOutlined, makeCanvas, type Mask } from './pixels';
import { STAR } from './uiArt';

/**
 * PLACEHOLDER art for the obstacle / barrier / puzzle toolkit.
 * Deliberately plain and neutral; themes (step 5) reskin pieces by swapping these textures.
 *
 * Many icons are drawn in WHITE so the game can tint them any color.
 */
export const TK = {
  butterfly: 'tk-butterfly',
  hopper: 'tk-hopper',
  hopperFriend: 'tk-hopper-friend',
  roller: 'tk-roller',
  flowers: 'tk-flowers',
  flyer: 'tk-flyer',
  flyerFriend: 'tk-flyer-friend',
  drop: 'tk-drop',
  petal: 'tk-petal',
  hanger: 'tk-hanger',
  shadow: 'tk-shadow',
  thornsFriend: 'tk-thorns-friend',
  wall: 'tk-wall',
  pad: 'tk-pad',
  plank: 'tk-plank',
  emblem: 'tk-emblem',
  button: 'tk-button',
  block: 'tk-block',
  crate: 'tk-crate',
  stone: 'tk-stone',
  floorSwitch: 'tk-switch',
  bell: 'tk-bell',
  key: 'tk-key',
  lock: 'tk-lock',
  note: 'tk-note',
  dot: 'tk-dot',
  slot: 'tk-slot',
  bubble: 'tk-bubble',
  bubbleSmall: 'tk-bubble-small',
} as const;

export const TK_ANIMS = {
  butterfly: 'tk-butterfly-flap',
  roller: 'tk-roller-roll',
  flyer: 'tk-flyer-flap',
  flyerFriend: 'tk-flyer-friend-flap',
} as const;

/** Gem colors as numbers (for tinting), and the shape that goes with each color (for colorblind players). */
export const GEM: Record<GemColor, { color: number; icon: string; shapeName: string }> = {
  red: { color: 0xff5a6e, icon: 'tk-icon-heart', shapeName: 'heart' },
  blue: { color: 0x4f9dff, icon: 'tk-icon-star', shapeName: 'star' },
  yellow: { color: 0xffd23f, icon: 'tk-icon-sun', shapeName: 'sun' },
  green: { color: 0x5ee07a, icon: 'tk-icon-leaf', shapeName: 'leaf' },
};

export const SHAPE: Record<ShapeKind, { solid: string; outline: string; color: number }> = {
  circle: { solid: 'tk-shape-circle', outline: 'tk-shape-circle-outline', color: 0xff86bf },
  square: { solid: 'tk-shape-square', outline: 'tk-shape-square-outline', color: 0x7cc8ff },
  triangle: { solid: 'tk-shape-triangle', outline: 'tk-shape-triangle-outline', color: 0xffcf3a },
  scallop: { solid: 'tk-shape-scallop', outline: 'tk-shape-scallop-outline', color: 0xffa8c8 },
  starfish: { solid: 'tk-shape-starfish', outline: 'tk-shape-starfish-outline', color: 0xffa060 },
  conch: { solid: 'tk-shape-conch', outline: 'tk-shape-conch-outline', color: 0xd8b0ff },
  snowflake: { solid: 'tk-shape-snowflake', outline: 'tk-shape-snowflake-outline', color: 0x9ef0ff },
  mitten: { solid: 'tk-shape-mitten', outline: 'tk-shape-mitten-outline', color: 0xff6b8a },
  snowman: { solid: 'tk-shape-snowman', outline: 'tk-shape-snowman-outline', color: 0xffffff },
  moon: { solid: 'tk-shape-moon', outline: 'tk-shape-moon-outline', color: 0xfff0a0 },
  star: { solid: 'tk-shape-star', outline: 'tk-shape-star-outline', color: 0xffd23f },
  sun: { solid: 'tk-shape-sun', outline: 'tk-shape-sun-outline', color: 0xff9a4a },
};

/** The three bells' colors (left, middle, right). */
export const BELL_COLORS = [0xff86bf, 0x7cc8ff, 0xffd23f];

// ---------- Shape masks ----------
const heart = maskOf(11, 10, (x, y) => {
  const c = (cx: number) => (x + 0.5 - cx) ** 2 + (y + 0.5 - 3.2) ** 2 <= 7.8;
  return c(3.2) || c(7.8) || (y >= 3 && Math.abs(x + 0.5 - 5.5) <= (9.6 - y) * 0.8);
});
const sun = maskOf(11, 11, (x, y) => {
  const dx = x - 5;
  const dy = y - 5;
  const d = Math.hypot(dx, dy);
  const onRay = dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy);
  return d <= 3.2 || (onRay && d >= 4.2 && d <= 5.6);
});
const leaf = maskOf(11, 11, (x, y) => {
  const u = x - 5 + (y - 5);
  const v = x - 5 - (y - 5);
  return (u * u) / 70 + (v * v) / 14 <= 1 || (x === 1 && y === 9) || (x === 0 && y === 10);
});
const circle = maskOf(12, 12, (x, y) => (x + 0.5 - 6) ** 2 + (y + 0.5 - 6) ** 2 <= 31);
const square = maskOf(12, 12, (x, y) => x >= 1 && x <= 10 && y >= 1 && y <= 10);
const triangle = maskOf(12, 12, (x, y) => y >= 1 && y <= 10 && Math.abs(x + 0.5 - 6) <= (y + 0.5) * 0.55);
/** Winter shapes (Snowy Mountain): a six-armed snowflake, a mitten with a thumb, a two-ball snowman. */
const snowflake = maskOf(13, 13, (x, y) => {
  const dx = x - 6;
  const dy = y - 6;
  const d = Math.hypot(dx, dy);
  if (d > 6.2) return false;
  const a = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 60;
  const arm = Math.min(a, 60 - a) * (Math.PI / 180) * d <= 0.9; // thin arms every 60 degrees
  const twig = d > 3 && d < 4.6 && Math.min(a, 60 - a) < 28; // little side branches
  return d <= 1.6 || arm || twig;
});
const mitten = maskOf(12, 12, (x, y) => ((x + 0.5 - 6.5) / 4) ** 2 + ((y + 0.5 - 5) / 4.5) ** 2 <= 1 || (x >= 3 && x <= 10 && y >= 5 && y <= 11) || ((x + 0.5 - 2) / 1.6) ** 2 + ((y + 0.5 - 5) / 2.4) ** 2 <= 1);
const snowman = maskOf(12, 12, (x, y) => (x + 0.5 - 6) ** 2 + (y + 0.5 - 3) ** 2 <= 7.5 || (x + 0.5 - 6) ** 2 + (y + 0.5 - 8.3) ** 2 <= 13);
/** Night-sky shapes (Starry Night): a crescent moon (the star and sun reuse the color-match icons). */
const moon = maskOf(12, 12, (x, y) => (x + 0.5 - 6) ** 2 + (y + 0.5 - 6) ** 2 <= 30 && (x + 0.5 - 8.5) ** 2 + (y + 0.5 - 4.5) ** 2 > 20);
/** Seashell shapes (Under the Sea): a fan-shaped scallop, a 5-armed starfish, a pointy conch. */
const scallop = maskOf(12, 12, (x, y) => ((x + 0.5 - 6) ** 2 + (y + 0.5 - 11) ** 2 <= 92 && y >= 1 && y <= 9) || (y >= 9 && y <= 10 && x >= 4 && x <= 7));
const starfish = maskOf(12, 12, (x, y) => {
  const dx = x + 0.5 - 6;
  const dy = y + 0.5 - 6.3;
  const a = Math.atan2(dy, dx) + Math.PI / 2;
  const r = 2.2 + 3.6 * Math.abs(Math.cos((5 * a) / 2)) ** 3; // five arms
  return Math.hypot(dx, dy) <= r;
});
const conch = maskOf(12, 12, (x, y) => ((x + 0.5 - 5) / 4.5) ** 2 + ((y + 0.5 - 5) / 4) ** 2 <= 1 || (y >= 5 && y <= 11 && Math.abs(x + 0.5 - 5) <= (11.5 - y) * 0.6) || (x >= 8 && x <= 10 && y >= 3 && y <= 5));

/** Just the edge pixels of a mask (for "shape outline" slots). */
function edgeOf(m: Mask): Mask {
  return m.map((row, y) =>
    row.map((v, x) => v && (!m[y - 1]?.[x] || !m[y + 1]?.[x] || !row[x - 1] || !row[x + 1])),
  );
}

function iconTexture(scene: Phaser.Scene, key: string, mask: Mask, fill = CSS.white): void {
  const [canvas, ctx] = makeCanvas(mask[0].length + 2, mask.length + 2);
  drawMaskOutlined(ctx, mask, 1, 1, fill, CSS.outline);
  addTexture(scene, key, canvas);
}

/** A canvas with an outlined filled rectangle (a quick "box" for placeholder pieces). */
function box(w: number, h: number, fill: string, shade: string): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const [canvas, ctx] = makeCanvas(w, h);
  ctx.fillStyle = CSS.outline;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(1, 1, w - 2, h - 2);
  ctx.fillStyle = shade;
  ctx.fillRect(1, h - 3, w - 2, 2);
  return [canvas, ctx];
}

function ellipseFrame(w: number, h: number, rx: number, ry: number, cy: number, fill: string, shade: string, face?: 'grump' | 'smile') {
  const [canvas, ctx] = makeCanvas(w, h);
  const cx = w / 2;
  const inside = (x: number, y: number) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
  drawMaskOutlined(ctx, maskOf(w, h, inside), 0, 0, fill, CSS.outline);
  ctx.fillStyle = shade;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inside(x, y) && !inside(x, y + 2)) ctx.fillRect(x, y, 1, 1);
  if (face) {
    const ey = Math.round(cy - 1);
    const ex = Math.round(cx);
    ctx.fillStyle = CSS.white;
    ctx.fillRect(ex - 4, ey, 2, 2);
    ctx.fillRect(ex + 2, ey, 2, 2);
    ctx.fillStyle = CSS.outline;
    ctx.fillRect(ex - 3, ey + 1, 1, 1);
    ctx.fillRect(ex + 3, ey + 1, 1, 1);
    if (face === 'grump') ctx.fillRect(ex - 1, ey + 3, 2, 1);
    else {
      ctx.fillRect(ex - 2, ey + 3, 1, 1);
      ctx.fillRect(ex - 1, ey + 4, 2, 1);
      ctx.fillRect(ex + 1, ey + 3, 1, 1);
      ctx.fillStyle = CSS.pink;
      ctx.fillRect(ex - 5, ey + 2, 1, 1);
      ctx.fillRect(ex + 4, ey + 2, 1, 1);
    }
  }
  return canvas;
}

export function generateToolkitArt(scene: Phaser.Scene): void {
  const grumpy = { fill: '#9a8fb0', shade: '#6f6488' }; // neutral gray-lilac "obstacle" color
  const friendly = { fill: '#ffc2e2', shade: '#f08cc0' }; // soft pink "friend" color

  // ---- Obstacles and their friendly versions ----
  addStrip(scene, TK.butterfly, [0, 1].map((f) => {
    const [c, ctx] = makeCanvas(12, 10);
    const wing = maskOf(12, 10, (x, y) => {
      const open = f === 0 ? 5 : 3;
      const d = Math.abs(x + 0.5 - 6);
      return d >= 1 && d <= open && y >= 1 && y <= 8 && !((y === 1 || y === 8) && d >= open);
    });
    drawMaskOutlined(ctx, wing, 0, 0, CSS.pinkLight, CSS.outline);
    ctx.fillStyle = CSS.outline;
    ctx.fillRect(5, 2, 2, 7);
    ctx.fillStyle = CSS.gold;
    ctx.fillRect(f === 0 ? 2 : 3, 3, 1, 1);
    ctx.fillRect(f === 0 ? 9 : 8, 3, 1, 1);
    return c;
  }));
  addStrip(scene, TK.hopper, [
    ellipseFrame(14, 14, 6, 6, 7.5, grumpy.fill, grumpy.shade, 'grump'),
    ellipseFrame(14, 14, 6.5, 4.5, 9, grumpy.fill, grumpy.shade, 'grump'),
  ]);
  addStrip(scene, TK.hopperFriend, [
    ellipseFrame(14, 14, 6, 6, 7.5, friendly.fill, friendly.shade, 'smile'),
    ellipseFrame(14, 14, 6.5, 4.5, 9, friendly.fill, friendly.shade, 'smile'),
  ]);
  addStrip(scene, TK.roller, [0, 1].map((f) => {
    const [c, ctx] = makeCanvas(14, 14);
    const inside = (x: number, y: number) => (x + 0.5 - 7) ** 2 + (y + 0.5 - 7) ** 2 <= 36;
    drawMaskOutlined(ctx, maskOf(14, 14, inside), 0, 0, grumpy.fill, CSS.outline);
    ctx.fillStyle = grumpy.shade; // stripes that shift between frames, so it looks like it's rolling
    for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) if (inside(x, y) && (x + y + f * 2) % 4 === 0) ctx.fillRect(x, y, 1, 1);
    return c;
  }));
  {
    const [c, ctx] = makeCanvas(16, 10);
    ctx.fillStyle = CSS.grassDark;
    ctx.fillRect(1, 6, 14, 4);
    ctx.fillStyle = CSS.grass;
    for (const x of [2, 5, 8, 11, 14]) ctx.fillRect(x, 4, 1, 3);
    for (const [x, col] of [[2, CSS.pink], [8, CSS.gold], [14, CSS.lilac], [5, CSS.white], [11, CSS.pink]] as const) {
      ctx.fillStyle = col;
      ctx.fillRect(x - 1, 2, 3, 1);
      ctx.fillRect(x, 1, 1, 3);
    }
    addTexture(scene, TK.flowers, c);
  }
  const flyerFrames = (fill: string, shade: string, face: 'grump' | 'smile') =>
    [0, 1].map((f) => {
      const c = ellipseFrame(16, 12, 5, 4.5, 6.5, fill, shade, face);
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = CSS.white; // little wings flapping
      if (f === 0) {
        ctx.fillRect(0, 3, 3, 2);
        ctx.fillRect(13, 3, 3, 2);
      } else {
        ctx.fillRect(0, 6, 3, 2);
        ctx.fillRect(13, 6, 3, 2);
      }
      return c;
    });
  addStrip(scene, TK.flyer, flyerFrames(grumpy.fill, grumpy.shade, 'grump'));
  addStrip(scene, TK.flyerFriend, flyerFrames(friendly.fill, friendly.shade, 'smile'));
  {
    // A spiky seed pod (drops), a flower petal (friendly), the branch knob it hangs from, its shadow.
    const pod = maskOf(10, 10, (x, y) => ((x + 0.5 - 5) / 4) ** 2 + ((y + 0.5 - 5.5) / 4.5) ** 2 <= 1 || (x === 5 && y === 0));
    iconTexture(scene, TK.drop, pod, grumpy.fill);
    iconTexture(scene, TK.petal, maskOf(8, 6, (x, y) => ((x + 0.5 - 4) / 4) ** 2 + ((y + 0.5 - 3) / 2.5) ** 2 <= 1), CSS.pinkLight);
    const [h, hctx] = box(16, 8, '#6f9e57', '#4f7a3a');
    hctx.fillStyle = '#9fd17a';
    hctx.fillRect(3, 2, 3, 2);
    hctx.fillRect(10, 3, 2, 2);
    addTexture(scene, TK.hanger, h);
    const [s, sctx] = makeCanvas(14, 4);
    sctx.fillStyle = '#000000';
    sctx.fillRect(2, 0, 10, 4);
    sctx.fillRect(0, 1, 14, 2);
    addTexture(scene, TK.shadow, s);
  }
  {
    // The thorn bush in bloom: same round bush shape, green with flowers.
    const [c, ctx] = makeCanvas(16, 16);
    const dome = maskOf(16, 16, (x, y) => ((x - 7.5) / 6.5) ** 2 + ((y - 15) / 7) ** 2 <= 1 && y > 0);
    drawMaskOutlined(ctx, dome, 0, 0, CSS.grass, CSS.outline);
    for (const [x, y, col] of [[4, 10, CSS.pink], [9, 9, CSS.gold], [12, 12, CSS.white], [6, 13, CSS.lilac]] as const) {
      ctx.fillStyle = col;
      ctx.fillRect(x - 1, y, 3, 1);
      ctx.fillRect(x, y - 1, 1, 3);
    }
    addTexture(scene, TK.thornsFriend, c);
  }

  // ---- Barriers ----
  {
    const [c, ctx] = box(TILE_SIZE, TILE_SIZE, '#cbbfd9', '#a698b8');
    ctx.fillStyle = '#a698b8'; // brick lines
    ctx.fillRect(1, 7, 14, 1);
    ctx.fillRect(7, 1, 1, 6);
    ctx.fillRect(4, 8, 1, 6);
    ctx.fillRect(11, 8, 1, 6);
    addTexture(scene, TK.wall, c);
  }
  addStrip(scene, TK.pad, [0, 1].map((f) => {
    const [c, ctx] = makeCanvas(16, 10);
    const top = f === 0 ? 1 : 5;
    ctx.fillStyle = CSS.outline;
    ctx.fillRect(1, top, 14, 4);
    ctx.fillStyle = CSS.pink;
    ctx.fillRect(2, top + 1, 12, 2);
    ctx.fillStyle = CSS.outline; // spring zig-zag
    for (let y = top + 4; y < 9; y++) ctx.fillRect(y % 2 === 0 ? 6 : 9, y, 2, 1);
    ctx.fillRect(2, 9, 12, 1);
    return c;
  }));
  {
    const [c, ctx] = box(TILE_SIZE, 8, '#e8d2a8', '#b89a6a');
    ctx.fillStyle = '#b89a6a';
    ctx.fillRect(7, 1, 1, 5);
    addTexture(scene, TK.plank, c);
  }

  // ---- Puzzle pieces ----
  {
    // Emblem plate: a round-cornered cream panel that sits on a gate and shows what the gate wants.
    const [c, ctx] = makeCanvas(20, 20);
    ctx.fillStyle = CSS.outline;
    ctx.fillRect(1, 0, 18, 20);
    ctx.fillRect(0, 1, 20, 18);
    ctx.fillStyle = CSS.cream;
    ctx.fillRect(2, 1, 16, 18);
    ctx.fillRect(1, 2, 18, 16);
    addTexture(scene, TK.emblem, c);
  }
  iconTexture(scene, GEM.red.icon, heart);
  iconTexture(scene, GEM.blue.icon, STAR);
  iconTexture(scene, GEM.yellow.icon, sun);
  iconTexture(scene, GEM.green.icon, leaf);
  for (const [kind, mask] of [['circle', circle], ['square', square], ['triangle', triangle], ['scallop', scallop], ['starfish', starfish], ['conch', conch], ['snowflake', snowflake], ['mitten', mitten], ['snowman', snowman], ['moon', moon], ['star', STAR], ['sun', sun]] as const) {
    iconTexture(scene, SHAPE[kind].solid, mask);
    iconTexture(scene, SHAPE[kind].outline, edgeOf(mask));
  }
  addStrip(scene, TK.button, [0, 1].map((f) => {
    const [c, ctx] = makeCanvas(16, 6);
    const top = f === 0 ? 0 : 3;
    ctx.fillStyle = CSS.outline;
    ctx.fillRect(1, top, 14, 6 - top);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, top + 1, 12, 5 - top - 1 > 0 ? 5 - top - 1 : 1);
    return c;
  }));
  {
    const [c] = box(TILE_SIZE, TILE_SIZE, '#ffe9c7', '#d9b98a');
    addTexture(scene, TK.block, c);
    const [k, kctx] = box(TILE_SIZE, TILE_SIZE, '#d99a5a', '#a86a34');
    kctx.fillStyle = '#a86a34'; // crate cross-planks
    for (let i = 2; i < 14; i++) {
      kctx.fillRect(i, i, 1, 1);
      kctx.fillRect(15 - i, i, 1, 1);
    }
    addTexture(scene, TK.crate, k);
  }
  addStrip(scene, TK.stone, [0, 1].map((f) => {
    const [c, ctx] = box(TILE_SIZE, 8, f ? CSS.gold : '#bdb3c9', f ? CSS.goldDark : '#8f849e');
    if (f) {
      ctx.fillStyle = CSS.white;
      ctx.fillRect(3, 2, 2, 1);
    }
    return c;
  }));
  addStrip(scene, TK.floorSwitch, [0, 1].map((f) => {
    const [c, ctx] = makeCanvas(24, 6);
    const top = f ? 3 : 0;
    ctx.fillStyle = CSS.outline;
    ctx.fillRect(0, top, 24, 6 - top);
    ctx.fillStyle = f ? CSS.grass : '#ff9a9a';
    ctx.fillRect(1, top + 1, 22, Math.max(1, 4 - top));
    return c;
  }));
  {
    // Bell (white, tinted per bell): dome + rim + clapper.
    const bell = maskOf(14, 14, (x, y) => {
      if (y === 0) return x >= 6 && x <= 7;
      if (y >= 1 && y <= 10) return Math.abs(x + 0.5 - 7) <= 2.5 + y * 0.4;
      if (y === 11) return x >= 1 && x <= 12;
      return y === 12 && x >= 6 && x <= 7;
    });
    iconTexture(scene, TK.bell, maskOf(14, 14, (x, y) => bell[y]?.[x] ?? false));
  }
  {
    const keyMask = maskOf(13, 7, (x, y) => {
      const ring = (x + 0.5 - 3.5) ** 2 + (y + 0.5 - 3.5) ** 2;
      if (ring <= 10 && ring >= 2.5) return true;
      if (y === 3 && x >= 6) return true;
      return (x === 10 || x === 12) && (y === 4 || y === 5);
    });
    iconTexture(scene, TK.key, keyMask, CSS.gold);
    const lock = maskOf(11, 12, (x, y) => {
      if (y >= 5) return x >= 0 && x <= 10;
      const d = Math.hypot(x + 0.5 - 5.5, y + 0.5 - 5);
      return d <= 4.5 && d >= 2.5;
    });
    const [lc, lctx] = makeCanvas(13, 14);
    drawMaskOutlined(lctx, lock, 1, 1, CSS.gold, CSS.outline);
    lctx.fillStyle = CSS.outline;
    lctx.fillRect(5, 8, 3, 2);
    lctx.fillRect(6, 10, 1, 2);
    addTexture(scene, TK.lock, lc);
    const note = maskOf(10, 12, (x, y) => (x >= 7 && x <= 8 && y <= 9) || (x >= 7 && y <= 1) || (x + 0.5 - 4.5) ** 2 / 9 + (y + 0.5 - 9.5) ** 2 / 4 <= 1);
    iconTexture(scene, TK.note, note);
  }
  addStrip(scene, TK.dot, [0, 1].map((f) => {
    const [c, ctx] = makeCanvas(5, 5);
    drawMaskOutlined(ctx, maskOf(3, 3, () => true), 1, 1, f ? CSS.gold : '#d8cfe3', CSS.outline);
    return c;
  }));
  {
    // The slot on the ground in front of a shape gate: a dark socket.
    const [c, ctx] = makeCanvas(16, 4);
    ctx.fillStyle = CSS.outline;
    ctx.fillRect(0, 0, 16, 4);
    ctx.fillStyle = '#5a4a6a';
    ctx.fillRect(1, 1, 14, 2);
    addTexture(scene, TK.slot, c);
  }

  // ---- Bubbles (for bubble lifts) ----
  for (const [key, r] of [[TK.bubble, 3], [TK.bubbleSmall, 2]] as const) {
    const [c, ctx] = makeCanvas(r * 2 + 1, r * 2 + 1);
    drawMaskOutlined(ctx, maskOf(r * 2 - 1, r * 2 - 1, (x, y) => (x + 0.5 - (r - 0.5)) ** 2 + (y + 0.5 - (r - 0.5)) ** 2 <= (r - 0.5) ** 2), 1, 1, '#c8f4ff', '#ffffff');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 2, 1, 1);
    addTexture(scene, key, c);
  }

  // ---- Animations ----
  const anims = scene.anims;
  const make = (key: string, tex: string, frameRate: number) => {
    if (anims.exists(key)) anims.remove(key);
    anims.create({ key, frames: [0, 1].map((frame) => ({ key: tex, frame })), frameRate, repeat: -1 });
  };
  make(TK_ANIMS.butterfly, TK.butterfly, 8);
  make(TK_ANIMS.roller, TK.roller, 8);
  make(TK_ANIMS.flyer, TK.flyer, 4);
  make(TK_ANIMS.flyerFriend, TK.flyerFriend, 6);
}

/** A gate texture of a given height (made on demand, since gates are as tall as the space above the ground). */
export function gateTexture(scene: Phaser.Scene, height: number): string {
  const key = `tk-gate-${height}`;
  if (scene.textures.exists(key)) return key;
  const [c, ctx] = makeCanvas(TILE_SIZE, height);
  ctx.fillStyle = CSS.outline;
  ctx.fillRect(0, 0, TILE_SIZE, height);
  ctx.fillStyle = '#b9a6d6';
  ctx.fillRect(1, 0, TILE_SIZE - 2, height);
  ctx.fillStyle = '#8a74b0'; // vertical bars
  for (const x of [4, 8, 12]) ctx.fillRect(x, 0, 1, height);
  for (let y = 6; y < height; y += 24) ctx.fillRect(1, y, TILE_SIZE - 2, 2);
  addTexture(scene, key, c);
  return key;
}

/** A wide platform/cloud texture N tiles across (made on demand). */
export function wideTexture(scene: Phaser.Scene, kind: 'platform' | 'cloud', tiles: number): string {
  const key = `tk-${kind}-${tiles}`;
  if (scene.textures.exists(key)) return key;
  const w = tiles * TILE_SIZE;
  if (kind === 'platform') {
    const [c, ctx] = box(w, 8, '#c4e0ff', '#7fa8d9');
    ctx.fillStyle = '#7fa8d9';
    for (let x = TILE_SIZE; x < w; x += TILE_SIZE) ctx.fillRect(x, 1, 1, 5);
    addTexture(scene, key, c);
  } else {
    const h = 12;
    const [c, ctx] = makeCanvas(w, h);
    const puff = maskOf(w, h, (x, y) => {
      const bump = Math.sin((x / w) * Math.PI * tiles * 1.5) * 2;
      return y >= 3 - bump && y <= h - 2 && x >= 1 && x <= w - 2;
    });
    drawMaskOutlined(ctx, puff, 0, 0, CSS.white, '#b8c4e0');
    ctx.fillStyle = '#e4ecff';
    ctx.fillRect(2, h - 4, w - 4, 2);
    addTexture(scene, key, c);
  }
  return key;
}
