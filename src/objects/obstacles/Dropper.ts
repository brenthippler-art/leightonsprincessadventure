import Phaser from 'phaser';
import { TOOLKIT } from '../../config';
import { LEVEL_TEX } from '../../art/levelArt';
import { TK } from '../../art/toolkitArt';
import { sfx } from '../../audio/sfx';
import type { DropperDef } from '../../levels/types';
import { sparkleBurst } from '../fx';
import { cellTop, cellX, groundBelow, type LevelContext } from '../LevelContext';
import { Obstacle } from '../Obstacle';
import { comfort } from '../../systems/Comfort';

type State = 'growing' | 'hanging' | 'falling' | 'resting';

/**
 * Something hangs up high and drops straight down on a slow, steady timer.
 * Tells: it glows and wiggles (with a little sound) before letting go, and a shadow appears on the
 * ground 1 second before it lands.
 * Wand (hit it while it falls): it turns into a petal that drifts down, and the dropping stops.
 */
export class Dropper extends Obstacle {
  private readonly hangY: number;
  private readonly landY: number;
  private readonly fallSpeed: number;
  private readonly every: number;
  private readonly hanger: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Image;
  private phase: State = 'resting';
  private timer = 0.5;
  private told = false;
  /** A soft glow that pulses during the tell ("I'm about to drop!"). */
  private readonly warnGlow: Phaser.GameObjects.Image;

  constructor(ctx: LevelContext, def: DropperDef) {
    const x = cellX(def.col);
    super(ctx, x, cellTop(def.row) + 13, ctx.skin.drop ?? TK.drop, def.tint);
    this.body.setSize(8, 8).setOffset(2, 3);
    this.hanger = ctx.scene.add.image(x, cellTop(def.row) + 4, ctx.skin.hanger ?? TK.hanger).setDepth(11);
    this.hangY = this.y;
    this.landY = (groundBelow(ctx, def.col, def.row + 1) ?? cellTop(11)) - 5;
    this.fallSpeed = this.speedPx(def.speed ?? TOOLKIT.dropperSpeed);
    this.every = def.every ?? TOOLKIT.dropperEvery;
    this.shadow = ctx.scene.add.image(x, this.landY + 5, TK.shadow).setOrigin(0.5, 1).setDepth(4).setAlpha(0);
    this.warnGlow = ctx.scene.add.image(x, this.hangY, LEVEL_TEX.glow).setTint(0xfff0a0).setDepth(9).setAlpha(0);
    this.setVisible(false);
    this.body.enable = false;
  }

  /** Generous: a sparkle anywhere in its drop column counts, even between drops. */
  get befriendable(): boolean {
    return !this.friendly;
  }

  wandArea(): Phaser.Geom.Rectangle {
    return this.zone();
  }

  get harmful(): boolean {
    return super.harmful && this.phase === 'falling';
  }

  protected zone(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.x - 8, this.hangY - 8, 16, this.landY - this.hangY + 14);
  }

  protected behave(dt: number): void {
    this.timer -= dt;

    // The shadow tell: fades in over the last second before landing.
    let timeToLand = Infinity;
    if (this.phase === 'hanging') timeToLand = Math.max(0, this.timer) + (this.landY - this.hangY) / this.fallSpeed;
    if (this.phase === 'falling') timeToLand = (this.landY - this.y) / this.fallSpeed;
    const lead = TOOLKIT.dropperShadowLead;
    const amount = timeToLand <= lead ? 1 - timeToLand / lead : 0;
    this.shadow.setAlpha(amount > 0 ? 0.15 + 0.35 * amount : 0).setScale(0.4 + 0.6 * amount, 1);

    switch (this.phase) {
      case 'resting':
        if (this.timer <= 0) {
          this.phase = 'growing';
          this.timer = 0.5;
          this.setPosition(this.x, this.hangY).setVisible(true).setAlpha(1).setScale(0);
          this.scene.tweens.add({ targets: this, scale: 1, duration: 400, ease: 'Back.Out' });
        }
        break;
      case 'growing':
        if (this.timer <= 0) {
          this.phase = 'hanging';
          this.timer = Math.max(TOOLKIT.tellTime, this.every - 0.5);
          this.told = false;
        }
        break;
      case 'hanging':
        if (!this.told && this.timer <= TOOLKIT.tellTime) {
          this.told = true;
          this.wiggle(TOOLKIT.tellTime);
          if (this.nearPrincess()) sfx.tell();
          this.scene.tweens.add({ targets: this.warnGlow, alpha: comfort.reduceFlashing ? 0.35 : 0.7, duration: comfort.reduceFlashing ? 300 : 150, yoyo: true, repeat: Math.round(TOOLKIT.tellTime / 0.3) - 1 });
        }
        if (this.timer <= 0) {
          this.phase = 'falling';
          this.body.enable = true;
        }
        break;
      case 'falling':
        this.y = Math.min(this.landY, this.y + this.fallSpeed * dt);
        if (this.y >= this.landY) {
          sparkleBurst(this.scene, this.x, this.landY, 6, 8);
          this.setVisible(false);
          this.body.enable = false;
          this.phase = 'resting';
          this.timer = 0.6;
        }
        break;
    }
  }

  protected turnFriendly(): void {
    this.shadow.destroy();
    this.warnGlow.destroy();
    this.hanger.setTint(0xffc2e2);
    this.setTexture(this.ctx.skin.dropFriend ?? TK.petal).setVisible(true).setAlpha(1).setScale(1);
    if (this.phase !== 'falling') this.y = this.hangY;
    // Drift gently down, swaying, then fade away.
    this.scene.tweens.add({ targets: this, x: this.x + 10, duration: 600, yoyo: true, repeat: 2, ease: 'Sine.InOut' });
    this.scene.tweens.add({ targets: this, y: this.landY, alpha: 0, duration: 3600, onComplete: () => this.setVisible(false) });
  }
}
