import Phaser from 'phaser';
import { LEVEL_TEX } from '../../art/levelArt';
import { TK } from '../../art/toolkitArt';
import type { ThornsDef } from '../../levels/types';
import { cellBottom, cellX, type LevelContext } from '../LevelContext';
import { Obstacle } from '../Obstacle';

/** A spiky bush that stays put. The wand makes it bloom into a flower bush. */
export class Thorns extends Obstacle {
  constructor(ctx: LevelContext, def: ThornsDef) {
    super(ctx, cellX(def.col), cellBottom(def.row), ctx.skin.thorns ?? LEVEL_TEX.thorns, def.tint);
    this.setOrigin(0.5, 1);
    // Smaller than the picture, so near-misses are misses.
    this.body.setSize(10, 8).setOffset(3, 8);
  }

  protected zone(): Phaser.Geom.Rectangle {
    return this.getBounds();
  }

  protected behave(): void {}

  protected turnFriendly(): void {
    this.setTexture(this.ctx.skin.thornsFriend ?? TK.thornsFriend);
  }
}
