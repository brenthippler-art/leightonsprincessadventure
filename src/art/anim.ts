import Phaser from 'phaser';

/**
 * Make (once) and return a looping animation that plays every frame of a texture strip.
 * Theme sprites are 2-frame strips, so any piece can animate any skin without extra setup.
 */
export function loopAnim(scene: Phaser.Scene, texture: string, frameRate: number): string {
  const key = `${texture}-loop-${frameRate}`;
  if (!scene.anims.exists(key)) {
    const names = scene.textures
      .get(texture)
      .getFrameNames()
      .map(Number)
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
    const frames = names.length ? names.map((frame) => ({ key: texture, frame })) : [{ key: texture }];
    scene.anims.create({ key, frames, frameRate, repeat: -1 });
  }
  return key;
}
