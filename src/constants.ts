// Shared numbers and colors used all over the game.

/** The game is always drawn at this tiny "16-bit console" size, then scaled up to fit the screen. */
export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 180;

/** Color palette (as 0xRRGGBB numbers for Phaser, and "#rrggbb" strings for canvas drawing). */
export const COLORS = {
  letterbox: 0x2a1438, // dark purple bars around the game
  pink: 0xffb6d9, // test-screen background
  hotPink: 0xff6fb5,
};

export const CSS = {
  letterbox: '#2a1438',
  outline: '#3a1840',
  white: '#ffffff',
  cream: '#fff4fa',
  pink: '#ff6fb5',
  pinkDark: '#c23c86',
  pinkLight: '#ffd0e8',
  gold: '#ffe066',
  goldDark: '#d99a1e',
  sky: '#7fd6ff',
  skyDark: '#2f8fc9',
  lilac: '#c9a3ff',
  lilacDark: '#7a4fc9',
  grass: '#6fdc8c',
  grassDark: '#2f9e57',
  dirt: '#c98a5a',
  dirtDark: '#8a5534',
};

/** Scene keys, so we never mistype a scene name. */
export const SCENES = {
  boot: 'BootScene',
  title: 'TitleScene',
  map: 'MapScene',
  level: 'LevelScene',
  ending: 'EndingScene',
  controlsOverlay: 'ControlsOverlayScene',
  pause: 'PauseScene',
  story: 'StoryScene',
  crown: 'CrownScene',
} as const;

/** Size of one tile in pixels. */
export const TILE_SIZE = 16;
/** Every level is exactly this many tiles tall (11 x 16 = 176 pixels, one screen). */
export const LEVEL_ROWS = 11;
/** The level grid sits at the bottom of the screen; this little strip at the top is just sky. */
export const LEVEL_TOP = GAME_HEIGHT - LEVEL_ROWS * TILE_SIZE;

/** The jewels' names (for the optional spoken line "You found the Ruby!"). Index 0 = level 1. */
export const JEWEL_NAMES = [
  'Ruby',
  'Emerald',
  'Aquamarine',
  'Pearl',
  'Rose Quartz',
  'Topaz',
  'Opal',
  'Diamond',
  'Sapphire',
  'Amethyst',
  'Moonstone',
  'Heart Jewel',
];

/**
 * The 12 crown jewels, one per level (index 0 = level 1). Each has its own color.
 * Level 0 (the test level) borrows the first color.
 */
export const JEWEL_COLORS = [
  0xff3d5a, // 1 Ruby (red)
  0x2fc46a, // 2 Emerald (green)
  0x6fd8f0, // 3 Aquamarine (light blue)
  0xf4eefa, // 4 Pearl (white)
  0xff9fc8, // 5 Rose Quartz (pink)
  0xffa53d, // 6 Topaz (orange)
  0xd8c8ff, // 7 Opal (rainbow shimmer)
  0xe8fbff, // 8 Diamond (clear sparkle)
  0x2f5fe0, // 9 Sapphire (deep blue)
  0xa05ae0, // 10 Amethyst (purple)
  0xb8d0f0, // 11 Moonstone (silvery blue)
  0xffc04a, // 12 Heart Jewel (gold and pink)
];
