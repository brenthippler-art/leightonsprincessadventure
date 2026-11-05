import Phaser from 'phaser';
import { TOOLKIT } from '../../config';
import { loopAnim } from '../../art/anim';
import { LEVEL_TEX } from '../../art/levelArt';
import { TK } from '../../art/toolkitArt';
import type { WalkerDef } from '../../levels/types';
import { cellBottom, cellX, type LevelContext } from '../LevelContext';
import { Obstacle } from '../Obstacle';

/**
 * Walks slowly back and forth along the ground or platform it stands on.
 * Tell: it stops and wiggles before turning around.
 * Wand: becomes its friendly version: by default a butterfly that flutters away; some themes
 * (like the beach crab) keep their friend strolling around happily instead.
 */
export class Walker extends Obstacle {
  private readonly minX: number;
  private readonly maxX: number;
  private readonly speed: number;
  private dir = 1;
  private pause = 0;

  constructor(ctx: LevelContext, def: WalkerDef) {
    super(ctx, cellX(def.col), cellBottom(def.row), ctx.skin.walker ?? LEVEL_TEX.blob, def.tint);
    this.setOrigin(0.5, 1);
    this.body.setSize(10, 8).setOffset(3, 6);

    // Find the edges of the surface it's standing on, so it never walks off.
    let left = def.col;
    let right = def.col;
    while (ctx.standableAt(left - 1, def.row + 1) && !ctx.standableAt(left - 1, def.row)) left--;
    while (ctx.standableAt(right + 1, def.row + 1) && !ctx.standableAt(right + 1, def.row)) right++;
    if (def.range !== undefined) {
      left = def.col;
      right = Math.min(right, def.col + def.range);
    }
    this.minX = cellX(left);
    this.maxX = cellX(right);
    this.speed = this.speedPx(def.speed ?? TOOLKIT.walkerSpeed);
    this.play(loopAnim(ctx.scene, this.texture.key, 4));
  }

  protected zone(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.minX - 8, this.y - 14, this.maxX - this.minX + 16, 14);
  }

  tick(dt: number): void {
    // Friends who stay keep strolling (harmlessly).
    if (this.friendly && this.ctx.skin.walkerFriendStays) this.behave(dt);
    else super.tick(dt);
  }

  protected behave(dt: number): void {
    this.anims.timeScale = this.speedScale * Obstacle.globalSpeed;
    if (this.pause > 0) {
      this.pause -= dt;
      if (this.pause <= 0) this.dir = -this.dir;
      return;
    }
    this.x += this.dir * this.speed * dt;
    this.setFlipX(this.dir < 0);
    const atEnd = (this.dir > 0 && this.x >= this.maxX) || (this.dir < 0 && this.x <= this.minX);
    if (atEnd) {
      this.x = Phaser.Math.Clamp(this.x, this.minX, this.maxX);
      this.pause = TOOLKIT.tellTime;
      if (!this.friendly) this.wiggle(TOOLKIT.tellTime);
    }
  }

  protected turnFriendly(): void {
    const friend = this.ctx.skin.walkerFriend ?? TK.butterfly;
    if (this.ctx.skin.walkerFriendStays) {
      this.setTexture(friend, 0).play(loopAnim(this.scene, friend, 4));
      return;
    }
    this.setTexture(friend, 0).setOrigin(0.5).play(loopAnim(this.scene, friend, 8));
    this.y -= 6;
    this.floatAway(60 * this.dir, -110, 2600);
  }
}
