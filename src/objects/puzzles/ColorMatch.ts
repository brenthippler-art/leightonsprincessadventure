import Phaser from 'phaser';
import { GEM, TK } from '../../art/toolkitArt';
import { sfx } from '../../audio/sfx';
import type { ColorMatchDef, GemColor } from '../../levels/types';
import { sparkleBurst } from '../fx';
import { cellBottom, cellX, type LevelContext } from '../LevelContext';
import { Gate, Puzzle, type HintTarget } from './Puzzle';

interface ColorButton {
  color: GemColor;
  x: number;
  plate: Phaser.GameObjects.Image;
  icon: Phaser.GameObjects.Image;
  wasStanding: boolean;
}

/**
 * COLOR MATCH: the gate shows a colored gem shape (red heart, blue star, yellow sun, green leaf).
 * Buttons with the same colors+shapes sit on the ground. Stepping on the matching one opens the gate.
 * (Each color always has its own shape too, so color-blind players can match by shape.)
 */
export class ColorMatch extends Puzzle {
  private readonly gate: Gate;
  private readonly buttons: ColorButton[];
  private readonly foot: number;

  constructor(
    ctx: LevelContext,
    private readonly def: ColorMatchDef,
  ) {
    const choices = def.choices ?? (['red', 'blue', 'yellow', 'green'] as GemColor[]);
    super(ctx, ...Puzzle.zone(def.col, def.gateCol));
    this.gate = new Gate(ctx, def.gateCol);
    this.gate.addIcon(GEM[def.answer].icon, GEM[def.answer].color);
    this.foot = cellBottom(def.row);
    this.buttons = choices.map((color, i) => {
      const x = cellX(def.col + i * 2);
      const plate = ctx.scene.add.image(x, this.foot, TK.button, 0).setOrigin(0.5, 1).setTint(GEM[color].color).setDepth(5);
      const icon = ctx.scene.add.image(x, this.foot - 13, GEM[color].icon).setTint(GEM[color].color).setDepth(6);
      return { color, x, plate, icon, wasStanding: false };
    });
  }

  protected hintText(): string {
    return `Find the ${this.def.answer} ${GEM[this.def.answer].shapeName}!`;
  }

  protected hintTarget(): HintTarget | null {
    const b = this.buttons.find((b) => b.color === this.def.answer);
    return b ? { x: b.x, y: this.foot - 13, bounce: b.icon } : null;
  }

  protected update(): void {
    const p = this.ctx.princess;
    for (const b of this.buttons) {
      const standing = p.onGround && Math.abs(p.x - b.x) <= 8 && Math.abs(p.body.bottom - this.foot) <= 3;
      if (standing && !b.wasStanding) this.press(b);
      b.wasStanding = standing;
    }
  }

  private press(b: ColorButton): void {
    sfx.click();
    b.plate.setFrame(1);
    if (b.color === this.def.answer) {
      sparkleBurst(this.ctx.scene, b.x, this.foot - 13);
      this.solve();
      this.gate.openUp();
    } else {
      this.wrong([b.icon, ...this.gate.shakeParts]);
      this.ctx.scene.time.delayedCall(500, () => b.plate.setFrame(0));
    }
  }
}
