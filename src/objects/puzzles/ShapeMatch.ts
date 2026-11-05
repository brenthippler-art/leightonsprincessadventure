import { TILE } from '../../config';
import { SHAPE, TK } from '../../art/toolkitArt';
import { sfx } from '../../audio/sfx';
import type { ShapeKind, ShapeMatchDef } from '../../levels/types';
import { sparkleBurst } from '../fx';
import { cellBottom, cellX, type LevelContext } from '../LevelContext';
import { PushableBlock } from './PushableBlock';
import { Gate, Puzzle, type HintTarget } from './Puzzle';

/**
 * SHAPE MATCH: the door shows a shape outline, and there's a slot in the ground in front of it.
 * Three shape blocks sit nearby. She pushes them by walking into them (pushing one shoves the line).
 * The matching one clunks into the slot and the door opens; a different one says "hmm" and hops
 * over her head to land behind her, out of the way.
 */
export class ShapeMatch extends Puzzle {
  private readonly gate: Gate;
  private readonly blocks: { shape: ShapeKind; block: PushableBlock }[];
  private readonly slotX: number;
  private bestDistance = Infinity;

  constructor(
    ctx: LevelContext,
    private readonly def: ShapeMatchDef,
  ) {
    super(ctx, ...Puzzle.zone(def.col, def.gateCol));
    this.gate = new Gate(ctx, def.gateCol);
    this.gate.addIcon(SHAPE[def.answer].outline, 0x6b5a80);
    // The slot is the cell right in front of the gate: a pushed block stops there against the gate.
    this.slotX = cellX(def.gateCol - 1);
    const foot = cellBottom(def.row);
    ctx.scene.add.image(this.slotX, foot + 1, TK.slot).setOrigin(0.5, 1).setDepth(4);
    const shapes = def.shapes ?? (['circle', 'square', 'triangle'] as ShapeKind[]);
    this.blocks = shapes.map((shape, i) => ({
      shape,
      block: new PushableBlock(ctx, cellX(def.col + i * 3), foot, ctx.skin.block ?? TK.block, SHAPE[shape].solid, SHAPE[shape].color),
    }));
    PushableBlock.link(ctx.scene, this.blocks.map((b) => b.block));
  }

  /**
   * Where a wrong block hops to: over her head to just behind her, so the way to the slot is clear.
   * (Falls back to its starting spot if there's no ground behind her.)
   */
  private landingSpotBehindHer(block: PushableBlock): number {
    const p = this.ctx.princess;
    const x = p.x - 28;
    const col = Math.floor(x / TILE);
    const row = Math.round((block.home.y + 8 - 4) / TILE); // the ground row under the blocks
    return this.ctx.standableAt(col, row) && !this.ctx.standableAt(col, row - 1) ? x : block.home.x;
  }

  protected hintText(): string {
    return `Push the ${this.def.answer} into the door!`;
  }

  protected hintTarget(): HintTarget | null {
    const right = this.blocks.find((b) => b.shape === this.def.answer);
    return right ? { x: right.block.x, y: right.block.y } : null;
  }

  protected update(dt: number): void {
    for (const { shape, block } of this.blocks) {
      block.tick(dt);
      if (block.busy || !block.onGround) continue;

      if (shape === this.def.answer) {
        // Getting the right block closer counts as progress (resets the hint timer).
        const d = Math.abs(block.x - this.slotX);
        if (d < this.bestDistance - TILE) {
          if (this.bestDistance !== Infinity) this.progress();
          this.bestDistance = d;
        }
      }

      if (Math.abs(block.x - this.slotX) <= 3) {
        if (shape === this.def.answer) {
          sfx.click();
          block.settle(6);
          sparkleBurst(this.ctx.scene, this.slotX, block.y);
          this.solve();
          this.gate.openUp();
        } else {
          this.wrong([...this.gate.shakeParts]);
          block.hopTo(this.landingSpotBehindHer(block));
        }
      }
    }
  }
}
