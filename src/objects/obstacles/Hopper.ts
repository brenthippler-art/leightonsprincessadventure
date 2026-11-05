import Phaser from 'phaser';
import { MAX_OBSTACLE_SPEED, TILE, TOOLKIT } from '../../config';
import { TK } from '../../art/toolkitArt';
import { sfx } from '../../audio/sfx';
import { sparkleBurst } from '../fx';
import type { HopperDef } from '../../levels/types';
import { cellBottom, cellX, type LevelContext } from '../LevelContext';
import { Obstacle } from '../Obstacle';

/**
 * Hops in place on a steady beat: rest... crouch and wiggle (the tell)... hop... land.
 * Wand: becomes a happy friend that keeps hopping harmlessly (or, for farm goats, stops and bleats).
 */
export class Hopper extends Obstacle {
  private readonly baseY: number;
  private readonly hopHeight: number;
  private readonly hopTime: number;
  private readonly restTime: number;
  private t = 0;
  private told = false;
  /** Friendly and standing still (farm goats). */
  private resting = false;
  private bleatTimer = 0;

  constructor(ctx: LevelContext, def: HopperDef) {
    super(ctx, cellX(def.col), cellBottom(def.row), ctx.skin.hopper ?? TK.hopper, def.tint);
    this.setOrigin(0.5, 1);
    this.body.setSize(10, 10).setOffset(2, 4);
    this.baseY = this.y;
    this.hopHeight = (def.height ?? TOOLKIT.hopperHeight) * TILE;
    // Hop slowly enough that its fastest moment is still under the speed limit.
    this.hopTime = Math.max(0.8, (this.hopHeight * Math.PI) / MAX_OBSTACLE_SPEED);
    const every = def.every ?? TOOLKIT.hopperEvery;
    this.restTime = Math.max(0.3, every - TOOLKIT.tellTime - this.hopTime);
  }

  protected zone(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.x - 8, this.baseY - this.hopHeight - 14, 16, this.hopHeight + 14);
  }

  tick(dt: number): void {
    if (this.resting) {
      // A resting friend bleats happily now and then when she's close by.
      this.bleatTimer -= dt;
      if (this.bleatTimer <= 0 && this.nearPrincess(4)) {
        this.bleatTimer = 4;
        sfx.bleat();
        sparkleBurst(this.scene, this.x, this.y - 16, 5, 8);
      }
      return;
    }
    // Other friendly hoppers keep hopping happily (they just can't bonk anyone).
    if (this.friendly) this.hop(dt);
    else super.tick(dt);
  }

  protected behave(dt: number): void {
    this.hop(dt);
  }

  private hop(dt: number): void {
    this.t += dt;
    const tellStart = this.restTime;
    const hopStart = tellStart + TOOLKIT.tellTime;
    const end = hopStart + this.hopTime;
    if (this.t < tellStart) {
      this.setFrame(0);
      this.y = this.baseY;
    } else if (this.t < hopStart) {
      // The tell: crouch, wiggle, and a little sound.
      this.setFrame(1);
      if (!this.told) {
        this.told = true;
        if (!this.friendly) {
          this.wiggle(TOOLKIT.tellTime);
          if (this.nearPrincess()) sfx.tell();
        }
      }
    } else if (this.t < end) {
      this.setFrame(0);
      const p = (this.t - hopStart) / this.hopTime;
      this.y = this.baseY - this.hopHeight * Math.sin(p * Math.PI);
    } else {
      this.t = 0;
      this.told = false;
      this.y = this.baseY;
    }
  }

  protected turnFriendly(): void {
    this.setTexture(this.ctx.skin.hopperFriend ?? TK.hopperFriend, 0);
    if (this.ctx.skin.hopperFriendStops) {
      this.resting = true;
      this.y = this.baseY;
      this.bleatTimer = 4;
      sfx.bleat();
    }
  }
}
