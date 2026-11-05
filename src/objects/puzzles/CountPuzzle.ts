import Phaser from 'phaser';
import { HINTS } from '../../config';
import { TK } from '../../art/toolkitArt';
import { sfx } from '../../audio/sfx';
import { speak } from '../../audio/Speech';
import type { CountDef } from '../../levels/types';
import { sparkleBurst } from '../fx';
import { cellTop, cellX, type LevelContext } from '../LevelContext';
import { Gate, Puzzle, type HintTarget } from './Puzzle';

const WORDS = ['One!', 'Two!', 'Three!', 'Four!', 'Five!'];

/** Dot layouts like the faces of a die, so 1-5 are easy to "see" without counting. */
const DICE: [number, number][][] = [
  [[0, 0]],
  [[-4, -4], [4, 4]],
  [[-5, -5], [0, 0], [5, 5]],
  [[-4, -4], [4, -4], [-4, 4], [4, 4]],
  [[-5, -5], [5, -5], [0, 0], [-5, 5], [5, 5]],
];

/**
 * COUNT TO N (1-5): the gate shows N dots. N stepping stones light up as she lands on each one,
 * with a rising counting note (and the number said out loud, if spoken hints are on).
 * When all are lit, the gate opens. There's no wrong order.
 */
export class CountPuzzle extends Puzzle {
  private readonly gate: Gate;
  private readonly stones: { image: Phaser.Physics.Arcade.Image; lit: boolean }[] = [];
  private readonly dots: Phaser.GameObjects.Image[];
  private litCount = 0;

  constructor(
    ctx: LevelContext,
    def: CountDef,
  ) {
    const n = Phaser.Math.Clamp(Math.round(def.count), 1, 5);
    super(ctx, ...Puzzle.zone(def.col, def.gateCol));
    this.gate = new Gate(ctx, def.gateCol);
    this.dots = DICE[n - 1].map(([dx, dy]) => this.gate.addIcon(TK.dot, undefined, dx, dy, 0));

    for (let i = 0; i < n; i++) {
      // The stone's top edge sits exactly at the top of its row (whatever height the theme's stone is).
      const tex = ctx.skin.stone ?? TK.stone;
      const h = ctx.scene.textures.getFrame(tex, 0).height;
      const image = ctx.scene.physics.add.staticImage(cellX(def.col + i * 2), cellTop(def.row) + h / 2, tex, 0).setDepth(4);
      const body = image.body as Phaser.Physics.Arcade.StaticBody;
      body.checkCollision.down = body.checkCollision.left = body.checkCollision.right = false; // jump up through
      const stone = { image, lit: false };
      this.stones.push(stone);
      ctx.scene.physics.add.collider(ctx.princess, image, () => {
        if (ctx.princess.body.touching.down) this.light(stone);
      });
    }
  }

  private light(stone: { image: Phaser.Physics.Arcade.Image; lit: boolean }): void {
    if (stone.lit || this.solved) return;
    stone.lit = true;
    stone.image.setFrame(1);
    this.litCount++;
    sfx.countNote(this.litCount);
    if (HINTS.countAloud) speak(WORDS[this.litCount - 1]);
    sparkleBurst(this.ctx.scene, stone.image.x, stone.image.y - 6, 8, 12);
    this.dots[this.litCount - 1]?.setFrame(1);
    this.progress();
    if (this.litCount === this.stones.length) {
      this.solve();
      this.ctx.scene.time.delayedCall(500, () => this.gate.openUp());
    }
  }

  protected hintText(): string {
    return `Jump on the stones! Count to ${this.stones.length}!`;
  }

  protected hintTarget(): HintTarget | null {
    const next = this.stones.find((s) => !s.lit);
    return next ? { x: next.image.x, y: next.image.y - 6 } : null;
  }

  protected update(): void {}
}
