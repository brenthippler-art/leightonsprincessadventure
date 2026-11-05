import Phaser from 'phaser';
import { SCENES } from '../constants';
import { generateUiArt } from '../art/uiArt';
import { generatePrincessArt } from '../art/princess';
import { generateEffectsArt } from '../art/effects';
import { generateLevelArt } from '../art/levelArt';
import { generateToolkitArt } from '../art/toolkitArt';
import { generateMapArt } from '../art/mapArt';
import { defaultLevelId } from './LevelScene';
import { ALL_LEVELS } from '../levels';
import { validateLevel } from '../levels/validate';

/**
 * BootScene
 *  1. Draws all the code-generated art into textures (themes are drawn when a level needs them).
 *  2. In development, checks every level file and prints any problems to the console.
 *  3. Starts the always-on-top controls overlay (touch buttons + fullscreen button).
 *  4. Goes to the title screen (or, when testing, straight to ?level=N).
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    generateUiArt(this);
    generatePrincessArt(this);
    generateEffectsArt(this);
    generateLevelArt(this);
    generateToolkitArt(this);
    generateMapArt(this);

    if (import.meta.env.DEV) {
      const problems = ALL_LEVELS.flatMap(validateLevel);
      if (problems.length) problems.forEach((p) => console.warn(p));
      else console.info(`Level check: all ${ALL_LEVELS.length} level(s) look good.`);
    }

    this.scene.launch(SCENES.controlsOverlay);
    // Testing shortcut: ?level=N in the address jumps straight into that level.
    if (window.location.search.includes('level=')) this.scene.start(SCENES.level, { levelId: defaultLevelId() });
    else this.scene.start(SCENES.title);
  }
}
