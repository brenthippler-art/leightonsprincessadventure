import Phaser from 'phaser';
import { GAME_HEIGHT } from '../../constants';
import { HINTS, TILE } from '../../config';
import { LEVEL_TEX } from '../../art/levelArt';
import { gateTexture, TK } from '../../art/toolkitArt';
import { TEX } from '../../art/uiArt';
import { sfx } from '../../audio/sfx';
import { speak } from '../../audio/Speech';
import { sparkleBurst } from '../fx';
import { comfort } from '../../systems/Comfort';
import { cellTop, cellX, gentleShake, type LevelContext } from '../LevelContext';

/**
 * PUZZLE BASICS shared by all six puzzles:
 *   - Gate: blocks the way (taller than she can jump) and shows what it wants.
 *   - Hints: after 10 s near the puzzle without progress, the right thing glows and bounces;
 *     after 20 s a big arrow points at it; optionally a friendly voice says a hint.
 *   - Wrong tries are never punished: a soft "hmm" and a gentle shake, that's all.
 */

/** Where a hint should point, and (optionally) a picture that should bounce. */
export interface HintTarget {
  x: number;
  y: number;
  bounce?: Phaser.GameObjects.Image;
}

/** The glow / bouncing star / big arrow that point at the right answer. */
class Hinter {
  private readonly halo: Phaser.GameObjects.Image;
  private readonly star: Phaser.GameObjects.Image;
  private readonly arrow: Phaser.GameObjects.Image;
  private bounced: { obj: Phaser.GameObjects.Image; baseY: number; tween: Phaser.Tweens.Tween } | null = null;

  constructor(private readonly scene: Phaser.Scene) {
    this.halo = scene.add.image(0, 0, LEVEL_TEX.glow).setTint(0xffe066).setDepth(8).setVisible(false);
    this.star = scene.add.image(0, 0, TEX.sparkle).setScale(2).setDepth(31).setVisible(false);
    // The help arrow points right; turned a quarter turn it points down at the target.
    this.arrow = scene.add.image(0, 0, TEX.helpArrow).setRotation(Math.PI / 2).setDepth(31).setVisible(false);
  }

  show(level: number, target: HintTarget | null): void {
    const on = level > 0 && target !== null;
    this.halo.setVisible(on);
    this.star.setVisible(on);
    this.arrow.setVisible(on && level >= 2);
    if (!on || !target) {
      this.stopBounce();
      return;
    }
    const t = this.scene.time.now / 1000;
    const hop = Math.abs(Math.sin(t * 5)) * 4;
    this.halo.setPosition(target.x, target.y).setAlpha(0.35 + 0.25 * Math.sin(t * 6)).setScale(1.2);
    this.star.setPosition(target.x, target.y - 16 - hop);
    this.arrow.setPosition(target.x, Math.max(14, target.y - 38 - hop * 1.5));
    if (target.bounce && this.bounced?.obj !== target.bounce) {
      this.stopBounce();
      const obj = target.bounce;
      const tween = this.scene.tweens.add({ targets: obj, y: obj.y - 3, duration: 220, yoyo: true, repeat: -1, ease: 'Sine.Out' });
      this.bounced = { obj, baseY: obj.y, tween };
    } else if (!target.bounce) {
      this.stopBounce();
    }
  }

  private stopBounce(): void {
    if (!this.bounced) return;
    this.bounced.tween.stop();
    this.bounced.obj.y = this.bounced.baseY;
    this.bounced = null;
  }

  destroy(): void {
    this.show(0, null);
    this.halo.destroy();
    this.star.destroy();
    this.arrow.destroy();
  }
}

/** A tall barred gate with an emblem plate showing what it wants. Opens by sliding up. */
export class Gate {
  readonly x: number;
  readonly bottom: number;
  readonly emblemY: number;
  private readonly bars: Phaser.Physics.Arcade.Sprite;
  private readonly parts: Phaser.GameObjects.Image[] = [];
  open = false;

  constructor(
    private readonly ctx: LevelContext,
    col: number,
  ) {
    this.x = cellX(col);
    // Reach from the top of the screen down to the ground in this column, so she can't jump over.
    let groundRow = 11;
    for (let r = 0; r < 11; r++)
      if (ctx.standableAt(col, r)) {
        groundRow = r;
        break;
      }
    this.bottom = groundRow < 11 ? cellTop(groundRow) : GAME_HEIGHT;
    const height = this.bottom;
    this.bars = ctx.solids.create(this.x, height / 2, gateTexture(ctx.scene, height)) as Phaser.Physics.Arcade.Sprite;
    this.bars.setDepth(7);
    this.emblemY = this.bottom - 38;
    this.parts.push(ctx.scene.add.image(this.x, this.emblemY, TK.emblem).setDepth(8));
  }

  /** Put a picture on the emblem plate (dx/dy from its center). */
  addIcon(texture: string, tint?: number, dx = 0, dy = 0, frame = 0): Phaser.GameObjects.Image {
    const icon = this.ctx.scene.add.image(this.x + dx, this.emblemY + dy, texture, frame).setDepth(9);
    if (tint !== undefined) icon.setTint(tint);
    this.parts.push(icon);
    return icon;
  }

  /** The things that should shake on a wrong try. */
  get shakeParts(): Phaser.GameObjects.Image[] {
    return [this.bars, ...this.parts];
  }

  openUp(): void {
    if (this.open) return;
    this.open = true;
    sfx.gateOpen();
    sparkleBurst(this.ctx.scene, this.x, this.emblemY, 12, 20);
    (this.bars.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.ctx.scene.tweens.add({ targets: [this.bars, ...this.parts], y: `-=${this.bottom}`, duration: 1100, ease: 'Sine.In' });
  }
}

export abstract class Puzzle {
  solved = false;
  private idle = 0;
  private hintLevel = 0;
  private readonly hinter: Hinter;
  /** Helper Mode: hints after 5 s (glow) and 10 s (arrow) instead of 10 s and 20 s. */
  private readonly hintScale = comfort.helperMode ? 0.5 : 1;

  constructor(
    protected readonly ctx: LevelContext,
    /** She has to be between these x positions for the hint timer to count. */
    protected readonly zoneLeft: number,
    protected readonly zoneRight: number,
  ) {
    this.hinter = new Hinter(ctx.scene);
  }

  /** What the friendly voice says as a hint. */
  protected abstract hintText(): string;
  /** The right thing to glow at / point at right now (or null for none). */
  protected abstract hintTarget(): HintTarget | null;
  /** Puzzle-specific logic, once per frame. */
  protected abstract update(dt: number): void;
  /** Called when a new hint level starts (1 = glow, 2 = arrow). */
  protected onHint(_level: number): void {}

  tick(dt: number): void {
    if (this.solved) return;
    this.update(dt);
    if (this.solved) return;

    const px = this.ctx.princess.x;
    if (px >= this.zoneLeft && px <= this.zoneRight) this.idle += dt;
    const level = this.idle >= HINTS.arrowAfter * this.hintScale ? 2 : this.idle >= HINTS.glowAfter * this.hintScale ? 1 : 0;
    if (level > this.hintLevel) {
      this.hintLevel = level;
      speak(this.hintText());
      this.onHint(level);
    }
    this.hinter.show(this.hintLevel, this.hintLevel > 0 ? this.hintTarget() : null);
  }

  /** Is she standing in this (unsolved) puzzle area? (Auto-run pauses there.) */
  contains(x: number): boolean {
    return !this.solved && x >= this.zoneLeft && x <= this.zoneRight;
  }

  /** She did something right: restart the hint timer and hide hints. */
  protected progress(): void {
    this.idle = 0;
    this.hintLevel = 0;
    this.hinter.show(0, null);
  }

  /** Not quite: a soft "hmm" and a gentle shake. No penalty, nothing lost. */
  protected wrong(targets: Phaser.GameObjects.GameObject[]): void {
    sfx.hmm();
    gentleShake(this.ctx.scene, targets);
  }

  protected solve(): void {
    if (this.solved) return;
    this.solved = true;
    this.hinter.destroy();
  }

  /** Default zone: from a few tiles before the first piece up to the gate. */
  static zone(firstCol: number, lastCol: number): [number, number] {
    return [cellX(firstCol) - 4 * TILE, cellX(lastCol) + TILE];
  }
}
