import Phaser from 'phaser';
import { LEVEL_TOP, TILE_SIZE } from '../constants';
import type { Skin } from '../art/themes/types';
import type { Princess } from './Princess';

/**
 * Everything a placeable piece (obstacle, barrier, puzzle) needs to know about the level it's in.
 * LevelScene builds one of these and hands it to every piece.
 */
export interface LevelContext {
  scene: Phaser.Scene;
  princess: Princess;
  /** The ground/platform tiles (for things that need to collide with the ground). */
  layer: Phaser.Tilemaps.TilemapLayer;
  /** Extra solid things (walls, gates, bridges). Princess, blocks and boxes all collide with these. */
  solids: Phaser.Physics.Arcade.StaticGroup;
  /** Is there ground or a platform tile at this cell? */
  standableAt: (col: number, row: number) => boolean;
  /** Which pictures this level's theme uses for each piece (missing ones use the placeholders). */
  skin: Skin;
}

/** Handy cell-to-pixel helpers. */
export const cellX = (col: number): number => col * TILE_SIZE + TILE_SIZE / 2;
export const cellTop = (row: number): number => LEVEL_TOP + row * TILE_SIZE;
export const cellBottom = (row: number): number => LEVEL_TOP + (row + 1) * TILE_SIZE;

/** The y of the first standable surface at or below `row` in `col` (or null if it's a bottomless gap). */
export function groundBelow(ctx: LevelContext, col: number, row: number): number | null {
  for (let r = row; r < 11; r++) if (ctx.standableAt(col, r)) return cellTop(r);
  return null;
}

/** A gentle side-to-side shake (used for "hmm, not that one"). Never scary. */
export function gentleShake(scene: Phaser.Scene, targets: Phaser.GameObjects.GameObject[]): void {
  for (const t of targets) {
    const obj = t as Phaser.GameObjects.Image;
    if (!obj.active) continue;
    scene.tweens.add({ targets: obj, x: obj.x + 2, duration: 50, yoyo: true, repeat: 3, ease: 'Sine.InOut' });
  }
}
