import Phaser from 'phaser';
import { BELL_COLORS, GEM, TK } from '../../art/toolkitArt';

/** Each bell also has its own SHAPE (not just a color), for color-blind players: heart, star, sun. */
const BELL_SHAPES = [GEM.red.icon, GEM.blue.icon, GEM.yellow.icon];
import { sfx } from '../../audio/sfx';
import type { PatternDef } from '../../levels/types';
import { sparkleBurst } from '../fx';
import { cellTop, cellX, type LevelContext } from '../LevelContext';
import { Gate, Puzzle, type HintTarget } from './Puzzle';

type State = 'waiting' | 'playing' | 'listening';

/**
 * FOLLOW THE PATTERN: two or three bells hang up high. When she comes near, they chime and glow in an
 * order (up to 3 notes). She rings them in the same order by jumping up and bumping them.
 * A wrong bell gives a soft "hmm", and the bells play the pattern again, slower.
 */
export class PatternPuzzle extends Puzzle {
  private readonly gate: Gate;
  private readonly bells: Phaser.GameObjects.Image[] = [];
  private readonly badges: Phaser.GameObjects.Image[] = [];
  private readonly order: number[];
  private state: State = 'waiting';
  private step = 0;
  /** Seconds between notes when the bells play the pattern. Grows after each wrong try. */
  private spacing = 0.7;
  private cooldown = 0;

  constructor(
    ctx: LevelContext,
    def: PatternDef,
  ) {
    super(ctx, ...Puzzle.zone(def.col, def.gateCol));
    const bells = def.bells ?? 3;
    this.order = def.order.filter((b) => b < bells).slice(0, 3);
    this.gate = new Gate(ctx, def.gateCol);
    this.gate.addIcon(TK.note, 0x8a6bff);
    for (let i = 0; i < bells; i++) {
      const x = cellX(def.col + i * 3);
      const y = cellTop(def.row) + 8;
      ctx.scene.add.rectangle(x, y / 2 - 4, 1, y - 8, 0x8a74b0).setDepth(5); // the rope it hangs from
      const bell = ctx.scene.add.image(x, y, ctx.skin.bell ?? TK.bell).setTint(BELL_COLORS[i]).setDepth(6);
      bell.setOrigin(0.5, 0.1); // swing from the top
      bell.y -= 6;
      this.bells.push(bell);
      // The bell's shape badge swings with it (kept in step in update()).
      this.badges.push(ctx.scene.add.image(x, bell.y + 7, BELL_SHAPES[i]).setScale(0.6).setDepth(7));
    }
  }

  protected hintText(): string {
    return 'Listen to the bells, then ring them!';
  }

  protected hintTarget(): HintTarget | null {
    if (this.state !== 'listening') return null;
    const bell = this.bells[this.order[this.step]];
    return { x: bell.x, y: bell.y + 6, bounce: bell };
  }

  protected onHint(): void {
    // Hints also replay the tune, so she can hear it again.
    if (this.state === 'listening') this.play();
  }

  /** The bells play the pattern by themselves. */
  private play(): void {
    this.state = 'playing';
    this.step = 0;
    this.order.forEach((b, i) => this.ctx.scene.time.delayedCall((0.6 + i * this.spacing) * 1000, () => this.ring(b)));
    this.ctx.scene.time.delayedCall((0.6 + this.order.length * this.spacing) * 1000, () => {
      if (!this.solved) this.state = 'listening';
    });
  }

  /** Swing, glow and chime one bell. */
  private ring(i: number): void {
    const bell = this.bells[i];
    sfx.bell(i);
    sparkleBurst(this.ctx.scene, bell.x, bell.y + 8, 6, 10);
    this.ctx.scene.tweens.add({ targets: bell, angle: { from: -18, to: 18 }, duration: 120, yoyo: true, repeat: 1, onComplete: () => bell.setAngle(0) });
    this.ctx.scene.tweens.add({ targets: bell, scale: 1.3, duration: 120, yoyo: true });
  }

  protected update(dt: number): void {
    this.bells.forEach((b, i) => this.badges[i].setPosition(b.x, b.y + 7).setAngle(b.angle).setScale(0.6 * b.scale));
    const p = this.ctx.princess;
    this.cooldown -= dt;
    if (this.state === 'waiting') {
      if (p.x >= this.zoneLeft + 2 * 16) this.play();
      return;
    }
    if (this.state !== 'listening' || this.cooldown > 0 || p.body.velocity.y >= 0) return;

    // Jumping up into a bell rings it (her head bumps it softly).
    const head = new Phaser.Geom.Rectangle(p.body.x, p.body.top - 2, p.body.width, 6);
    const hit = this.bells.findIndex((b) => Phaser.Geom.Rectangle.Overlaps(head, new Phaser.Geom.Rectangle(b.x - 8, b.y, 16, 18)));
    if (hit < 0) return;
    this.cooldown = 0.4;
    p.body.velocity.y = 40; // a soft bump: she starts floating back down
    this.ring(hit);

    if (hit === this.order[this.step]) {
      this.step++;
      this.progress();
      if (this.step === this.order.length) {
        this.solve();
        this.ctx.scene.time.delayedCall(500, () => this.gate.openUp());
      }
    } else {
      this.wrong(this.bells);
      this.spacing = Math.min(this.spacing * 1.5, 1.6); // play it again, slower
      this.state = 'playing';
      this.ctx.scene.time.delayedCall(900, () => this.play());
    }
  }
}
