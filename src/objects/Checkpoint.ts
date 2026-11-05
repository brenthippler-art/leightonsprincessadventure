import Phaser from 'phaser';
import { LEVEL_TOP, TILE_SIZE } from '../constants';
import { LEVEL_ANIMS, LEVEL_TEX } from '../art/levelArt';
import { sfx } from '../audio/sfx';
import { sparkleBurst } from './fx';

/**
 * A little flag. It starts lowered; when she walks past it pops up and waves,
 * and it becomes a guaranteed safe spot to come back to.
 */
export class Checkpoint extends Phaser.GameObjects.Sprite {
  reached = false;
  /** Where she reappears if this is her safe spot: standing right next to the flag. */
  readonly spot: { x: number; bottom: number };
  readonly zone: Phaser.GameObjects.Zone;

  constructor(scene: Phaser.Scene, col: number, row: number) {
    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const bottom = LEVEL_TOP + (row + 1) * TILE_SIZE;
    super(scene, x, bottom, LEVEL_TEX.flag, 0);
    this.setOrigin(0.5, 1).setDepth(5);
    scene.add.existing(this);
    this.spot = { x, bottom };

    // A tall invisible trigger, so jumping over the flag still counts.
    this.zone = scene.add.zone(x, bottom - 48, 16, 96);
    scene.physics.add.existing(this.zone, true);
  }

  /** Raise the flag (only the first time). Returns true if it was just reached. */
  reach(): boolean {
    if (this.reached) return false;
    this.reached = true;
    this.play(LEVEL_ANIMS.flagWave);
    sfx.chime();
    sparkleBurst(this.scene, this.x + 4, this.y - 18);
    return true;
  }
}
