import Phaser from 'phaser';
import { LEVEL_TOP, TILE_SIZE } from '../constants';
import { LEVEL_TEX } from '../art/levelArt';
import { twinkle } from './fx';
import { comfort } from '../systems/Comfort';

/**
 * The crown jewel at the end of a level: it floats and glows above a little pedestal.
 */
export class Jewel extends Phaser.GameObjects.Image {
  readonly zone: Phaser.GameObjects.Zone;
  private readonly glow: Phaser.GameObjects.Image;
  private twinkleTimer?: Phaser.Time.TimerEvent;

  /** `texture`: the theme's own jewel picture (already colored). Without one, a gray jewel is tinted. */
  constructor(scene: Phaser.Scene, col: number, row: number, color: number, texture?: string, glowColors?: number[]) {
    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const bottom = LEVEL_TOP + (row + 1) * TILE_SIZE;
    const y = bottom - 18;
    super(scene, x, y, texture ?? LEVEL_TEX.jewel);
    scene.add.image(x, bottom, LEVEL_TEX.pedestal).setOrigin(0.5, 1).setDepth(5);
    this.glow = scene.add.image(x, y, LEVEL_TEX.glow).setTint(color).setAlpha(0.6).setDepth(14);
    if (!texture) this.setTint(color);
    this.setDepth(15);
    scene.add.existing(this);

    // Gentle float up and down, and a breathing glow.
    scene.tweens.add({ targets: [this, this.glow], y: y - 4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    scene.tweens.add({ targets: this.glow, alpha: 0.25, scale: 1.25, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.twinkleTimer = scene.time.addEvent({
      delay: 450,
      loop: true,
      callback: () => twinkle(scene, this.x + Phaser.Math.Between(-7, 7), this.y + Phaser.Math.Between(-6, 4), 400),
    });

    // Some jewels shimmer: their glow cycles through colors (rainbow opal, sparkly diamond).
    if (glowColors?.length && !comfort.reduceFlashing) {
      let i = 0;
      scene.time.addEvent({ delay: 180, loop: true, callback: () => this.glow.active && this.glow.setTint(glowColors[i++ % glowColors.length]) });
    }

    // Generous trigger: touching anywhere near the pedestal counts.
    this.zone = scene.add.zone(x, bottom - 16, 20, 32);
    scene.physics.add.existing(this.zone, true);
  }

  /** Hidden and untouchable (the finale dragon is sitting on it). */
  hold(): void {
    this.setVisible(false);
    this.glow.setVisible(false);
    (this.zone.body as Phaser.Physics.Arcade.StaticBody).enable = false;
  }

  /** Shown again at (x, y): handed over by the dragon. */
  release(x: number, y: number): void {
    this.scene.tweens.killTweensOf([this, this.glow]);
    this.setPosition(x, y).setVisible(true);
    this.glow.setPosition(x, y).setVisible(true);
  }

  /** Stop floating/glowing so the jewel can fly away. */
  detach(): void {
    this.scene.tweens.killTweensOf([this, this.glow]);
    this.twinkleTimer?.remove();
    this.glow.destroy();
    this.zone.destroy();
  }
}
