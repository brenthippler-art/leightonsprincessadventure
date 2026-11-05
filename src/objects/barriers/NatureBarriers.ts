import Phaser from 'phaser';
import { BUBBLES, MAX_OBSTACLE_SPEED, TILE, VINE } from '../../config';
import { giraffeRampTextures } from '../../art/giraffeArt';
import { TK, wideTexture } from '../../art/toolkitArt';
import { sfx } from '../../audio/sfx';
import type { BubblesDef, GiraffeDef, VineDef } from '../../levels/types';
import { sparkleBurst } from '../fx';
import { cellBottom, cellTop, type LevelContext } from '../LevelContext';
import type { Barrier } from './Barriers';

/**
 * A plank hanging from a jungle vine, swinging slowly like a pendulum. She rides along when she
 * stands on it.
 */
export class Vine implements Barrier {
  private readonly plank: Phaser.Physics.Arcade.Image;
  private readonly rope: Phaser.GameObjects.Graphics;
  private readonly pivot: { x: number; y: number };
  private readonly length: number;
  private readonly amplitude: number;
  private readonly period: number;
  private t = 0;

  constructor(ctx: LevelContext, def: VineDef) {
    const width = def.width ?? 2;
    const restX = def.col * TILE + (width * TILE) / 2;
    this.length = (def.length ?? VINE.length) * TILE;
    this.amplitude = Phaser.Math.DegToRad(def.swing ?? VINE.swing);
    // A pendulum rises a little at each end of its swing. Hang it so the plank is exactly level with
    // the top of `row` at the ENDS (where she steps on and off), and dips a bit in the middle.
    const rise = this.length * (1 - Math.cos(this.amplitude));
    const restY = cellTop(def.row) + 4 + rise;
    // Fastest point of a swing = length x angle x (2 pi / period): keep it under the speed limit.
    this.period = Math.max(VINE.period, (2 * Math.PI * this.length * this.amplitude) / MAX_OBSTACLE_SPEED);
    this.pivot = { x: restX, y: restY - this.length };
    const tex = width === 2 && ctx.skin.vinePlank ? ctx.skin.vinePlank : wideTexture(ctx.scene, 'platform', width);
    this.plank = ctx.scene.physics.add.image(restX, restY, tex).setDepth(4);
    const body = this.plank.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false).setImmovable(true);
    // "Direct control": we place the plank exactly on its swing each frame, and Phaser works out
    // how fast that was, so she still gets carried along smoothly.
    body.setDirectControl(true);
    body.checkCollision.down = body.checkCollision.left = body.checkCollision.right = false; // jump up through it
    ctx.scene.physics.add.collider(ctx.princess, this.plank);
    this.rope = ctx.scene.add.graphics().setDepth(3);
  }

  tick(dt: number): void {
    if (dt <= 0) return;
    this.t += dt;
    const angle = this.amplitude * Math.sin((this.t / this.period) * Math.PI * 2);
    const tx = this.pivot.x + this.length * Math.sin(angle);
    const ty = this.pivot.y + this.length * Math.cos(angle);
    this.plank.setPosition(tx, ty);

    // Draw the vine from the branch to the plank, with a few little leaves.
    const g = this.rope.clear();
    g.lineStyle(2, 0x3f8a3a, 1).lineBetween(this.pivot.x, this.pivot.y, this.plank.x, this.plank.y - 4);
    g.fillStyle(0x5fd06a, 1);
    for (const f of [0.3, 0.55, 0.8]) {
      const lx = Phaser.Math.Linear(this.pivot.x, this.plank.x, f);
      const ly = Phaser.Math.Linear(this.pivot.y, this.plank.y, f);
      g.fillRect(Math.round(lx) + 1, Math.round(ly), 3, 2);
    }
    g.fillStyle(0x7a5a3a, 1).fillRect(this.pivot.x - 6, this.pivot.y - 3, 12, 3); // the branch it hangs from
  }
}

/**
 * A friendly giraffe. When Leighton comes near, she lowers her long neck to the ground,
 * and Leighton can walk up it like a ramp, along her back, and onto the high ledge behind her.
 * (Arcade physics has no slopes, so the ramp holds her up with `princess.standOn()` each frame.)
 */
export class GiraffeRamp implements Barrier {
  private readonly image: Phaser.GameObjects.Image;
  private readonly lowered: string;
  private readonly x0: number;
  private readonly x1: number;
  private readonly backEnd: number;
  private readonly groundY: number;
  private readonly rise: number;
  private isLowered = false;

  constructor(
    private readonly ctx: LevelContext,
    def: GiraffeDef,
  ) {
    this.x0 = def.col * TILE;
    this.x1 = this.x0 + def.length * TILE;
    this.backEnd = this.x1 + 2 * TILE;
    this.groundY = cellBottom(def.row);
    this.rise = def.height * TILE;
    const tex = giraffeRampTextures(ctx.scene, def.length, def.height);
    this.lowered = tex.lowered;
    // The picture starts one tile left of the ramp (room for her head) and stands on the ground.
    this.image = ctx.scene.add.image(this.x0 - TILE, this.groundY, tex.standing).setOrigin(0, 1).setDepth(3);
  }

  /** The height of the walkable surface (neck, then back) at x. */
  private surfaceY(x: number): number {
    if (x <= this.x1) return this.groundY - ((x - this.x0) / (this.x1 - this.x0)) * this.rise;
    return this.groundY - this.rise;
  }

  private lower(): void {
    this.isLowered = true;
    this.image.setTexture(this.lowered);
    this.image.setScale(1, 0.96);
    this.ctx.scene.tweens.add({ targets: this.image, scaleY: 1, duration: 300, ease: 'Back.Out' });
    sfx.befriend();
    sparkleBurst(this.ctx.scene, this.x0 - 6, this.groundY - 8, 10, 14);
  }

  tick(): void {
    const p = this.ctx.princess;
    if (!this.isLowered && p.x > this.x0 - 6 * TILE && p.x < this.backEnd) this.lower();
    if (!this.isLowered || p.body.velocity.y < 0 || p.x < this.x0 || p.x > this.backEnd) return;
    const sy = this.surfaceY(p.x);
    const feet = p.body.bottom;
    if (feet >= sy - 3 && feet <= sy + 10) p.standOn(sy);
  }
}

/** A column of rising bubbles that gently carries her up while she's inside it. */
export class BubbleLift implements Barrier {
  private readonly x: number;
  private readonly top: number;
  private readonly bottom: number;
  private spawn = 0;

  constructor(
    private readonly ctx: LevelContext,
    def: BubblesDef,
  ) {
    this.x = def.col * TILE + TILE / 2;
    this.bottom = cellBottom(def.row);
    this.top = this.bottom - def.height * TILE;
    // A soft glow at the bottom shows where the bubbles come from.
    ctx.scene.add.ellipse(this.x, this.bottom - 2, 18, 5, 0xc8f4ff, 0.6).setDepth(2);
  }

  tick(dt: number): void {
    const scene = this.ctx.scene;
    this.spawn -= dt;
    if (this.spawn <= 0) {
      this.spawn = 0.12;
      const b = scene.add
        .image(this.x + Phaser.Math.Between(-7, 7), this.bottom - 2, Math.random() < 0.5 ? TK.bubble : TK.bubbleSmall)
        .setDepth(22)
        .setAlpha(0.85);
      scene.tweens.add({ targets: b, y: this.top, duration: 1800, onComplete: () => b.destroy() });
      scene.tweens.add({ targets: b, x: b.x + 4, duration: 400, yoyo: true, repeat: 2, ease: 'Sine.InOut' });
    }
    const p = this.ctx.princess;
    const inside = Math.abs(p.x - this.x) <= 11 && p.body.bottom > this.top && p.body.top < this.bottom;
    if (inside && p.body.velocity.y > -BUBBLES.liftSpeed) p.body.velocity.y = -BUBBLES.liftSpeed;
  }
}
