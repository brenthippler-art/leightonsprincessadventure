import type Phaser from 'phaser';
import type { ThemeKey } from '../../levels/types';
import type { GemStyle } from './common';

/**
 * A SKIN tells each toolkit piece which picture to use in this theme.
 * Anything left out falls back to the neutral placeholder from src/art/toolkitArt.ts.
 * Creature textures are 2-frame strips (the game loops them as an animation).
 */
export interface Skin {
  walker?: string;
  walkerFriend?: string;
  /** true = the friendly walker stays and keeps strolling happily; false/unset = it flies away. */
  walkerFriendStays?: boolean;
  hopper?: string;
  hopperFriend?: string;
  /** true = a befriended hopper stops hopping and bleats happily (farm goats). */
  hopperFriendStops?: boolean;
  roller?: string;
  rollerFriend?: string;
  flyer?: string;
  flyerFriend?: string;
  drop?: string;
  dropFriend?: string;
  hanger?: string;
  thorns?: string;
  thornsFriend?: string;
  wall?: string;
  /** Bounce pad: 2 frames (resting, squashed). */
  pad?: string;
  /** Count-puzzle stepping stone: 2 frames (unlit, lit). */
  stone?: string;
  /** Shape-match block. */
  block?: string;
  crate?: string;
  /** The plank hanging from a swinging vine (2 tiles wide). */
  vinePlank?: string;
  /** One tile of the push-block bridge / drawbridge (16x8). */
  plank?: string;
  /** A 2-tile-wide moving platform (e.g. a toy train car, a star platform). Its top row is the surface. */
  movingPlatform?: string;
  /** Pattern-puzzle bell (drawn in light colors; it gets tinted per bell). */
  bell?: string;
}

/** The texture keys a theme makes for the level background and ground. */
export interface ThemeTextures {
  far: string;
  middle: string;
  near: string;
  tiles: string;
  jewel: string;
  water?: string;
}

/**
 * A THEME: everything that gives a level its look.
 * Each one lives in its own file in this folder and is registered in index.ts.
 */
export interface Theme {
  key: ThemeKey;
  /** Paint the three parallax layers. Canvas sizes: far 320x180, middle 320x90, near 320x40. */
  paintFar(ctx: CanvasRenderingContext2D, w: number, h: number): void;
  paintMiddle(ctx: CanvasRenderingContext2D, w: number, h: number): void;
  paintNear(ctx: CanvasRenderingContext2D, w: number, h: number): void;
  /** Paint the 48x16 tile strip: [ground top] [ground fill] [floating platform]. */
  paintTiles(ctx: CanvasRenderingContext2D): void;
  /** Draw this theme's reskinned pieces and say which piece uses which picture. */
  makeSprites?(scene: Phaser.Scene): Skin;
  jewel: GemStyle;
  /** Colors the jewel's glow cycles through (rainbow shimmer for opal, sparkle for diamond). */
  jewelGlow?: number[];
  /** Draw shallow water in the gaps (falling in still just means a gentle reset). */
  waterInGaps?: boolean;
  /** Underwater physics: floaty, and tap jump to swim up. */
  underwater?: boolean;
}
