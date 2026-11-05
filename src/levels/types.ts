/**
 * THE LEVEL DATA FORMAT
 *
 * A level is a plain TypeScript object (one file per level in this folder).
 * The map is drawn as text: each character is one 16x16 tile, each string is one row.
 * There are always exactly 11 rows (one screen tall). Levels are usually 160-240 columns
 * (8-12 screens) wide.
 *
 *   '.'  empty sky
 *   '#'  solid ground (grass is added automatically on top)
 *   '='  floating platform (she can jump up through it from below and land on top)
 *   'S'  where Leighton starts (put it in an empty cell, right above ground)
 *   'C'  checkpoint flag (in an empty cell, right above ground)
 *   'J'  the crown jewel on its pedestal (in an empty cell, right above ground, near the right end)
 *
 * Everything else is placed BY TYPE in three lists, using the same column/row numbers
 * (column 0 = left edge, row 0 = top row, row 10 = bottom row; with ground in rows 9-10,
 * "standing on the ground" means row 8):
 *
 *   obstacles: touching one = gentle bonk.        Types: walker, hopper, roller, flyer, dropper, thorns
 *   barriers:  things to get over or ride. No bonk. Types: wall, moving-platform, bounce-pad, cloud,
 *                                                         vine, giraffe, bubbles
 *   puzzles:   a gate blocks the way until solved.  Types: color-match, shape-match, count,
 *                                                         push-block, pattern, find-key
 *
 *   decor:     pictures that help or delight but never get in the way (signs, background giraffes...)
 *
 * Any obstacle can be marked `practice: true`: touching it only gives a soft boing and a little
 * nudge back (no reset). Use it for the FIRST time each obstacle type appears, so she can learn it.
 *
 * Speeds are in tiles per second, times in seconds, distances in tiles. Every setting marked
 * "optional" has a gentle default in src/config.ts.
 */

/** Which look (colors, background) a level uses. Each theme is defined in src/art/themes.ts. */
export type ThemeKey = 'test' | 'meadow' | 'jungle' | 'beach' | 'sea' | 'candy' | 'farm' | 'clouds' | 'snow' | 'toys' | 'caves' | 'night' | 'castle';

interface At {
  col: number;
  row: number;
}

// ------------------------------------------------------------------------------------------
// OBSTACLES (all can be turned friendly with the wand). `tint` optionally recolors the placeholder.
// ------------------------------------------------------------------------------------------

interface ObstacleAt extends At {
  /** First appearance of this obstacle: touching it just nudges her back, no reset. */
  practice?: boolean;
  tint?: number;
}

/** Walks slowly back and forth on the ground or platform it stands on. */
export interface WalkerDef extends ObstacleAt {
  type: 'walker';
  /** Optional: only walk this many tiles to the right of `col` (default: the whole platform). */
  range?: number;
  speed?: number;
}
/** Hops in place on a steady beat. */
export interface HopperDef extends ObstacleAt {
  type: 'hopper';
  /** Seconds between hops. */
  every?: number;
  /** Hop height in tiles. */
  height?: number;
}
/** Rolls left from (col,row) when she's near, disappears, then comes again. */
export interface RollerDef extends ObstacleAt {
  type: 'roller';
  /** Tiles it rolls before fading away. */
  distance?: number;
  /** Seconds between rolls. */
  every?: number;
  speed?: number;
}
/** Floats up and down in a slow wave, centered on (col,row). */
export interface FlyerDef extends ObstacleAt {
  type: 'flyer';
  /** How far up and down it floats, in tiles. */
  amplitude?: number;
  /** Seconds for one full up-and-down. */
  period?: number;
}
/** Something hangs at (col,row) and drops straight down on a timer; a shadow warns 1 s before it lands. */
export interface DropperDef extends ObstacleAt {
  type: 'dropper';
  every?: number;
  speed?: number;
}
/** A spiky bush that stays put. */
export interface ThornsDef extends ObstacleAt {
  type: 'thorns';
}

export type ObstacleDef = WalkerDef | HopperDef | RollerDef | FlyerDef | DropperDef | ThornsDef;

// ------------------------------------------------------------------------------------------
// BARRIERS (no bonk)
// ------------------------------------------------------------------------------------------

/** A block wall standing on the ground. (row = the cell right above the ground.) */
export interface WallDef extends At {
  type: 'wall';
  /** 1 = low wall, 2 = tall wall. */
  height: 1 | 2;
}
/** A platform that glides back and forth. Its top is at the top of `row`. */
export interface MovingPlatformDef extends At {
  type: 'moving-platform';
  /** 'x' = moves right `distance` tiles and back; 'y' = moves UP `distance` tiles and back. */
  axis: 'x' | 'y';
  distance: number;
  /** Width in tiles (default 2). */
  width?: number;
  speed?: number;
}
/** A springy pad on the ground: landing on it bounces her up high. (row = cell above the ground.) */
export interface BouncePadDef extends At {
  type: 'bounce-pad';
  /** How high she bounces, in tiles (default in config). */
  power?: number;
}
/** A soft cloud she can stand on. It wobbles but never drops her. Its top is at the top of `row`. */
export interface CloudDef extends At {
  type: 'cloud';
  /** Width in tiles (default 3). */
  width?: number;
}

/**
 * A platform hanging from a jungle vine that swings slowly like a pendulum. `col` = its left edge at the
 * middle of the swing; at both ENDS of the swing its top is level with the top of `row` (step on/off there).
 */
export interface VineDef extends At {
  type: 'vine';
  /** Vine length in tiles (default 4). */
  length?: number;
  /** How far it swings each way, in degrees (default 30). */
  swing?: number;
  /** Width of the platform in tiles (default 2). */
  width?: number;
}
/**
 * A friendly giraffe who lowers her long neck as a ramp when Leighton comes near.
 * (col,row): where the ramp starts on the ground (row = the cell above the ground).
 * The neck rises `height` tiles over `length` tiles, then her flat back is 2 tiles long.
 * Put the high ledge (or treetop) right after the back: at column col + length + 2, `height` tiles up.
 */
export interface GiraffeDef extends At {
  type: 'giraffe';
  length: number;
  height: number;
}
/** A column of rising bubbles that gently carries her upward. (col,row) = its bottom cell. */
export interface BubblesDef extends At {
  type: 'bubbles';
  /** How many tiles tall the bubble column is. */
  height: number;
}

export type BarrierDef = WallDef | MovingPlatformDef | BouncePadDef | CloudDef | VineDef | GiraffeDef | BubblesDef;

// ------------------------------------------------------------------------------------------
// DECOR (never in the way, never solid)
// ------------------------------------------------------------------------------------------

export interface DecorDef extends At {
  /**
   * sign-move:     a big bouncing right-arrow picture ("walk this way")
   * sign-jump:     a big jump-button picture ("jump here")
   * sign-swim:     a jump-button picture with stacked arrows ("tap jump again and again to swim up")
   * giraffe-munch: a giraffe munching leaves in the background
   * baby-giraffe:  a baby giraffe who follows her a few steps and cheers when she finds the jewel
   * cow:           a friendly cow who moos when she walks by
   * crystal:       a glowing crystal cluster that lights the path (caves)
   * dragon:        THE FINALE: a sleepy, grumpy little dragon sitting on the jewel. Put him on the 'J'
   *                cell. He never moves toward her and can't bonk her. Three waves of the wand make him
   *                smile, then hug her and hand over the jewel.
   */
  type: 'sign-move' | 'sign-jump' | 'sign-swim' | 'giraffe-munch' | 'baby-giraffe' | 'cow' | 'crystal' | 'dragon';
  /** Face left instead of right (giraffes only). */
  flip?: boolean;
}

// ------------------------------------------------------------------------------------------
// PUZZLES (each one has a gate, except push-block which raises a bridge)
// ------------------------------------------------------------------------------------------

export type GemColor = 'red' | 'blue' | 'yellow' | 'green';
export type ShapeKind =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'scallop'
  | 'starfish'
  | 'conch'
  | 'snowflake'
  | 'mitten'
  | 'snowman'
  | 'moon'
  | 'star'
  | 'sun';

/** Colored buttons on the ground (from `col`, every 2 tiles). Step on the one that matches the gate. */
export interface ColorMatchDef extends At {
  type: 'color-match';
  gateCol: number;
  answer: GemColor;
  /** Which buttons to show, left to right (default all four). */
  choices?: GemColor[];
}
/** Three shape blocks (from `col`, every 3 tiles). Push the matching one into the slot at the gate. */
export interface ShapeMatchDef extends At {
  type: 'shape-match';
  gateCol: number;
  answer: ShapeKind;
  /** Which blocks, left to right (default circle, square, triangle). */
  shapes?: ShapeKind[];
}
/** `count` stepping stones (from `col`, every 2 tiles, top at `row`). Light them all. */
export interface CountDef extends At {
  type: 'count';
  gateCol: number;
  /** 1 to 5. */
  count: number;
}
/** A box at (col,row). Push it onto the switch to raise a bridge over the gap. */
export interface PushBlockDef extends At {
  type: 'push-block';
  switchCol: number;
  /** First column of the gap the bridge fills, and how many tiles wide it is. */
  bridgeCol: number;
  bridgeWidth: number;
  /** 'rise' (default): planks rise up out of the gap. 'drawbridge': one long bridge swings down from the far side. */
  bridgeStyle?: 'rise' | 'drawbridge';
}
/** Bells hanging in `row` (from `col`, every 3 tiles). Ring them in `order` (0 = left, 1 = middle, 2 = right). */
export interface PatternDef extends At {
  type: 'pattern';
  gateCol: number;
  /** How many bells: 2 or 3 (default 3). */
  bells?: 2 | 3;
  /** Up to 3 notes, e.g. [0, 2, 1]. */
  order: (0 | 1 | 2)[];
}
/** A key at (col,row), with a sparkle trail leading to it. Bring it to the lock on the gate. */
export interface FindKeyDef extends At {
  type: 'find-key';
  gateCol: number;
}

export type PuzzleDef = ColorMatchDef | ShapeMatchDef | CountDef | PushBlockDef | PatternDef | FindKeyDef;

export interface LevelData {
  /** 1 to 12 for the real levels; test levels use 0 and 90+. Level N's jewel fills crown slot N. */
  id: number;
  /** Name for us grown-ups (never shown to the player). */
  name: string;
  theme: ThemeKey;
  /** The tile map, one string per row, top row first. See the legend at the top of this file. */
  grid: string[];
  obstacles: ObstacleDef[];
  barriers: BarrierDef[];
  puzzles: PuzzleDef[];
  /** Optional pictures and friendly background characters. */
  decor?: DecorDef[];
}

/** Map characters, so code never has to spell out raw letters. */
export const T = {
  empty: '.',
  ground: '#',
  platform: '=',
  start: 'S',
  checkpoint: 'C',
  jewel: 'J',
} as const;

export const KNOWN_CHARS = new Set<string>(Object.values(T));

/** Can she stand on this character? */
export const isStandable = (ch: string | undefined): boolean => ch === T.ground || ch === T.platform;
