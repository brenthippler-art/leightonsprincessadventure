import Phaser from 'phaser';
import { TEX } from '../art/uiArt';
import { LEVEL_TEX } from '../art/levelArt';
import { comfort } from '../systems/Comfort';

/**
 * Little visual effects made of sparkles. All are fire-and-forget: they clean themselves up.
 *
 * Comfort and speed:
 *  - "Reduce flashing" (parent setting) halves the number of sparkles and makes them softer.
 *  - A sparkle BUDGET caps how many exist at once, so busy moments stay smooth on older iPads.
 */

const FX_DEPTH = 40;
/** Never more than this many sparkle pictures alive at the same time. */
const MAX_LIVE = 60;
let live = 0;

function spawn(scene: Phaser.Scene, x: number, y: number, texture: string): Phaser.GameObjects.Image | null {
  if (live >= MAX_LIVE) return null;
  live++;
  const img = scene.add.image(x, y, texture).setDepth(FX_DEPTH);
  if (comfort.reduceFlashing) img.setAlpha(0.6);
  img.once(Phaser.GameObjects.Events.DESTROY, () => live--);
  return img;
}

/** One tiny twinkle that shrinks and fades. */
export function twinkle(scene: Phaser.Scene, x: number, y: number, duration = 250): void {
  if (comfort.reduceFlashing && Math.random() < 0.5) return;
  const s = spawn(scene, x, y, TEX.sparkle);
  if (!s) return;
  scene.tweens.add({ targets: s, alpha: 0, scale: 0.4, duration, onComplete: () => s.destroy() });
}

/** A ring of twinkles flying outward. */
export function sparkleBurst(scene: Phaser.Scene, x: number, y: number, count = 8, radius = 14): void {
  const n = comfort.reduceFlashing ? Math.ceil(count / 2) : count;
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n;
    const s = spawn(scene, x, y, TEX.sparkle);
    if (!s) return;
    scene.tweens.add({
      targets: s,
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius,
      alpha: 0,
      duration: 350 + radius * 5,
      ease: 'Quad.Out',
      onComplete: () => s.destroy(),
    });
  }
}

/** The soft "poof" when she bonks: a puff of light plus a big ring of sparkles. Never scary. */
export function sparklePoof(scene: Phaser.Scene, x: number, y: number): void {
  const puff = spawn(scene, x, y, LEVEL_TEX.glow);
  if (puff) {
    puff.setScale(0.5).setAlpha(comfort.reduceFlashing ? 0.45 : 0.9);
    scene.tweens.add({ targets: puff, scale: 1.6, alpha: 0, duration: 450, ease: 'Quad.Out', onComplete: () => puff.destroy() });
  }
  sparkleBurst(scene, x, y, 12, 22);
}
