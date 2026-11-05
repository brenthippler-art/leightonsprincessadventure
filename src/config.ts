/**
 * TUNING KNOBS
 *
 * Every number that changes how the game FEELS lives here, so you can tweak it without
 * hunting through code. Change a number, save, and the browser reloads instantly (npm run dev).
 *
 * Units:
 *   - distances are in game pixels (the screen is 320 x 180; one ground tile is 16 pixels)
 *   - speeds are pixels per second
 *   - gravity/acceleration are pixels per second, per second (how fast speed changes)
 *   - times are seconds
 */

import { TILE_SIZE } from './constants';

/** Size of one ground tile in pixels. Handy for describing distances ("5 tiles"). */
export const TILE = TILE_SIZE;

export const PRINCESS = {
  // ---------- Running ----------

  /** Top running speed. 100 = crosses the whole screen in about 3 seconds. */
  runSpeed: 100,
  /** How fast she speeds up to top speed. 1200 means full speed in under 0.1 s (snappy, not slippery). */
  acceleration: 1200,
  /** How fast she slows down when you let go or turn around. Bigger = stops quicker. */
  deceleration: 1800,
  /** Steering in the air, as a fraction of ground steering (1 = same as on the ground). */
  airControl: 0.9,

  // ---------- Jumping ----------

  /**
   * Upward speed at the start of a jump.
   * Jump height = jumpSpeed^2 / (2 x gravity), so with the numbers below:
   *   holding jump:   270^2 / (2 x 550) = about 66 px  (just over 4 tiles)
   *   quick tap:      270^2 / (2 x 850) = about 43 px  (2.7 tiles)
   * Either way she clears a 2-tile (32 px) wall.
   */
  jumpSpeed: 270,
  /** Gravity while going UP and holding jump. Low = tall, floaty jump. */
  gravityRisingHeld: 550,
  /** Gravity while going UP after letting go of jump. Makes short hops possible. */
  gravityRising: 850,
  /** Gravity while falling. A bit stronger so landings feel solid, but still gentle. */
  gravityFalling: 800,
  /** Fastest she can fall, so long drops stay easy to follow with your eyes. */
  maxFallSpeed: 260,

  // ---------- Forgiveness ----------

  /**
   * COYOTE TIME: after walking off a ledge, she can still jump for this long.
   * (Named after cartoon coyotes who run off cliffs and hang in the air for a moment.)
   */
  coyoteTime: 0.2,
  /**
   * JUMP BUFFER: if jump is pressed this long BEFORE she lands, she jumps the moment she lands.
   */
  jumpBuffer: 0.2,
  /** Allow one extra jump in mid-air. Turn on if she needs it. */
  doubleJump: false,

  // ---------- Wand ----------

  /** How long the wand-wave pose shows, in seconds. She can wave again any time (no cooldown). */
  wandWaveTime: 0.25,
  /** How long the happy cheer pose lasts when she finds a jewel. */
  cheerTime: 1.2,

  // ---------- Animation ----------

  /** Running animation speed (frames per second) at top speed. Slower when she's going slower. */
  runFrameRate: 10,
  /** Idle "breathing" bob speed (frames per second). */
  idleFrameRate: 2.5,
};

export const SPARKLE_SHOT = {
  /** How fast the wand's sparkle flies. */
  speed: 220,
  /** How far it flies before twinkling away: 5 tiles. */
  range: 5 * TILE,
  /** A little trail twinkle is left behind every this-many seconds. */
  trailEvery: 0.06,
};

/** The gentle reset: what happens when she bonks into something or falls. (Rule 1: no losing!) */
export const GENTLE_RESET = {
  /** How long she pauses in a sparkle poof before reappearing. */
  freezeTime: 0.5,
  /** After reappearing she blinks for this long, and nothing can bonk her. */
  safeBlinkTime: 2,

  // ----- What counts as a "safe spot" to come back to -----
  /** Solid ground must continue at least this far past each side of her feet (no ledge edges). */
  ledgeMargin: 12,
  /** And she must be at least this far from any obstacle (or from where a moving one can go). */
  obstacleMargin: 2 * TILE,

  // ----- Extra help when a spot is tricky -----
  /** After this many bonks that send her back to the same spot, the game quietly helps. */
  bonksBeforeHelp: 3,
  /** Two respawns closer together than this count as "the same spot". */
  sameSpotDistance: 2 * TILE,
  /** Obstacles near a tricky spot move at this fraction of their speed (0.5 = half speed). */
  helpSlowFactor: 0.5,
  /** Obstacles within this distance ahead of the tricky spot get slowed. */
  helpRange: 12 * TILE,
  /** The help switches off once her safe spot is at least this far past the tricky spot. */
  helpClearDistance: 5 * TILE,
};

export const CAMERA = {
  /** How far ahead (in the direction she faces) the camera looks, so she sees what's coming. */
  lookAhead: 40,
  /** How quickly the camera catches up with her (0 to 1; small = smooth and lazy). */
  followLerp: 0.1,
  /** How quickly the look-ahead swings over when she turns around (0 to 1). */
  lookAheadLerp: 0.04,
};

/** How fast each background layer scrolls compared to the ground (0 = never moves, 1 = moves with ground). */
export const PARALLAX = {
  far: 0.1,
  middle: 0.35,
  near: 0.65,
};

export const OBSTACLES = {
  /** Default speed of moving obstacles, in tiles per second. Levels can override this. */
  patrolSpeed: 1.5,
};

/** The fastest any obstacle may ever move: half of her run speed (pixels per second). */
export const MAX_OBSTACLE_SPEED = PRINCESS.runSpeed / 2;

/**
 * Default settings for every placeable piece. A level can override most of these per piece.
 * Speeds are in TILES per second here (1 tile = 16 px), and are always capped at MAX_OBSTACLE_SPEED.
 */
export const TOOLKIT = {
  /** Every obstacle shows its "tell" (wiggle/glow) for this long before it does something. */
  tellTime: 0.6,

  walkerSpeed: 1.2,
  hopperEvery: 2,
  /** Hop height in tiles. */
  hopperHeight: 1,
  rollerSpeed: 2.5,
  rollerEvery: 4,
  rollerDistance: 10,
  /** The roller only starts rolling when she's within this many tiles of it. */
  rollerWakeDistance: 14,
  /** Flyer: tiles up/down, and seconds per full wave. */
  flyerAmplitude: 1.5,
  flyerPeriod: 3.5,
  dropperEvery: 3,
  dropperSpeed: 3,
  /** The shadow appears this many seconds before the dropped thing lands. */
  dropperShadowLead: 1,

  movingPlatformSpeed: 1.5,
  /** Default bounce pad height, in tiles. */
  bouncePadPower: 7,
  /** How fast she can push blocks and boxes (pixels per second). */
  pushSpeed: 40,
};

/** Puzzle hints. Nothing here is ever required to finish a puzzle. */
export const HINTS = {
  /** Seconds near a puzzle without progress before the right thing glows and bounces. */
  glowAfter: 10,
  /** Seconds before a big arrow points at it too. */
  arrowAfter: 20,
  /** Say hints out loud ("Find the red heart!") with the browser's built-in voice. */
  spokenHints: true,
  /** Count stepping stones out loud ("One! Two! Three!"). Uses the same voice. */
  countAloud: true,
  /** Speaking speed (1 = normal, lower = slower) and pitch (higher = brighter/friendlier). */
  voiceRate: 0.85,
  voicePitch: 1.2,
};

/** Underwater levels: slower, floatier movement. Tap jump again and again to swim upward. */
export const WATER = {
  runSpeed: 80,
  /** Jump from the sea floor. */
  jumpSpeed: 190,
  /** Each tap of jump while floating gives a little swim stroke upward. */
  swimSpeed: 140,
  gravity: 260,
  /** Sinks slowly, so there's always time to tap jump again. */
  maxFallSpeed: 70,
};

export const VINE = {
  length: 4,
  swing: 30,
  /** Seconds for one full swing there and back (it's slowed automatically if it would be too fast). */
  period: 4,
};

export const BUBBLES = {
  /** How fast a bubble column carries her up (pixels per second). */
  liftSpeed: 75,
};

/** "Practice" obstacles (the first of each kind) just nudge her back gently. */
export const PRACTICE = {
  nudgeSpeedX: 110,
  nudgeSpeedY: 150,
  /** Short blink afterwards so she can't be nudged twice in a row. */
  blinkTime: 0.8,
};
