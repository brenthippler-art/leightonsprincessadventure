import Phaser from 'phaser';
import { TILE, TOOLKIT } from '../../config';
import { loopAnim } from '../../art/anim';
import { TK } from '../../art/toolkitArt';
import { sfx } from '../../audio/sfx';
import type { RollerDef } from '../../levels/types';
import { cellBottom, cellX, type LevelContext } from '../LevelContext';
import { Obstacle } from '../Obstacle';

type State = 'waiting' | 'tell' | 'rolling' | 'fading';

/**
 * Rolls slowly from the right toward her, fades away, and comes again every few seconds.
 * It only wakes up when she's nearby. Tell: it fades in and wiggles (with a sound) before rolling.
 * Wand: turns into a patch of flowers, and stops coming.
 */
export class Roller extends Obstacle {
  private readonly startX: number;
  private readonly distance: number;
  private readonly every: number;
  private readonly speed: number;
  private phase: State = 'waiting';
  private timer = 0.5;

  constructor(
    ctx: LevelContext,
    private readonly def: RollerDef,
  ) {
    super(ctx, cellX(def.col), cellBottom(def.row), ctx.skin.roller ?? TK.roller, def.tint);
    this.setOrigin(0.5, 1);
    this.body.setSize(10, 10).setOffset(2, 4);
    this.startX = this.x;
    this.distance = (def.distance ?? TOOLKIT.rollerDistance) * TILE;
    this.every = def.every ?? TOOLKIT.rollerEvery;
    this.speed = this.speedPx(def.speed ?? TOOLKIT.rollerSpeed);
    this.hide();
  }

  get harmful(): boolean {
    return super.harmful && (this.phase === 'tell' || this.phase === 'rolling');
  }

  protected zone(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.startX - this.distance - 8, this.y - 14, this.distance + 16, 14);
  }

  private hide(): void {
    this.setVisible(false).setAlpha(1);
    this.body.enable = false;
    this.anims.stop();
    this.x = this.startX;
    this.phase = 'waiting';
  }

  protected behave(dt: number): void {
    switch (this.phase) {
      case 'waiting': {
        this.timer -= dt;
        const near = Math.abs(this.ctx.princess.x - this.startX) <= TOOLKIT.rollerWakeDistance * TILE;
        if (this.timer <= 0 && near) {
          this.phase = 'tell';
          this.timer = TOOLKIT.tellTime;
          this.setVisible(true).setAlpha(0);
          this.body.enable = true;
          this.scene.tweens.add({ targets: this, alpha: 1, duration: 200 });
          this.wiggle(TOOLKIT.tellTime);
          if (this.nearPrincess(14)) sfx.tell();
        }
        break;
      }
      case 'tell':
        this.timer -= dt;
        if (this.timer <= 0) {
          this.phase = 'rolling';
          this.play(loopAnim(this.scene, this.texture.key, 8));
        }
        break;
      case 'rolling': {
        this.anims.timeScale = this.speedScale;
        this.x -= this.speed * dt;
        // Stop at the end of its path, or at the edge of the ground (it never rolls into a gap).
        const onGround = this.ctx.standableAt(Math.floor((this.x - 6) / TILE), this.def.row + 1);
        if (this.startX - this.x >= this.distance || !onGround) {
          this.phase = 'fading';
          this.timer = this.every;
          this.scene.tweens.add({ targets: this, alpha: 0, duration: 300, onComplete: () => this.hide() });
        }
        break;
      }
      case 'fading':
        break;
    }
  }

  protected turnFriendly(): void {
    this.anims.stop();
    this.setAlpha(1).setTexture(this.ctx.skin.rollerFriend ?? TK.flowers, 0).setOrigin(0.5, 1);
  }
}
