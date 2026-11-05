import Phaser from 'phaser';
import { GAME_HEIGHT, LEVEL_TOP, TILE_SIZE } from '../constants';
import { GENTLE_RESET as R } from '../config';
import { TEX } from '../art/uiArt';
import { sfx } from '../audio/sfx';
import { sparkleBurst, sparklePoof } from '../objects/fx';
import type { Obstacle } from '../objects/Obstacle';
import type { Princess } from '../objects/Princess';

/**
 * THE GENTLE RESET (rule 1: there is no losing)
 *
 * 1. Every frame she's standing somewhere truly safe, remember that spot.
 * 2. If she bonks into an obstacle or falls off the screen: soft boing, sparkle poof,
 *    a half-second pause, then she reappears at the remembered spot and blinks for
 *    2 seconds, during which nothing can bonk her. Nothing she collected is lost.
 * 3. If she keeps landing back at the same spot (3 times), the game quietly helps:
 *    nearby obstacles slow to half speed and a big bouncing arrow shows the way.
 *    The help switches off once she gets past.
 */

/** A place she can stand: x = her center, bottom = the ground line under her feet. */
export interface Spot {
  x: number;
  bottom: number;
}

export interface GentleResetDeps {
  scene: Phaser.Scene;
  princess: Princess;
  obstacles: Obstacle[];
  /** Is there ground or a platform at this tile? */
  standableAt: (col: number, row: number) => boolean;
  start: Spot;
  /** Glide the camera to show this spot (while she's poofed). */
  panCameraTo: (x: number, ms: number) => void;
  /** Go back to following her normally. */
  followPrincess: () => void;
}

interface Help {
  clearX: number;
  slowed: Obstacle[];
  arrow: Phaser.GameObjects.Image;
}

export class GentleReset {
  /** The most recent truly safe spot. Starts at the 'S' tile. */
  safe: Spot;
  respawning = false;
  /** Set false at the end of a level to stop everything. */
  active = true;

  private bonkSpot: { x: number; count: number } | null = null;
  private help: Help | null = null;

  constructor(private readonly d: GentleResetDeps) {
    this.safe = { ...d.start };
  }

  /** Call once per frame. */
  update(): void {
    if (!this.active || this.respawning) return;
    const p = this.d.princess;

    // Fell below the screen? (She never "dies"; she just pops back.)
    if (p.body.top > GAME_HEIGHT) {
      this.bonk();
      return;
    }

    if (p.onGround && this.isSafeHere()) {
      this.safe = { x: p.x, bottom: p.body.bottom };
      this.checkHelpFinished();
    }
  }

  /** A checkpoint flag is always a safe spot. */
  reachedCheckpoint(spot: Spot): void {
    this.safe = { ...spot };
    this.checkHelpFinished();
  }

  /**
   * Is where she's standing right now a good place to come back to?
   *  - solid ground continues a bit past BOTH sides of her feet (not on a ledge edge), and
   *  - no obstacle (or the path of a moving one) is close by.
   */
  private isSafeHere(): boolean {
    const b = this.d.princess.body;
    const rowBelow = Math.floor((b.bottom - LEVEL_TOP + 1) / TILE_SIZE);
    const firstCol = Math.floor((b.left - R.ledgeMargin) / TILE_SIZE);
    const lastCol = Math.floor((b.right + R.ledgeMargin) / TILE_SIZE);
    for (let col = firstCol; col <= lastCol; col++) {
      if (!this.d.standableAt(col, rowBelow)) return false;
    }

    const m = R.obstacleMargin;
    const around = new Phaser.Geom.Rectangle(b.left - m, b.top - m, b.width + m * 2, b.height + m * 2);
    return !this.d.obstacles.some((o) => {
      const zone = o.dangerZone();
      return zone !== null && Phaser.Geom.Rectangle.Overlaps(around, zone);
    });
  }

  /** She touched an obstacle or fell. Poof, pause, reappear safely. */
  bonk(): void {
    const { scene, princess: p } = this.d;
    if (!this.active || this.respawning || p.frozen || p.isSafeBlinking) return;
    this.respawning = true;

    sfx.boing();
    sparklePoof(scene, p.x, Math.min(p.y, GAME_HEIGHT - 12));
    p.freeze();

    const target = { ...this.safe };
    this.countBonk(target);
    if (import.meta.env.DEV) scene.events.emit('debug-bonk', target.x); // for the dev-only debug overlay

    const freezeMs = R.freezeTime * 1000;
    this.d.panCameraTo(target.x, freezeMs * 0.9);
    scene.time.delayedCall(freezeMs, () => {
      // Her sprite's center is 12 px above her feet; appear 1 px above the ground and settle.
      p.teleport(target.x, target.bottom - 13, false);
      p.facing = 1;
      p.unfreeze(R.safeBlinkTime);
      sfx.appear();
      sparkleBurst(scene, p.x, p.y, 8, 10);
      this.d.followPrincess();
      this.respawning = false;
    });
  }

  /** A practice obstacle: just a soft boing and a little push back. No poof, no reset, no counting. */
  nudge(fromX: number): void {
    const p = this.d.princess;
    if (!this.active || this.respawning || p.frozen || p.isSafeBlinking) return;
    sfx.boing();
    p.nudge(fromX);
  }

  /** Count bonks that send her back to (about) the same spot. Three in a row: switch on help. */
  private countBonk(target: Spot): void {
    if (this.bonkSpot && Math.abs(this.bonkSpot.x - target.x) <= R.sameSpotDistance) this.bonkSpot.count++;
    else this.bonkSpot = { x: target.x, count: 1 };

    if (this.bonkSpot.count >= R.bonksBeforeHelp && !this.help) this.startHelp(target);
  }

  private startHelp(spot: Spot): void {
    const { scene, obstacles } = this.d;
    // Slow down every obstacle whose path is near the tricky part (just behind, to a good way ahead).
    const slowed = obstacles.filter((o) => {
      const z = o.dangerZone();
      return z !== null && z.right >= spot.x - 2 * TILE_SIZE && z.x <= spot.x + R.helpRange;
    });
    for (const o of slowed) o.speedScale = R.helpSlowFactor;

    // The help ends once her safe spot is past the tricky part AND past every slowed obstacle.
    const clearX = Math.max(spot.x + R.helpClearDistance, ...slowed.map((o) => (o.dangerZone()?.right ?? 0) + TILE_SIZE));

    // A big gold arrow that bounces toward the way to go.
    const arrow = scene.add.image(spot.x + 3 * TILE_SIZE, spot.bottom - 44, TEX.helpArrow).setDepth(30).setScale(0);
    scene.tweens.add({ targets: arrow, scale: 1, duration: 300, ease: 'Back.Out' });
    scene.tweens.add({ targets: arrow, x: arrow.x + 8, duration: 350, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    this.help = { clearX, slowed, arrow };
  }

  private checkHelpFinished(): void {
    const help = this.help;
    if (!help || this.safe.x < help.clearX) return;
    for (const o of help.slowed) o.speedScale = 1;
    this.d.scene.tweens.killTweensOf(help.arrow);
    this.d.scene.tweens.add({
      targets: help.arrow,
      alpha: 0,
      scale: 0.5,
      duration: 300,
      onComplete: () => help.arrow.destroy(),
    });
    this.help = null;
    this.bonkSpot = null;
  }

  /** For testing: is the extra help switched on right now? */
  get helping(): boolean {
    return this.help !== null;
  }
}
