import { GAME_WIDTH, LEVEL_ROWS, TILE_SIZE } from '../constants';
import { MAX_OBSTACLE_SPEED, PRINCESS, TOOLKIT } from '../config';
import { isStandable, KNOWN_CHARS, T, type LevelData } from './types';
import { isUnderwater } from '../art/themes';

/**
 * The difficulty ramp for the 12 real levels (test levels have no rules).
 * maxGap: widest gap in tiles. screens: allowed width. puzzles: how many. types: different obstacle kinds.
 */
const RAMP = [
  { from: 1, to: 4, maxGap: 2, screens: [7, 9], puzzles: [1, 1], types: [2, 3] },
  { from: 5, to: 8, maxGap: 3, screens: [9, 11], puzzles: [2, 2], types: [2, 4] },
  { from: 9, to: 12, maxGap: 3, screens: [11, 13], puzzles: [2, 3], types: [2, 4] },
];
/** Checkpoints at least every 2 screens (with a little slack). */
const MAX_CHECKPOINT_SPACING = 44;
/** The first screen must be calm: no obstacles, puzzles or gaps. */
const WARM_UP_COLS = 20;

/**
 * LEVEL CHECKER (development only)
 *
 * Looks for mistakes in a level's data and returns a list of plain-English warnings.
 * It runs automatically during `npm run dev` (never in the real build): warnings appear
 * in the browser console (F12) and in a small red box at the top of the game screen.
 */

/** How high and how far she can jump, worked out from the numbers in src/config.ts. */
export function jumpReach(): { height: number; distance: number } {
  const c = PRINCESS;
  const height = (c.jumpSpeed * c.jumpSpeed) / (2 * c.gravityRisingHeld);
  const riseTime = c.jumpSpeed / c.gravityRisingHeld;
  const fallTime = Math.sqrt((2 * height) / c.gravityFalling);
  // Distance covered at full run speed while in the air (taking off and landing at the same height).
  const distance = c.runSpeed * (riseTime + fallTime);
  return { height, distance };
}

/** A gap is "tricky for a 4-year-old" if it needs more than this share of her full jump. */
const COMFORT = 0.6;

export function validateLevel(level: LevelData): string[] {
  const warnings: string[] = [];
  const warn = (msg: string) => warnings.push(msg);
  const grid = level.grid;
  const width = grid[0]?.length ?? 0;
  const at = (col: number, row: number) => grid[row]?.[col];

  // ---- Shape ----
  if (grid.length !== LEVEL_ROWS) warn(`has ${grid.length} rows; every level needs exactly ${LEVEL_ROWS}.`);
  grid.forEach((row, i) => {
    if (row.length !== width) warn(`row ${i} is ${row.length} characters long, but row 0 is ${width}.`);
    for (const ch of row) if (!KNOWN_CHARS.has(ch)) warn(`row ${i} has an unknown character '${ch}'.`);
  });
  const screens = (width * TILE_SIZE) / GAME_WIDTH;
  const rules = RAMP.find((r) => level.id >= r.from && level.id <= r.to);
  if (rules && (screens < rules.screens[0] || screens > rules.screens[1]))
    warn(`is ${screens.toFixed(1)} screens wide; levels ${rules.from}-${rules.to} should be ${rules.screens[0]} to ${rules.screens[1]}.`);
  if (rules) {
    const n = level.puzzles.length;
    if (n < rules.puzzles[0] || n > rules.puzzles[1])
      warn(`has ${n} puzzle(s); levels ${rules.from}-${rules.to} should have ${rules.puzzles.join(' to ')}.`);
    const kinds = new Set(level.obstacles.map((o) => o.type)).size;
    if (kinds < rules.types[0] || kinds > rules.types[1])
      warn(`uses ${kinds} kinds of obstacle; levels ${rules.from}-${rules.to} should use ${rules.types.join(' to ')}.`);
  }

  // ---- Start, checkpoints, jewel ----
  const find = (ch: string) =>
    grid.flatMap((row, r) => Array.from(row).flatMap((c, col) => (c === ch ? [{ col, row: r }] : [])));
  const starts = find(T.start);
  const jewels = find(T.jewel);
  if (starts.length === 0) warn(`has no start 'S'.`);
  if (starts.length > 1) warn(`has ${starts.length} starts 'S'; only the first is used.`);
  if (jewels.length === 0) warn(`has no jewel 'J'.`);
  if (jewels.length > 1) warn(`has ${jewels.length} jewels 'J'; only one is expected.`);
  for (const ch of [T.start, T.checkpoint, T.jewel]) {
    for (const p of find(ch)) {
      if (!isStandable(at(p.col, p.row + 1)))
        warn(`'${ch}' at column ${p.col}, row ${p.row} isn't standing on ground (put it right above '#' or '=').`);
    }
  }
  for (const j of jewels) {
    if (j.col < width - GAME_WIDTH / TILE_SIZE)
      warn(`the jewel at column ${j.col} isn't on the last screen; it should be near the right end.`);
  }

  // ---- Gaps she can't jump over ----
  // A "pit" is a run of columns with nothing to stand on at any height.
  // Moving platforms (their whole path), clouds and push-block bridges count as something to stand on.
  const bridged = new Set<number>();
  const cover = (from: number, count: number) => {
    for (let c = from; c < from + count; c++) bridged.add(c);
  };
  for (const b of level.barriers) {
    if (b.type === 'moving-platform') cover(b.col, (b.width ?? 2) + (b.axis === 'x' ? b.distance : 0));
    if (b.type === 'cloud') cover(b.col, b.width ?? 3);
    if (b.type === 'vine') {
      const reach = Math.ceil((b.length ?? 4) * Math.sin(((b.swing ?? 30) * Math.PI) / 180));
      cover(b.col - reach, (b.width ?? 2) + reach * 2);
    }
  }
  for (const p of level.puzzles) if (p.type === 'push-block') cover(p.bridgeCol, p.bridgeWidth);
  const { height, distance } = jumpReach();
  const maxGap = Math.floor(distance / TILE_SIZE);
  const comfyGap = Math.floor((distance * COMFORT) / TILE_SIZE);
  let runStart = -1;
  for (let col = 0; col <= width; col++) {
    const hasFloor = col < width && (bridged.has(col) || grid.some((row) => isStandable(row[col])));
    if (!hasFloor && runStart < 0) runStart = col;
    if (hasFloor && runStart >= 0) {
      const gap = col - runStart;
      if (runStart === 0) warn(`starts with a pit at column 0; she needs ground at the left edge.`);
      else if (rules && runStart < WARM_UP_COLS) warn(`has a gap at column ${runStart}, inside the calm first screen.`);
      else if (gap > maxGap)
        warn(`the gap at columns ${runStart}-${col - 1} is ${gap} tiles wide; her jump only reaches about ${maxGap}.`);
      else if (rules && gap > rules.maxGap)
        warn(`the gap at columns ${runStart}-${col - 1} is ${gap} tiles wide; levels ${rules.from}-${rules.to} keep gaps to ${rules.maxGap}.`);
      else if (!rules && gap > comfyGap)
        warn(`the gap at columns ${runStart}-${col - 1} is ${gap} tiles wide: possible, but tricky for a 4-year-old (keep gaps to ${comfyGap} or less).`);
      runStart = -1;
    }
    if (col === width && runStart >= 0 && runStart < width) warn(`ends in a pit; the right end needs ground.`);
  }

  // ---- Walls too tall to jump up ----
  // Compare the height of the main ground (the '#' stack rising from the bottom row) in neighboring columns.
  const groundTop = (col: number): number | null => {
    if (at(col, LEVEL_ROWS - 1) !== T.ground) return null;
    let row = LEVEL_ROWS - 1;
    while (row > 0 && at(col, row - 1) === T.ground) row--;
    return row;
  };
  const maxStep = Math.floor((height - 4) / TILE_SIZE);
  // A bounce pad or an up-and-down platform just before a tall wall is the way up, so that's fine.
  const underwater = isUnderwater(level.theme); // she can swim up anything
  const liftNear = (col: number) =>
    underwater ||
    level.barriers.some(
      (b) =>
        ((b.type === 'bounce-pad' || b.type === 'bubbles' || (b.type === 'moving-platform' && b.axis === 'y')) && b.col < col && col - b.col <= 4) ||
        (b.type === 'giraffe' && Math.abs(b.col + b.length + 2 - col) <= 1),
    );
  for (let col = 1; col < width; col++) {
    const a = groundTop(col - 1);
    const b = groundTop(col);
    if (a !== null && b !== null && a - b > maxStep && !liftNear(col))
      warn(`the wall at column ${col} is ${a - b} tiles tall; she can only jump up ${maxStep}.`);
  }

  // ---- Obstacles: never faster than half her run speed ----
  for (const o of level.obstacles) {
    const tilesPerSec =
      o.type === 'walker' || o.type === 'roller' || o.type === 'dropper'
        ? o.speed
        : o.type === 'flyer'
          ? ((o.amplitude ?? TOOLKIT.flyerAmplitude) * 2 * Math.PI) / (o.period ?? TOOLKIT.flyerPeriod)
          : undefined;
    if (tilesPerSec !== undefined && tilesPerSec * TILE_SIZE > MAX_OBSTACLE_SPEED)
      warn(`${o.type} at column ${o.col} is set faster than half her run speed; the game will slow it down to the limit.`);
  }

  // ---- Puzzles: sensible settings, and a gate with ground under it ----
  const hasGround = (col: number) => grid.some((row) => isStandable(row[col]));
  for (const p of level.puzzles) {
    if ('gateCol' in p) {
      if (!hasGround(p.gateCol)) warn(`the ${p.type} gate at column ${p.gateCol} has no ground under it.`);
      if (p.gateCol <= p.col) warn(`the ${p.type} gate at column ${p.gateCol} should be to the right of its puzzle (column ${p.col}).`);
    }
    if (p.type === 'count' && (p.count < 1 || p.count > 5)) warn(`count puzzle at column ${p.col} asks for ${p.count}; use 1 to 5.`);
    if (p.type === 'pattern' && (p.order.length < 1 || p.order.length > 3))
      warn(`pattern puzzle at column ${p.col} has ${p.order.length} notes; use 1 to 3.`);
    if (p.type === 'pattern' && p.order.some((b) => b >= (p.bells ?? 3)))
      warn(`pattern puzzle at column ${p.col} uses a bell number that isn't there (it has ${p.bells ?? 3} bells: 0 to ${(p.bells ?? 3) - 1}).`);
    if (p.type === 'color-match' && p.choices && !p.choices.includes(p.answer))
      warn(`color-match at column ${p.col}: the answer '${p.answer}' isn't one of the buttons.`);
    if (p.type === 'shape-match' && p.shapes && !p.shapes.includes(p.answer))
      warn(`shape-match at column ${p.col}: the answer '${p.answer}' isn't one of the blocks.`);
    if (p.type === 'push-block' && !(p.col < p.switchCol && p.switchCol < p.bridgeCol))
      warn(`push-block at column ${p.col}: put the box, then the switch, then the bridge gap, left to right.`);
  }

  // ---- Everything must be inside the map, and not on top of the start ----
  for (const o of [...level.obstacles, ...level.barriers, ...level.puzzles]) {
    if (o.col < 0 || o.col >= width || o.row < 0 || o.row >= LEVEL_ROWS)
      warn(`${o.type} at column ${o.col}, row ${o.row} is outside the map.`);
    for (const s of starts)
      if (Math.abs(o.col - s.col) < 4 && level.obstacles.includes(o as never))
        warn(`${o.type} at column ${o.col} is very close to the start; give her a few calm steps first.`);
  }

  if (rules) {
    // ---- Calm first screen ----
    for (const o of [...level.obstacles, ...level.puzzles])
      if (o.col < WARM_UP_COLS) warn(`${o.type} at column ${o.col} is on the first screen, which should be calm.`);

    // ---- First of each obstacle kind is a "practice" one ----
    const firsts = new Map<string, (typeof level.obstacles)[number]>();
    for (const o of [...level.obstacles].sort((a, b) => a.col - b.col)) if (!firsts.has(o.type)) firsts.set(o.type, o);
    for (const o of firsts.values())
      if (!o.practice) warn(`the first ${o.type} (column ${o.col}) should be practice: true, so she can learn it safely.`);

    // ---- A checkpoint at least every 2 screens ----
    const stops = [...starts, ...find(T.checkpoint), ...jewels].map((p) => p.col).sort((a, b) => a - b);
    for (let i = 1; i < stops.length; i++)
      if (stops[i] - stops[i - 1] > MAX_CHECKPOINT_SPACING)
        warn(`columns ${stops[i - 1]} to ${stops[i]} have no checkpoint; add a 'C' at least every 2 screens.`);
  }

  return warnings.map((w) => `Level ${level.id} "${level.name}": ${w}`);
}
