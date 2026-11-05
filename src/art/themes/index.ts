import Phaser from 'phaser';
import { GAME_WIDTH, TILE_SIZE } from '../../constants';
import type { ThemeKey } from '../../levels/types';
import { addTexture, makeCanvas } from '../pixels';
import { frames, px } from './common';
import { beachTheme } from './beach';
import { candyTheme } from './candy';
import { castleTheme } from './castle';
import { cavesTheme } from './caves';
import { nightTheme } from './night';
import { toysTheme } from './toys';
import { cloudsTheme } from './clouds';
import { farmTheme } from './farm';
import { snowTheme } from './snow';
import { jungleTheme } from './jungle';
import { meadowTheme } from './meadow';
import { seaTheme } from './sea';
import { testTheme } from './test';
import type { Skin, Theme, ThemeTextures } from './types';
import { gemTexture } from './common';

export type { Skin, Theme, ThemeTextures } from './types';

/**
 * THE THEME REGISTRY. Each level names a theme (e.g. 'meadow'); this turns that name into
 * background pictures, ground tiles, a jewel, and a "skin" of reskinned toolkit pieces.
 * To add a theme: make a file in this folder (copy meadow.ts), then add it to THEMES below.
 */
const THEMES: Record<ThemeKey, Theme> = {
  test: testTheme,
  meadow: meadowTheme,
  jungle: jungleTheme,
  beach: beachTheme,
  sea: seaTheme,
  candy: candyTheme,
  farm: farmTheme,
  clouds: cloudsTheme,
  snow: snowTheme,
  toys: toysTheme,
  caves: cavesTheme,
  night: nightTheme,
  castle: castleTheme,
};

/** Tile numbers inside the tiles texture (left to right). */
export const TILE_INDEX = { groundTop: 0, groundFill: 1, platform: 2 } as const;

/** Heights of the background strips (all are one screen wide and repeat sideways). */
export const LAYER_HEIGHTS = { far: 180, middle: 90, near: 40 };

export function getTheme(key: ThemeKey): Theme {
  return THEMES[key] ?? testTheme;
}

/** Skins are remembered, so a theme's pictures are only drawn once per game. */
const prepared = new Map<ThemeKey, { textures: ThemeTextures; skin: Skin }>();

/** Draw everything a theme needs (the first time) and return its texture keys and skin. */
export function prepareTheme(scene: Phaser.Scene, key: ThemeKey): { theme: Theme; textures: ThemeTextures; skin: Skin } {
  const theme = getTheme(key);
  const done = prepared.get(key);
  if (done && scene.textures.exists(done.textures.tiles)) return { theme, ...done };

  const textures: ThemeTextures = {
    far: `${key}-far`,
    middle: `${key}-middle`,
    near: `${key}-near`,
    tiles: `${key}-tiles`,
    jewel: `${key}-jewel`,
  };
  const layer = (texKey: string, h: number, paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) => {
    const [c, ctx] = makeCanvas(GAME_WIDTH, h);
    paint(ctx, GAME_WIDTH, h);
    addTexture(scene, texKey, c);
  };
  layer(textures.far, LAYER_HEIGHTS.far, theme.paintFar);
  layer(textures.middle, LAYER_HEIGHTS.middle, theme.paintMiddle);
  layer(textures.near, LAYER_HEIGHTS.near, theme.paintNear);
  {
    const [c, ctx] = makeCanvas(TILE_SIZE * 3, TILE_SIZE);
    theme.paintTiles(ctx);
    addTexture(scene, textures.tiles, c);
  }
  gemTexture(scene, textures.jewel, theme.jewel);
  if (theme.waterInGaps) {
    // Shallow water for gaps: two frames so the little wave lines shimmer.
    textures.water = frames(scene, `${key}-water`, 2, TILE_SIZE, TILE_SIZE, (ctx, f) => {
      px(ctx, '#7fdcf5', 0, 0, TILE_SIZE, TILE_SIZE);
      px(ctx, '#5cc4ea', 0, 8, TILE_SIZE, 8);
      px(ctx, '#ffffff', 0, 0, TILE_SIZE, 1);
      px(ctx, '#c8f4ff', (f * 6) % 16, 3, 5, 1);
      px(ctx, '#c8f4ff', (9 + f * 6) % 16, 10, 4, 1);
    });
  }
  const skin = theme.makeSprites?.(scene) ?? {};
  prepared.set(key, { textures, skin });
  return { theme, textures, skin };
}

/** Just a theme's jewel picture (cheap: doesn't draw the whole theme). Returns the texture key. */
export function jewelTexture(scene: Phaser.Scene, key: ThemeKey): string {
  const tex = `${key}-jewel`;
  if (!scene.textures.exists(tex)) gemTexture(scene, tex, getTheme(key).jewel);
  return tex;
}

/** Just a theme's reskinned creatures (for the ending crowd), without drawing its backgrounds. */
const skinsOnly = new Map<ThemeKey, Skin>();
export function themeSkin(scene: Phaser.Scene, key: ThemeKey): Skin {
  const done = prepared.get(key);
  if (done) return done.skin;
  let skin = skinsOnly.get(key);
  if (!skin) {
    skin = getTheme(key).makeSprites?.(scene) ?? {};
    skinsOnly.set(key, skin);
  }
  return skin;
}

/** Is this an underwater theme? (Used by the level checker.) */
export function isUnderwater(key: ThemeKey): boolean {
  return !!getTheme(key).underwater;
}
