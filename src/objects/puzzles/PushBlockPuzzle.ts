import Phaser from 'phaser';
import { TILE } from '../../config';
import { TK } from '../../art/toolkitArt';
import { sfx } from '../../audio/sfx';
import type { PushBlockDef } from '../../levels/types';
import { sparkleBurst } from '../fx';
import { cellBottom, cellX, type LevelContext } from '../LevelContext';
import { PushableBlock } from './PushableBlock';
import { Puzzle, type HintTarget } from './Puzzle';

/**
 * PUSH BLOCK: push the box onto the big floor switch, and a bridge rises across the gap
 * (or, with bridgeStyle 'drawbridge', a drawbridge swings down across it).
 * If the box falls in the gap, it poofs back to where it started.
 */
export class PushBlockPuzzle extends Puzzle {
  private readonly crate: PushableBlock;
  private readonly switchImage: Phaser.GameObjects.Image;
  private readonly switchX: number;
  private bestDistance = Infinity;

  constructor(
    ctx: LevelContext,
    private readonly def: PushBlockDef,
  ) {
    super(ctx, cellX(def.col) - 4 * TILE, cellX(def.bridgeCol + def.bridgeWidth));
    const foot = cellBottom(def.row);
    this.switchX = cellX(def.switchCol);
    this.switchImage = ctx.scene.add.image(this.switchX, foot, TK.floorSwitch, 0).setOrigin(0.5, 1).setDepth(4);
    this.crate = new PushableBlock(ctx, cellX(def.col), foot, ctx.skin.crate ?? TK.crate);
    if (def.bridgeStyle === 'drawbridge') this.makeDrawbridge();
  }

  protected hintText(): string {
    return 'Push the box onto the button!';
  }

  protected hintTarget(): HintTarget | null {
    return { x: this.crate.x, y: this.crate.y };
  }

  protected update(dt: number): void {
    this.crate.tick(dt);
    const d = Math.abs(this.crate.x - this.switchX);
    if (d < this.bestDistance - TILE) {
      if (this.bestDistance !== Infinity) this.progress();
      this.bestDistance = d;
    }
    if (this.crate.onGround && d <= 6) this.press();
  }

  private press(): void {
    sfx.click();
    this.switchImage.setFrame(1);
    this.solve();
    this.raiseBridge();
  }

  /** Make the bridge solid, one invisible block per tile (the picture is drawn separately). */
  private solidBridge(top: number, visible: boolean): void {
    const tex = this.ctx.skin.plank ?? TK.plank;
    for (let i = 0; i < this.def.bridgeWidth; i++) {
      const x = cellX(this.def.bridgeCol + i);
      this.ctx.solids.create(x, top + 4, tex).setDepth(4).setVisible(visible);
      sparkleBurst(this.ctx.scene, x, top, 4, 8);
    }
  }

  /**
   * A drawbridge standing upright on the far side of the gap (so she can see it waiting),
   * which swings down across the gap when the switch is pressed.
   */
  private drawbridge: Phaser.GameObjects.TileSprite | null = null;

  private makeDrawbridge(): void {
    const top = cellBottom(this.def.row);
    const pivotX = (this.def.bridgeCol + this.def.bridgeWidth) * TILE;
    const tex = this.ctx.skin.plank ?? TK.plank;
    // Turned a quarter turn around its far end, so it stands straight up beside the gap.
    this.drawbridge = this.ctx.scene.add
      .tileSprite(pivotX, top, this.def.bridgeWidth * TILE, 8, tex)
      .setOrigin(1, 0)
      .setAngle(90)
      .setDepth(4);
  }

  private raiseBridge(): void {
    const { scene } = this.ctx;
    const top = cellBottom(this.def.row);
    sfx.gateOpen();
    if (this.drawbridge) {
      scene.tweens.add({
        targets: this.drawbridge,
        angle: 0,
        duration: 1000,
        ease: 'Bounce.Out',
        onComplete: () => this.solidBridge(top, false),
      });
      return;
    }
    const tex = this.ctx.skin.plank ?? TK.plank;
    for (let i = 0; i < this.def.bridgeWidth; i++) {
      const x = cellX(this.def.bridgeCol + i);
      const plank = scene.add.image(x, top + 40, tex).setOrigin(0.5, 0).setDepth(4).setAlpha(0);
      scene.tweens.add({
        targets: plank,
        y: top,
        alpha: 1,
        delay: i * 120,
        duration: 400,
        ease: 'Back.Out',
        onComplete: () => {
          plank.destroy();
          this.ctx.solids.create(x, top + 4, tex).setDepth(4);
          sparkleBurst(scene, x, top, 4, 8);
        },
      });
    }
  }
}
