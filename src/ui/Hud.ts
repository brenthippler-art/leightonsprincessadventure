import Phaser from 'phaser';
import { GAME_WIDTH, JEWEL_COLORS } from '../constants';
import { CROWN_SOCKETS, LEVEL_TEX } from '../art/levelArt';
import { LIT, TEX } from '../art/uiArt';
import { sfx } from '../audio/sfx';

/**
 * The only on-screen info during a level (rule 2: no words, rule 1: nothing that counts down):
 *   - a small crown, top-left, with one socket per jewel; found jewels fill their socket
 *   - a pause button (two bars), top-right next to the fullscreen button
 */

const CROWN_X = 4;
const CROWN_Y = 4;
const DEPTH = 100;

export class Hud {
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, jewelsFound: boolean[], onPause: () => void) {
    this.scene = scene;
    scene.add.image(CROWN_X, CROWN_Y, LEVEL_TEX.crown).setOrigin(0).setScrollFactor(0).setDepth(DEPTH);
    jewelsFound.forEach((found, i) => {
      if (found) this.fillSlot(i, JEWEL_COLORS[i], false);
    });

    // Pause button: just left of the fullscreen button (or in the corner if fullscreen isn't available).
    const x = scene.sys.game.device.fullscreen.available ? GAME_WIDTH - 34 : GAME_WIDTH - 12;
    const button = scene.add.image(x, 12, TEX.pause).setScrollFactor(0).setDepth(DEPTH).setAlpha(0.7);
    // Bigger invisible hit area than the 16x16 picture, but not overlapping the fullscreen button.
    button.setInteractive(new Phaser.Geom.Rectangle(-3, -4, 21, 24), Phaser.Geom.Rectangle.Contains);
    const unlight = () => button.setTexture(TEX.pause).setAlpha(0.7);
    button.on(Phaser.Input.Events.POINTER_DOWN, () => button.setTexture(TEX.pause + LIT).setAlpha(1));
    button.on(Phaser.Input.Events.POINTER_OUT, unlight);
    button.on(Phaser.Input.Events.POINTER_UP, () => {
      unlight();
      sfx.tap();
      onPause();
    });
  }

  /** Center of a crown socket, in SCREEN pixels. */
  slotPosition(index: number): { x: number; y: number } {
    const [sx, sy] = CROWN_SOCKETS[index];
    return { x: CROWN_X + sx + 2, y: CROWN_Y + sy + 2 };
  }

  /** Put a jewel in its socket. With `pop`, it bounces in. */
  fillSlot(index: number, color: number, pop: boolean): void {
    const [sx, sy] = CROWN_SOCKETS[index];
    const mini = this.scene.add
      .image(CROWN_X + sx + 2, CROWN_Y + sy + 2, LEVEL_TEX.jewelMini)
      .setTint(color)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);
    if (pop) {
      mini.setScale(3);
      this.scene.tweens.add({ targets: mini, scale: 1, duration: 400, ease: 'Bounce.Out' });
    }
  }
}
