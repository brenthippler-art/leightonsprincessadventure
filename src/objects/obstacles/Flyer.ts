import Phaser from 'phaser';
import { MAX_OBSTACLE_SPEED, TILE, TOOLKIT } from '../../config';
import { LEVEL_TEX } from '../../art/levelArt';
import { loopAnim } from '../../art/anim';
import { TK } from '../../art/toolkitArt';
import type { FlyerDef } from '../../levels/types';
import { cellTop, cellX, type LevelContext } from '../LevelContext';
import { Obstacle } from '../Obstacle';

/**
 * Floats up and down in a slow, smooth wave, centered on its cell.
 * Tell: a soft glow behind it brightens near the top, just before it floats back down.
 * Wand: becomes a smiling friend that floats up and away.
 */
export class Flyer extends Obstacle {
  private readonly centerY: number;
  private readonly amplitude: number;
  private readonly period: number;
  private readonly glow: Phaser.GameObjects.Image;
  private t = 0;

  constructor(ctx: LevelContext, def: FlyerDef) {
    super(ctx, cellX(def.col), cellTop(def.row) + 8, ctx.skin.flyer ?? TK.flyer, def.tint);
    this.body.setSize(10, 8).setOffset(3, 3);
    this.centerY = this.y;
    this.amplitude = (def.amplitude ?? TOOLKIT.flyerAmplitude) * TILE;
    // Slow the wave down if needed, so its fastest moment is under the speed limit.
    const minPeriod = (this.amplitude * 2 * Math.PI) / MAX_OBSTACLE_SPEED;
    this.period = Math.max(def.period ?? TOOLKIT.flyerPeriod, minPeriod);
    this.glow = ctx.scene.add.image(this.x, this.y, LEVEL_TEX.glow).setTint(0xb9a6d6).setDepth(9).setAlpha(0.2);
    this.play(loopAnim(ctx.scene, this.texture.key, 4));
  }

  protected zone(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.x - 8, this.centerY - this.amplitude - 8, 16, this.amplitude * 2 + 16);
  }

  protected behave(dt: number): void {
    this.anims.timeScale = this.speedScale;
    this.t += dt;
    const phase = (this.t / this.period) * Math.PI * 2;
    this.y = this.centerY - this.amplitude * Math.sin(phase);
    this.glow.setPosition(this.x, this.y);
    // Glow brightest near the top of the wave: "I'm about to float back down".
    this.glow.setAlpha(0.15 + 0.45 * Math.max(0, Math.sin(phase)) ** 3);
  }

  protected turnFriendly(): void {
    this.glow.destroy();
    const friend = this.ctx.skin.flyerFriend ?? TK.flyerFriend;
    this.setTexture(friend, 0).play(loopAnim(this.scene, friend, 6));
    this.floatAway(40, -140, 3000);
  }
}
