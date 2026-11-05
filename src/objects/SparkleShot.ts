import Phaser from 'phaser';
import { SPARKLE_SHOT } from '../config';
import { EFFECTS } from '../art/effects';
import { sparkleBurst, twinkle } from './fx';

/**
 * The little twinkling star that flies out of Leighton's wand.
 * It flies forward about 5 tiles, leaves a trail of tiny twinkles, then bursts into sparkles.
 * (In a later step, touching an obstacle will turn that obstacle friendly.)
 */
export class SparkleShot extends Phaser.GameObjects.Sprite {
  /** Every sparkle currently flying (the level checks these against obstacles). */
  static readonly live = new Set<SparkleShot>();
  private traveled = 0;
  private trailTimer = 0;

  /** @param direction 1 = flying right, -1 = flying left */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly direction: number,
  ) {
    super(scene, x, y, EFFECTS.sparkleShot, 0);
    scene.add.existing(this); // also makes Phaser call preUpdate every frame
    SparkleShot.live.add(this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => SparkleShot.live.delete(this));
    this.setDepth(40);
    this.play(EFFECTS.sparkleShotAnim);
  }

  protected preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    const dt = delta / 1000;
    const step = SPARKLE_SHOT.speed * dt;
    this.x += step * this.direction;
    this.traveled += step;

    this.trailTimer -= dt;
    if (this.trailTimer <= 0) {
      this.trailTimer = SPARKLE_SHOT.trailEvery;
      twinkle(this.scene, this.x - 3 * this.direction, this.y + Phaser.Math.Between(-2, 2), 250);
    }

    if (this.traveled >= SPARKLE_SHOT.range) this.pop();
  }

  /** Burst into sparkles and disappear (at the end of its flight, or when it touches something). */
  pop(): void {
    sparkleBurst(this.scene, this.x, this.y);
    this.destroy();
  }
}
