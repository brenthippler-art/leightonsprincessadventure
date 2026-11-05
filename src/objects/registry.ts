import type { BarrierDef, ObstacleDef, PuzzleDef } from '../levels/types';
import type { LevelContext } from './LevelContext';
import type { Obstacle } from './Obstacle';
import { Dropper } from './obstacles/Dropper';
import { Flyer } from './obstacles/Flyer';
import { Hopper } from './obstacles/Hopper';
import { Roller } from './obstacles/Roller';
import { Thorns } from './obstacles/Thorns';
import { Walker } from './obstacles/Walker';
import { BouncePad, CloudPlatform, MovingPlatform, Wall, type Barrier } from './barriers/Barriers';
import { BubbleLift, GiraffeRamp, Vine } from './barriers/NatureBarriers';
import { ColorMatch } from './puzzles/ColorMatch';
import { CountPuzzle } from './puzzles/CountPuzzle';
import { FindKey } from './puzzles/FindKey';
import { PatternPuzzle } from './puzzles/PatternPuzzle';
import type { Puzzle } from './puzzles/Puzzle';
import { PushBlockPuzzle } from './puzzles/PushBlockPuzzle';
import { ShapeMatch } from './puzzles/ShapeMatch';

/**
 * THE TOOLKIT REGISTRY: turns a `type` key from a level file into the right object.
 * To add a new piece: write its class, add its Def to src/levels/types.ts, and add a line here.
 */

export function createObstacle(ctx: LevelContext, def: ObstacleDef): Obstacle {
  const obstacle = makeObstacle(ctx, def);
  obstacle.practice = !!def.practice;
  return obstacle;
}

function makeObstacle(ctx: LevelContext, def: ObstacleDef): Obstacle {
  switch (def.type) {
    case 'walker':
      return new Walker(ctx, def);
    case 'hopper':
      return new Hopper(ctx, def);
    case 'roller':
      return new Roller(ctx, def);
    case 'flyer':
      return new Flyer(ctx, def);
    case 'dropper':
      return new Dropper(ctx, def);
    case 'thorns':
      return new Thorns(ctx, def);
  }
}

export function createBarrier(ctx: LevelContext, def: BarrierDef): Barrier {
  switch (def.type) {
    case 'wall':
      return new Wall(ctx, def);
    case 'moving-platform':
      return new MovingPlatform(ctx, def);
    case 'bounce-pad':
      return new BouncePad(ctx, def);
    case 'cloud':
      return new CloudPlatform(ctx, def);
    case 'vine':
      return new Vine(ctx, def);
    case 'giraffe':
      return new GiraffeRamp(ctx, def);
    case 'bubbles':
      return new BubbleLift(ctx, def);
  }
}

export function createPuzzle(ctx: LevelContext, def: PuzzleDef): Puzzle {
  switch (def.type) {
    case 'color-match':
      return new ColorMatch(ctx, def);
    case 'shape-match':
      return new ShapeMatch(ctx, def);
    case 'count':
      return new CountPuzzle(ctx, def);
    case 'push-block':
      return new PushBlockPuzzle(ctx, def);
    case 'pattern':
      return new PatternPuzzle(ctx, def);
    case 'find-key':
      return new FindKey(ctx, def);
  }
}
