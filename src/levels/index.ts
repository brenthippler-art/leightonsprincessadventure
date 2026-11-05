import type { LevelData } from './types';
import { level00Test } from './level00-test';
import { level00Toolkit } from './level00-toolkit';
import { level01 } from './level01';
import { level02 } from './level02';
import { level03 } from './level03';
import { level04 } from './level04';
import { level05 } from './level05';
import { level06 } from './level06';
import { level07 } from './level07';
import { level08 } from './level08';
import { level09 } from './level09';
import { level10 } from './level10';
import { level11 } from './level11';
import { level12 } from './level12';

/** All 12 real levels, in order (level 1 first). */
export const LEVELS: LevelData[] = [
  level01,
  level02,
  level03,
  level04,
  level05,
  level06,
  level07,
  level08,
  level09,
  level10,
  level11,
  level12,
];

/** Every level including the test levels (id 0 = playground, id 90 = toolkit), for looking one up by id. */
const ALL: LevelData[] = [level00Test, level00Toolkit, ...LEVELS];

export function getLevel(id: number): LevelData {
  return ALL.find((l) => l.id === id) ?? level01;
}

/** The first level whose jewel hasn't been found yet (or the last level, if all are found). */
export function firstUnfinishedLevel(jewels: boolean[]): number {
  const level = LEVELS.find((l) => !jewels[l.id - 1]);
  return (level ?? LEVELS[LEVELS.length - 1]).id;
}

/** The level after this one (or the same one if it's the last that exists so far). */
export function nextLevelId(id: number): number {
  const i = LEVELS.findIndex((l) => l.id === id);
  if (i < 0) return id;
  return LEVELS[Math.min(i + 1, LEVELS.length - 1)].id;
}

export { ALL as ALL_LEVELS };
