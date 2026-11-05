import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from './constants';
import { controls } from './input/Controls';
import { preventBrowserGestures } from './input/preventBrowserGestures';
import { ControlsOverlayScene } from './input/ControlsOverlayScene';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { MapScene } from './scenes/MapScene';
import { LevelScene } from './scenes/LevelScene';
import { EndingScene } from './scenes/EndingScene';
import { PauseScene } from './scenes/PauseScene';
import { StoryScene } from './scenes/StoryScene';
import { CrownScene } from './scenes/CrownScene';
import { unlock as unlockAudio } from './audio/Synth';

// Stop the browser from scrolling, zooming, or popping up menus when little fingers tap around.
preventBrowserGestures();

// Browsers only allow sound after the player taps or presses a key, so switch sound on at the first one.
for (const type of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(type, unlockAudio, { capture: true });

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // WebGL if available, otherwise Canvas
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.letterbox,
  banner: false, // don't print Phaser's console banner (it contains a web link)

  // Crisp pixels: no blurry smoothing when scaled, and sprites snap to whole pixels.
  pixelArt: true,
  roundPixels: true,

  scale: {
    mode: Phaser.Scale.FIT, // grow as big as possible while keeping the 16:9 shape
    autoCenter: Phaser.Scale.CENTER_BOTH, // leftover space becomes the purple letterbox
    fullscreenTarget: 'game',
  },

  input: {
    // 1 mouse + up to 5 fingers at once (hold Right and tap Jump at the same time).
    activePointers: 5,
    // We read the keyboard and gamepads ourselves in src/input/Controls.ts.
    keyboard: false,
    gamepad: false,
  },

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 600 },
      debug: false,
    },
  },

  // Order matters: scenes later in this list are drawn on top.
  // The controls overlay comes after the game scenes so the touch buttons are on top of them;
  // the pause screen is last so it covers everything.
  scene: [BootScene, TitleScene, StoryScene, MapScene, LevelScene, CrownScene, EndingScene, ControlsOverlayScene, PauseScene],
};

const game = new Phaser.Game(config);

// Hook the shared controls into the game loop so every scene sees the same input each frame.
controls.attach(game);

// Developer helper: in `npm run dev` only, type `__game` in the browser console to poke at the game.
// (This line is removed automatically from the real build.)
if (import.meta.env.DEV) (window as unknown as { __game: Phaser.Game }).__game = game;

// Offline play: in the real (built) game, register the service worker that saves every game file
// on this device. It only talks to the same place the game was loaded from; nothing else.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // If it can't register (e.g. private browsing), the game still works online.
    });
  });
}
