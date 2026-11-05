import Phaser from 'phaser';
import { TILE } from '../../config';
import { TK } from '../../art/toolkitArt';
import { TEX } from '../../art/uiArt';
import { sfx } from '../../audio/sfx';
import type { FindKeyDef } from '../../levels/types';
import { sparkleBurst } from '../fx';
import { cellTop, cellX, type LevelContext } from '../LevelContext';
import { Gate, Puzzle, type HintTarget } from './Puzzle';

type State = 'waiting' | 'carried' | 'used';

/**
 * FIND THE KEY: a key waits somewhere nearby (a little way back, or up on a platform).
 * A trail of sparkles flows from the lock to the key. She touches the key to pick it up
 * (it floats above her, and she keeps it even after a bonk), then the sparkles flow to the lock.
 * Bringing it to the gate opens it.
 */
export class FindKey extends Puzzle {
  private readonly gate: Gate;
  private readonly key: Phaser.GameObjects.Image;
  private state: State = 'waiting';
  private trailTimer = 0;

  constructor(ctx: LevelContext, def: FindKeyDef) {
    const keyX = cellX(def.col);
    super(ctx, Math.min(keyX, cellX(def.gateCol)) - 4 * TILE, cellX(def.gateCol) + TILE);
    this.gate = new Gate(ctx, def.gateCol);
    this.gate.addIcon(TK.lock);
    const y = cellTop(def.row) + 8;
    this.key = ctx.scene.add.image(keyX, y, TK.key).setDepth(21);
    ctx.scene.tweens.add({ targets: this.key, y: y - 3, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  protected hintText(): string {
    return this.state === 'carried' ? 'Take the key to the door!' : 'Find the key!';
  }

  protected hintTarget(): HintTarget | null {
    if (this.state === 'waiting') return { x: this.key.x, y: this.key.y };
    if (this.state === 'carried') return { x: this.gate.x, y: this.gate.emblemY };
    return null;
  }

  protected update(dt: number): void {
    const p = this.ctx.princess;
    const scene = this.ctx.scene;

    // Generous pickup: anywhere near her body counts (a little bigger than she is).
    const reach = new Phaser.Geom.Rectangle(p.body.x - 6, p.body.y - 6, p.body.width + 12, p.body.height + 12);
    if (this.state === 'waiting' && Phaser.Geom.Rectangle.Overlaps(reach, this.key.getBounds())) {
      this.state = 'carried';
      scene.tweens.killTweensOf(this.key);
      sfx.keyPickup();
      sparkleBurst(scene, this.key.x, this.key.y);
      this.progress();
    }

    if (this.state === 'carried') {
      // Float just above her head, following along gently.
      this.key.x += (p.x - 6 * p.facing - this.key.x) * 0.2;
      this.key.y += (p.y - 20 - this.key.y) * 0.2;
      this.key.setFlipX(p.facing < 0).setVisible(p.visible);
      if (Math.abs(p.x - this.gate.x) < 16 && p.visible) this.unlock();
    }

    // Sparkle trail: lock -> key while she's looking for it; key -> lock while she carries it.
    this.trailTimer -= dt;
    const nearby = p.x > this.zoneLeft - 6 * TILE && p.x < this.zoneRight + 2 * TILE;
    if (this.trailTimer <= 0 && nearby && this.state !== 'used') {
      this.trailTimer = 0.15;
      const from = this.state === 'waiting' ? { x: this.gate.x, y: this.gate.emblemY } : { x: this.key.x, y: this.key.y };
      const to = this.state === 'waiting' ? { x: this.key.x, y: this.key.y } : { x: this.gate.x, y: this.gate.emblemY };
      const s = scene.add.image(from.x, from.y, TEX.sparkle).setDepth(20).setAlpha(0.9);
      scene.tweens.add({ targets: s, x: to.x, y: to.y, duration: 1200, onComplete: () => s.destroy() });
      scene.tweens.add({ targets: s, alpha: 0, delay: 900, duration: 300 });
    }
  }

  private unlock(): void {
    this.state = 'used';
    this.solve();
    this.ctx.scene.tweens.add({
      targets: this.key,
      x: this.gate.x,
      y: this.gate.emblemY,
      duration: 400,
      ease: 'Sine.InOut',
      onComplete: () => {
        this.key.destroy();
        this.gate.openUp();
      },
    });
  }
}
