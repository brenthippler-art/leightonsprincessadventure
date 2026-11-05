import Phaser from 'phaser';
import { CSS } from '../constants';
import { addTexture, drawRows, makeCanvas } from './pixels';

/** Code-drawn effect sprites: the wand's flying sparkle. */
export const EFFECTS = {
  sparkleShot: 'sparkle-shot',
  sparkleShotAnim: 'sparkle-shot-twinkle',
} as const;

/** Two 7x7 frames: a "+" star and an "x" star. Swapping them makes it twinkle. */
const SHOT_FRAMES = [
  ['...w...', '...g...', '..gwg..', 'wgwwwgw', '..gwg..', '...g...', '...w...'],
  ['w.....w', '.g...g.', '..gwg..', '..www..', '..gwg..', '.g...g.', 'w.....w'],
];

export function generateEffectsArt(scene: Phaser.Scene): void {
  const [canvas, ctx] = makeCanvas(7 * SHOT_FRAMES.length, 7);
  SHOT_FRAMES.forEach((rows, i) => drawRows(ctx, rows, { w: CSS.white, g: CSS.gold }, i * 7, 0));
  addTexture(scene, EFFECTS.sparkleShot, canvas);
  const tex = scene.textures.get(EFFECTS.sparkleShot);
  SHOT_FRAMES.forEach((_, i) => tex.add(i, 0, i * 7, 0, 7, 7));

  if (scene.anims.exists(EFFECTS.sparkleShotAnim)) scene.anims.remove(EFFECTS.sparkleShotAnim);
  scene.anims.create({
    key: EFFECTS.sparkleShotAnim,
    frames: [0, 1].map((frame) => ({ key: EFFECTS.sparkleShot, frame })),
    frameRate: 12,
    repeat: -1,
  });
}
