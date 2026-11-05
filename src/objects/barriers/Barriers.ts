import Phaser from 'phaser';
import { PRINCESS, TILE, TOOLKIT } from '../../config';
import { TK, wideTexture } from '../../art/toolkitArt';
import { sfx } from '../../audio/sfx';
import type { BouncePadDef, CloudDef, MovingPlatformDef, WallDef } from '../../levels/types';
import { sparkleBurst } from '../fx';
import { cellBottom, cellTop, cellX, type LevelContext } from '../LevelContext';

/**
 * BARRIERS: things to get over, across, or ride. None of them ever bonk her.
 * (Gaps are just empty columns in the level's text map.)
 */

/** Anything the level needs to update each frame. */
export interface Barrier {
  tick(dt: number): void;
}

/** Make a body "one-way": solid only on top, so she can jump up through it from below. */
function oneWay(body: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody): void {
  body.checkCollision.down = false;
  body.checkCollision.left = false;
  body.checkCollision.right = false;
}

/** A low (1 tile) or tall (2 tile) block wall standing on the ground. */
export class Wall implements Barrier {
  constructor(ctx: LevelContext, def: WallDef) {
    for (let i = 0; i < def.height; i++) {
      ctx.solids.create(cellX(def.col), cellTop(def.row - i) + TILE / 2, ctx.skin.wall ?? TK.wall).setDepth(3);
    }
  }

  tick(): void {}
}

/** A platform that glides slowly sideways or up-and-down, pausing at each end. She rides along. */
export class MovingPlatform implements Barrier {
  private readonly image: Phaser.Physics.Arcade.Image;
  private readonly speed: number;
  private readonly from: number;
  private readonly to: number;
  private dir = 1;
  private pause = 0.8;

  constructor(
    ctx: LevelContext,
    private readonly def: MovingPlatformDef,
  ) {
    const width = def.width ?? 2;
    const x = def.col * TILE + (width * TILE) / 2;
    // A theme can supply its own 2-wide platform (a toy train car, a star...); its top edge is the surface.
    const tex = width === 2 && ctx.skin.movingPlatform ? ctx.skin.movingPlatform : wideTexture(ctx.scene, 'platform', width);
    const y = cellTop(def.row) + ctx.scene.textures.getFrame(tex).height / 2;
    this.image = ctx.scene.physics.add.image(x, y, tex).setDepth(3);
    const body = this.image.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false).setImmovable(true);
    oneWay(body);
    // (Arcade's default "friction" carries her sideways along with the platform.)
    this.speed = Math.min((def.speed ?? TOOLKIT.movingPlatformSpeed) * TILE, PRINCESS.runSpeed / 2);
    const distance = def.distance * TILE;
    this.from = def.axis === 'x' ? x : y;
    this.to = def.axis === 'x' ? x + distance : y - distance;
    ctx.scene.physics.add.collider(ctx.princess, this.image);
  }

  tick(dt: number): void {
    const body = this.image.body as Phaser.Physics.Arcade.Body;
    const horizontal = this.def.axis === 'x';
    if (this.pause > 0) {
      this.pause -= dt;
      body.setVelocity(0, 0);
      return;
    }
    // Moving toward `to` when dir = 1, back toward `from` when dir = -1.
    const pos = horizontal ? this.image.x : this.image.y;
    const target = this.dir > 0 ? this.to : this.from;
    const sign = Math.sign(target - pos);
    if (sign === 0 || Math.abs(target - pos) < 1) {
      this.dir = -this.dir;
      this.pause = 0.8; // a calm pause at each end, so getting on and off is easy
      // Snap exactly onto the end point, so the platform lines up perfectly with ledges (no tiny lip to snag on).
      body.reset(horizontal ? target : this.image.x, horizontal ? this.image.y : target);
      return;
    }
    if (horizontal) body.setVelocity(sign * this.speed, 0);
    else body.setVelocity(0, sign * this.speed);
  }
}

/** A springy pad: landing on it (or walking onto it) bounces her up high with a happy boing. */
export class BouncePad implements Barrier {
  private readonly image: Phaser.GameObjects.Image;
  private readonly zone: Phaser.GameObjects.Zone;
  private readonly launchSpeed: number;
  private cooldown = 0;

  constructor(
    private readonly ctx: LevelContext,
    def: BouncePadDef,
  ) {
    const x = cellX(def.col);
    const foot = cellBottom(def.row);
    this.image = ctx.scene.add.image(x, foot, ctx.skin.pad ?? TK.pad, 0).setOrigin(0.5, 1).setDepth(6);
    this.zone = ctx.scene.add.zone(x, foot - 5, 14, 10);
    ctx.scene.physics.add.existing(this.zone, true);
    // Speed needed to rise `power` tiles with her floaty rising gravity: v = sqrt(2 * g * height).
    const height = (def.power ?? TOOLKIT.bouncePadPower) * TILE;
    this.launchSpeed = Math.sqrt(2 * PRINCESS.gravityRisingHeld * height);
    ctx.scene.physics.add.overlap(ctx.princess, this.zone, () => this.bounce());
    // Idle "I'm springy!" bob, so it looks different from the ground.
    ctx.scene.tweens.add({ targets: this.image, scaleY: 0.85, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  private bounce(): void {
    const p = this.ctx.princess;
    if (this.cooldown > 0 || p.body.velocity.y < 0) return;
    this.cooldown = 0.3;
    p.launch(this.launchSpeed);
    sfx.bounce();
    sparkleBurst(this.ctx.scene, this.image.x, this.image.y - 6, 6, 10);
    this.image.setFrame(1);
    this.ctx.scene.time.delayedCall(180, () => this.image.setFrame(0));
  }

  tick(dt: number): void {
    this.cooldown -= dt;
  }
}

/** A soft cloud to stand on. It wobbles and dips a little under her, but never drops her. */
export class CloudPlatform implements Barrier {
  private readonly image: Phaser.GameObjects.Image;
  private readonly zone: Phaser.GameObjects.Zone;
  private readonly baseY: number;
  private dip = 0;
  private t = Math.random() * 10;

  constructor(
    private readonly ctx: LevelContext,
    def: CloudDef,
  ) {
    const width = def.width ?? 3;
    const x = def.col * TILE + (width * TILE) / 2;
    const top = cellTop(def.row);
    // The solid part never moves (so she never slips off); only the picture wobbles.
    this.zone = ctx.scene.add.zone(x, top + 4, width * TILE, 8);
    ctx.scene.physics.add.existing(this.zone, true);
    oneWay(this.zone.body as Phaser.Physics.Arcade.StaticBody);
    ctx.scene.physics.add.collider(ctx.princess, this.zone);
    this.baseY = top + 4;
    this.image = ctx.scene.add.image(x, this.baseY, wideTexture(ctx.scene, 'cloud', width)).setDepth(3);
  }

  tick(dt: number): void {
    this.t += dt;
    const p = this.ctx.princess.body;
    const standing = p.touching.down && Math.abs(p.bottom - this.zone.y + 4) < 3 && Math.abs(p.center.x - this.zone.x) < this.zone.width / 2 + 4;
    this.dip += ((standing ? 2 : 0) - this.dip) * 0.15;
    this.image.y = Math.round(this.baseY + Math.sin(this.t * 2.2) * 1 + this.dip);
    this.image.scaleX = 1 + Math.sin(this.t * 1.7) * 0.02;
  }
}
