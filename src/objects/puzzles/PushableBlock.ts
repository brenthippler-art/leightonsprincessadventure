import Phaser from 'phaser';
import { GAME_HEIGHT } from '../../constants';
import { TOOLKIT } from '../../config';
import { controls } from '../../input/Controls';
import { sparklePoof } from '../fx';
import type { LevelContext } from '../LevelContext';

/**
 * A block she can push by walking into it. Used by Shape Match (shape blocks) and Push Block (the box).
 * It has gravity, sits on the ground, and she can stand on top of it.
 */
export class PushableBlock extends Phaser.Physics.Arcade.Image {
  declare body: Phaser.Physics.Arcade.Body;
  readonly home: { x: number; y: number };
  private readonly icon?: Phaser.GameObjects.Image;
  /** Keeps pushing for a moment after contact flickers, so pushing feels smooth. */
  private pushTimer = 0;
  private pushDir = 0;
  busy = false;

  constructor(ctx: LevelContext, x: number, footY: number, texture: string, iconTexture?: string, iconTint?: number) {
    super(ctx.scene, x, footY - 8, texture);
    ctx.scene.add.existing(this);
    ctx.scene.physics.add.existing(this);
    this.setDepth(12);
    this.body.pushable = false; // she can't shove it by physics; we move it ourselves (gently)
    this.home = { x, y: this.y };
    if (iconTexture) {
      this.icon = ctx.scene.add.image(x, this.y, iconTexture).setDepth(13);
      if (iconTint !== undefined) this.icon.setTint(iconTint);
    }
    ctx.scene.physics.add.collider(this, ctx.layer);
    ctx.scene.physics.add.collider(this, ctx.solids);
    ctx.scene.physics.add.collider(ctx.princess, this, () => {
      const p = ctx.princess.body;
      if (p.touching.right && this.body.touching.left && controls.moveX > 0) this.push(1);
      else if (p.touching.left && this.body.touching.right && controls.moveX < 0) this.push(-1);
    });
  }

  push(dir: number): void {
    this.pushDir = dir;
    this.pushTimer = 0.12;
  }

  /** Is it being pushed right now, and which way? (0 = not pushed.) */
  get pushing(): number {
    return this.pushTimer > 0 ? this.pushDir : 0;
  }

  /**
   * Make a set of blocks solid to each other. Pushing one into another shoves the next one along too,
   * like pushing a line of toy blocks.
   */
  static link(scene: Phaser.Scene, blocks: PushableBlock[]): void {
    for (let i = 0; i < blocks.length; i++)
      for (let j = i + 1; j < blocks.length; j++) {
        const a = blocks[i];
        const b = blocks[j];
        scene.physics.add.collider(a, b, () => {
          if (a.pushing > 0 && a.body.touching.right && b.body.touching.left) b.push(1);
          if (a.pushing < 0 && a.body.touching.left && b.body.touching.right) b.push(-1);
          if (b.pushing > 0 && b.body.touching.right && a.body.touching.left) a.push(1);
          if (b.pushing < 0 && b.body.touching.left && a.body.touching.right) a.push(-1);
        });
      }
  }

  get onGround(): boolean {
    return this.body.blocked.down || this.body.touching.down;
  }

  tick(dt: number): void {
    if (this.busy) return;
    this.pushTimer -= dt;
    this.body.velocity.x = this.pushTimer > 0 ? this.pushDir * TOOLKIT.pushSpeed : 0;
    this.icon?.setPosition(this.x, this.y);
    // Pushed into a gap? It poofs back home. (Nothing is ever lost.)
    if (this.y > GAME_HEIGHT + 16) this.poofHome();
  }

  /** Hop in a high arc to a spot on the ground (used after a wrong try, to clear the way). */
  hopTo(x: number): void {
    this.busy = true;
    this.body.enable = false;
    this.pushTimer = 0;
    const scene = this.scene;
    const parts = [this, this.icon].filter(Boolean);
    scene.tweens.add({ targets: parts, x, duration: 800, ease: 'Sine.InOut' });
    scene.tweens.add({
      targets: parts,
      y: this.home.y - 56,
      duration: 400,
      yoyo: true,
      ease: 'Quad.Out',
      onComplete: () => {
        this.body.reset(x, this.home.y);
        this.body.enable = true;
        this.busy = false;
      },
    });
  }

  poofHome(): void {
    sparklePoof(this.scene, this.home.x, this.home.y);
    this.body.reset(this.home.x, this.home.y);
    this.icon?.setPosition(this.home.x, this.home.y);
  }

  /** Sink into a slot / lock in place for good. */
  settle(dy: number): void {
    this.busy = true;
    this.body.enable = false;
    this.scene.tweens.add({ targets: [this, this.icon].filter(Boolean), y: `+=${dy}`, duration: 400, ease: 'Bounce.Out' });
  }

  get iconImage(): Phaser.GameObjects.Image | undefined {
    return this.icon;
  }
}
