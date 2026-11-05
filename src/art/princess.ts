import Phaser from 'phaser';
import { PRINCESS } from '../config';
import { addTexture, drawRows, makeCanvas } from './pixels';

/**
 * PRINCESS LEIGHTON: drawn entirely in code, from rows of letters.
 *
 * Each letter is one pixel; the PALETTE says what color each letter means.
 * She's built from pieces (head, dress, legs, arm + wand) that are stacked onto a
 * 20x24 frame, so every animation frame shares the same head and dress.
 * Her body is 16 pixels wide; the extra 2 pixels on each side give the wand room to stick out.
 *
 * All 11 frames sit side by side in one texture strip called "princess".
 */

export const PRINCESS_TEXTURE = 'princess';
export const FRAME_W = 20;
export const FRAME_H = 24;
/** The 16-wide body is drawn 2 pixels in from the frame's left edge. */
const OX = 2;

/** 12 colors, in a soft 16-bit style. */
const PALETTE: Record<string, string> = {
  o: '#2b1633', // outline (dark plum, softer than black)
  s: '#ffd9b8', // skin
  S: '#eaa57f', // skin shade
  y: '#fff09a', // blonde hair
  Y: '#e6bf4f', // hair shade
  p: '#ff86bf', // pink dress
  P: '#d9549a', // pink shade (also mouth and shoes)
  b: '#7cc8ff', // blue dress
  B: '#3d8fd6', // blue shade
  g: '#ffb627', // gold (crown, wand)
  G: '#c27417', // gold shade
  w: '#ffffff', // white (wand tip)
  j: '#c27417', // empty jewel slot (same as gold shade, so the palette stays at 12)
};

// ---------------------------------------------------------------------------------------------
// Pieces (in 16-wide body coordinates, facing RIGHT)
// ---------------------------------------------------------------------------------------------

/** Rows 0-11: crown (with 12 empty jewel slots, the 'j's), hair, and face. */
const HEAD = [
  '...o..o..o..o...',
  '..ogoogoogoogo..',
  '.ojgjgjgjgjgjgo.',
  '.ogjgjgjgjgjgjo.',
  '.oYyyyyyyyyyyYo.',
  '.oyyyyyyyyyyyyo.',
  '.oyyyysssssssso.',
  '.oyyYssssossoso.',
  '.oyyYssssossoso.',
  '.oyyYssspsPsspo.',
  '.oyyYSssssssso..',
  '..oYyooooooooo..',
];

/** Rows 12-20: dress. Pink top, blue sash, pink skirt with blue dots, blue hem. */
const DRESS = [
  '..oYyopppppppo..',
  '..oYoppppppppo..',
  '...oBbbbbbbbBo..',
  '...oPppppppppo..',
  '..oPpppbppppppo.',
  '..oPppppppbpppo.',
  '.oPpbpppppppppo.',
  '.oBbbbbbbbbbbbo.',
  '.oooooooooooooo.',
];

/** Rows 21-23: legs and shoes, one set per pose. */
const LEGS = {
  stand: ['.....oso..oso...', '.....oPPo.oPPo..', '.....oooo.oooo..'],
  run1: ['....oso...oso...', '...oPPo....oPPo.', '...oooo....oooo.'],
  run2: ['......oso.oPPo..', '......oPPooooo..', '......oooo......'],
  run3: ['...oso....oso...', '..oPPo....oPPo..', '..oooo....oooo..'],
  run4: ['....oPPo.oso....', '....oooo.oPPo...', '.........oooo...'],
  jumpUp: ['....oso.oPPo....', '....oPPooooo....', '....oooo........'],
  fall: ['.....oso..oso...', '.....oPo..oPo...', '.....ooo..ooo...'],
};

type Pt = [number, number];

/** An arm: skin pixels (outlined automatically), then a gold wand stick and a white tip. */
interface Arm {
  skin: Pt[];
  stick: Pt[];
  tip?: Pt;
  sparkle?: Pt[];
}

const ARMS: Record<string, Arm> = {
  // Arm at her side, wand pointing up and forward.
  down: { skin: [[13, 13], [13, 14], [13, 15]], stick: [[14, 14], [15, 13]], tip: [15, 12] },
  // Arm swung forward (running).
  forward: { skin: [[13, 13], [14, 14], [15, 14], [16, 14]], stick: [[16, 13], [17, 12]], tip: [17, 11] },
  // Arm swung back (running).
  back: { skin: [[12, 13], [11, 14], [10, 15]], stick: [[9, 16]], tip: [8, 17] },
  // Arm raised high with the wand up (jumping, and the first wand-wave frame).
  up: { skin: [[13, 13], [14, 12], [14, 11], [15, 10]], stick: [[16, 9], [16, 8]], tip: [17, 7] },
  // Wand flicked forward (second wand-wave frame), with a little burst at the tip.
  flick: {
    skin: [[13, 13], [14, 13], [15, 13]],
    stick: [[16, 13]],
    tip: [17, 13],
    sparkle: [[17, 11], [17, 15]],
  },
  // Cheering: front arm up high, holding the wand.
  cheerFront: { skin: [[13, 12], [14, 11], [14, 10], [14, 9]], stick: [[15, 8], [15, 7]], tip: [15, 6] },
  // Cheering: back arm up high too.
  cheerBack: { skin: [[2, 12], [1, 11], [1, 10], [1, 9]], stick: [] },
};

/** Draw an arm: dark outline around the skin pixels first, then skin, then the wand on top. */
function drawArm(ctx: CanvasRenderingContext2D, arm: Arm, ox: number, oy: number): void {
  const isSkin = (x: number, y: number) => arm.skin.some(([sx, sy]) => sx === x && sy === y);
  ctx.fillStyle = PALETTE.o;
  for (const [x, y] of arm.skin) {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) if (!isSkin(x + dx, y + dy)) ctx.fillRect(ox + x + dx, oy + y + dy, 1, 1);
  }
  ctx.fillStyle = PALETTE.s;
  for (const [x, y] of arm.skin) ctx.fillRect(ox + x, oy + y, 1, 1);
  ctx.fillStyle = PALETTE.g;
  for (const [x, y] of arm.stick) ctx.fillRect(ox + x, oy + y, 1, 1);
  for (const [x, y] of arm.sparkle ?? []) ctx.fillRect(ox + x, oy + y, 1, 1);
  if (arm.tip) {
    ctx.fillStyle = PALETTE.w;
    ctx.fillRect(ox + arm.tip[0], oy + arm.tip[1], 1, 1);
  }
}

/** The happy face for cheering: eyes become little "^" arches and the smile gets bigger. */
function happyHead(): string[] {
  const rows = HEAD.map((r) => r.split(''));
  // Eyes: keep the top pixel, turn the lower pixel into skin and add the two slanted sides.
  for (const ex of [9, 12]) {
    rows[8][ex] = 's';
    rows[8][ex - 1] = 'o';
    rows[8][ex + 1] = 'o';
  }
  rows[8][14] = 'o'; // keep the face outline intact on the right
  rows[9][10] = 'P';
  rows[9][11] = 'P';
  return rows.map((r) => r.join(''));
}

interface FrameDef {
  legs: string[];
  arms: Arm[];
  /** Push the head and dress down this many pixels (for the idle "breathing" bob). */
  bob?: number;
  happy?: boolean;
}

/** Frame numbers, so code can say FRAMES.cheer instead of a mystery number 10. */
export const FRAMES = {
  idle1: 0,
  idle2: 1,
  run1: 2,
  run2: 3,
  run3: 4,
  run4: 5,
  jumpUp: 6,
  fall: 7,
  wave1: 8,
  wave2: 9,
  cheer: 10,
} as const;

const FRAME_DEFS: FrameDef[] = [
  { legs: LEGS.stand, arms: [ARMS.down] }, // idle1
  { legs: LEGS.stand, arms: [ARMS.down], bob: 1 }, // idle2
  { legs: LEGS.run1, arms: [ARMS.forward] }, // run1
  { legs: LEGS.run2, arms: [ARMS.down] }, // run2
  { legs: LEGS.run3, arms: [ARMS.back] }, // run3
  { legs: LEGS.run4, arms: [ARMS.down] }, // run4
  { legs: LEGS.jumpUp, arms: [ARMS.up] }, // jumpUp
  { legs: LEGS.fall, arms: [ARMS.forward] }, // fall
  { legs: LEGS.stand, arms: [ARMS.up] }, // wave1
  { legs: LEGS.stand, arms: [ARMS.flick] }, // wave2
  { legs: LEGS.stand, arms: [ARMS.cheerBack, ARMS.cheerFront], happy: true }, // cheer
];

/**
 * Where the 12 crown jewel slots are (in frame pixels, before any bob), left to right.
 * A later step can color these in as she finds each jewel.
 */
export const JEWEL_SLOTS: Pt[] = HEAD.flatMap((row, y) =>
  Array.from(row).flatMap((c, x): Pt[] => (c === 'j' ? [[x + OX, y]] : [])),
).sort((a, b) => a[0] - b[0]);

/** Where the wand tip is in the "flick" frame, relative to the sprite's center (for spawning sparkles). */
export const WAND_TIP_OFFSET = {
  x: OX + ARMS.flick.tip![0] - FRAME_W / 2,
  y: ARMS.flick.tip![1] - FRAME_H / 2,
};

/** Draw all frames into one strip texture and set up the animations. Call once at boot. */
export function generatePrincessArt(scene: Phaser.Scene): void {
  const [canvas, ctx] = makeCanvas(FRAME_W * FRAME_DEFS.length, FRAME_H);
  const happy = happyHead();

  FRAME_DEFS.forEach((def, i) => {
    const fx = i * FRAME_W + OX;
    const bob = def.bob ?? 0;
    // Legs first, so a bobbing dress can overlap the tops of the legs (looks like a little knee bend).
    drawRows(ctx, def.legs, PALETTE, fx, 21);
    drawRows(ctx, def.happy ? happy : HEAD, PALETTE, fx, bob);
    drawRows(ctx, DRESS, PALETTE, fx, 12 + bob);
    for (const arm of def.arms) drawArm(ctx, arm, fx, bob);
  });

  addTexture(scene, PRINCESS_TEXTURE, canvas);
  const tex = scene.textures.get(PRINCESS_TEXTURE);
  FRAME_DEFS.forEach((_, i) => tex.add(i, 0, i * FRAME_W, 0, FRAME_W, FRAME_H));

  const frames = (...nums: number[]) => nums.map((frame) => ({ key: PRINCESS_TEXTURE, frame }));
  const anims = scene.anims;
  const make = (key: string, f: number[], frameRate: number, repeat: number) => {
    if (anims.exists(key)) anims.remove(key);
    anims.create({ key, frames: frames(...f), frameRate, repeat });
  };
  make(PRINCESS_ANIMS.idle, [FRAMES.idle1, FRAMES.idle2], PRINCESS.idleFrameRate, -1);
  make(PRINCESS_ANIMS.run, [FRAMES.run1, FRAMES.run2, FRAMES.run3, FRAMES.run4], PRINCESS.runFrameRate, -1);
  make(PRINCESS_ANIMS.jumpUp, [FRAMES.jumpUp], 1, 0);
  make(PRINCESS_ANIMS.fall, [FRAMES.fall], 1, 0);
  make(PRINCESS_ANIMS.wand, [FRAMES.wave1, FRAMES.wave2], 12, 0);
  make(PRINCESS_ANIMS.cheer, [FRAMES.cheer], 1, 0);
}

export const PRINCESS_ANIMS = {
  idle: 'princess-idle',
  run: 'princess-run',
  jumpUp: 'princess-jump-up',
  fall: 'princess-fall',
  wand: 'princess-wand',
  cheer: 'princess-cheer',
} as const;
