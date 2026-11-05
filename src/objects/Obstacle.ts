import Phaser from 'phaser';
import { MAX_OBSTACLE_SPEED, TILE } from '../config';
import { sfx } from '../audio/sfx';
import { sparkleBurst } from './fx';
import type { LevelContext } from './LevelContext';

/**
 * Base class for every obstacle. Obstacles are never "enemies": touching one just means a
 * gentle bonk (see GentleReset). Every obstacle:
 *   - moves itself (no physics pushing), never faster than half her run speed,
 *   - shows a "tell" (wiggle, glow or sound) before it does something,
 *   - can be slowed by the gentle-reset helper (speedScale),
 *   - reports a dangerZone() so safe spots are never picked right next to it,
 *   - can be turned FRIENDLY by the wand: then it's harmless forever.
 */
export abstract class Obstacle extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  /** 1 = normal speed, 0.5 = half speed (when the game is quietly helping). */
  speedScale = 1;
  /** Applies to every obstacle: 0.5 in Helper Mode (set by LevelScene). */
  static globalSpeed = 1;
  friendly = false;
  /** A "practice" obstacle (first of its kind): touching it only nudges her back gently. */
  practice = false;

  constructor(
    protected readonly ctx: LevelContext,
    x: number,
    y: number,
    texture: string,
    tint?: number,
  ) {
    super(ctx.scene, x, y, texture, 0);
    ctx.scene.add.existing(this);
    ctx.scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    // We move obstacles ourselves; the physics body just follows the picture (for touch detection).
    this.body.moves = false;
    this.setDepth(10);
    if (tint !== undefined) this.setTint(tint);
  }

  /** Can it bonk her right now? */
  get harmful(): boolean {
    return !this.friendly && this.visible && this.body.enable;
  }

  /** Can the wand hit it right now? */
  get befriendable(): boolean {
    return !this.friendly && this.visible;
  }

  /** Where the wand's sparkle has to touch to make it friendly (by default: its picture). */
  wandArea(): Phaser.Geom.Rectangle {
    return this.getBounds();
  }

  /** The area this obstacle can ever touch (null once friendly). */
  dangerZone(): Phaser.Geom.Rectangle | null {
    return this.friendly ? null : this.zone();
  }

  protected abstract zone(): Phaser.Geom.Rectangle;

  /** Called once per frame by the level. `dt` is in seconds. */
  tick(dt: number): void {
    if (!this.friendly) this.behave(dt * this.speedScale * Obstacle.globalSpeed);
  }

  protected abstract behave(dt: number): void;

  /** The wand's sparkle touched it: twinkle, and it becomes its friendly version. */
  befriend(): void {
    if (this.friendly) return;
    this.friendly = true;
    this.body.enable = false;
    this.scene.tweens.killTweensOf(this);
    this.setAngle(0).setScale(1).clearTint();
    sfx.befriend();
    sparkleBurst(this.scene, this.x, this.y - 6, 10, 18);
    this.turnFriendly();
  }

  protected abstract turnFriendly(): void;

  /** Tiles-per-second to pixels-per-second, never faster than the safety limit. */
  protected speedPx(tilesPerSecond: number): number {
    return Math.min(tilesPerSecond * TILE, MAX_OBSTACLE_SPEED);
  }

  /** The "tell": a quick wiggle. */
  protected wiggle(seconds: number): void {
    this.scene.tweens.add({
      targets: this,
      angle: { from: -8, to: 8 },
      duration: 90,
      yoyo: true,
      repeat: Math.max(0, Math.round(seconds / 0.18) - 1),
      onComplete: () => this.setAngle(0),
    });
  }

  /** Is she close enough to hear this obstacle's tell sound? (Keeps far-away ones quiet.) */
  protected nearPrincess(tiles = 9): boolean {
    return Math.abs(this.ctx.princess.x - this.x) <= tiles * TILE;
  }

  /** Float up and away, then vanish (for friendly fliers). */
  protected floatAway(dx: number, dy: number, ms: number): void {
    this.scene.tweens.add({
      targets: this,
      x: this.x + dx,
      y: this.y + dy,
      duration: ms,
      ease: 'Sine.In',
      onComplete: () => this.setVisible(false),
    });
    this.scene.tweens.add({ targets: this, alpha: 0, delay: ms * 0.6, duration: ms * 0.4 });
  }
}
