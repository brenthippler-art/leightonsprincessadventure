import Phaser from 'phaser';
import { TILE } from '../config';
import { loopAnim } from '../art/anim';
import { babyGiraffeTexture, giraffeMunchTexture } from '../art/giraffeArt';
import { cowTexture } from '../art/themes/farm';
import { crystalTexture } from '../art/themes/caves';
import { dragonTexture } from '../art/themes/castle';
import { LEVEL_TEX } from '../art/levelArt';
import { TK } from '../art/toolkitArt';
import { speak } from '../audio/Speech';
import { music } from '../audio/Music';
import { SONGS } from '../audio/songs';
import { sfx } from '../audio/sfx';
import { TEX } from '../art/uiArt';
import type { DecorDef } from '../levels/types';
import { sparkleBurst } from './fx';
import { cellBottom, cellTop, cellX, type LevelContext } from './LevelContext';

/**
 * DECOR: pictures and friendly characters that are never solid and never in the way.
 *  - signs teach with pictures only (rule 2: no reading needed)
 *  - background giraffes munch leaves
 *  - a baby giraffe follows her a few steps and cheers when she finds the jewel
 *  - a friendly cow moos when she walks by
 */
export interface Decor {
  tick(dt: number): void;
  /** Optional: where the wand sparkle can touch it, and what happens then. */
  wandArea?(): Phaser.Geom.Rectangle;
  onWand?(): void;
}

const still: Decor = { tick: () => {} };

/** Event LevelScene sends when the jewel is found (the baby giraffe listens for it). */
export const JEWEL_FOUND = 'jewel-found';
/** Event the dragon sends when he hands over the jewel: (x, y) where the jewel appears. */
export const DRAGON_GIFT = 'dragon-gift';

export function createDecor(ctx: LevelContext, def: DecorDef): Decor {
  const scene = ctx.scene;
  const x = cellX(def.col);
  const y = cellTop(def.row) + TILE / 2;
  switch (def.type) {
    case 'sign-move': {
      // The same right-arrow picture as the touch button, bouncing: "go this way".
      const img = scene.add.image(x, y, TEX.btnRight).setDepth(-2).setAlpha(0.9);
      scene.tweens.add({ targets: img, x: x + 8, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      return still;
    }
    case 'sign-jump': {
      // The jump-button picture hopping up: "jump here".
      const img = scene.add.image(x, y, TEX.btnJump).setDepth(-2).setAlpha(0.9);
      scene.tweens.add({ targets: img, y: y - 10, duration: 380, yoyo: true, repeat: -1, ease: 'Quad.Out' });
      return still;
    }
    case 'sign-swim': {
      // Jump button with three little up-arrows lighting in turn: "tap, tap, tap to swim up".
      scene.add.image(x, y, TEX.btnJump).setDepth(-2).setAlpha(0.9);
      const arrows = [0, 1, 2].map((i) => scene.add.image(x + 22, y + 10 - i * 12, TEX.iconJump).setDepth(-2).setAlpha(0.25));
      arrows.forEach((a, i) =>
        scene.tweens.add({ targets: a, alpha: 1, duration: 200, delay: i * 250, hold: 200, yoyo: true, repeat: -1, repeatDelay: 500 }),
      );
      return still;
    }
    case 'giraffe-munch': {
      const tex = giraffeMunchTexture(scene);
      scene.add.sprite(x, cellBottom(def.row), tex).setOrigin(0.5, 1).setDepth(-5).setFlipX(!!def.flip).play(loopAnim(scene, tex, 2));
      return still;
    }
    case 'baby-giraffe':
      return new BabyGiraffe(ctx, x, cellBottom(def.row), def.row);
    case 'cow':
      return new Cow(ctx, x, cellBottom(def.row), !!def.flip);
    case 'crystal': {
      // A glowing crystal cluster lighting the path, with a soft breathing glow behind it.
      const foot = cellBottom(def.row);
      const glow = scene.add.image(x, foot - 10, LEVEL_TEX.glow).setTint(0xc9f4ff).setDepth(-3).setScale(1.1).setAlpha(0.25);
      scene.tweens.add({ targets: glow, alpha: 0.45, scale: 1.35, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      const tex = crystalTexture(scene);
      scene.add.sprite(x, foot, tex).setOrigin(0.5, 1).setDepth(-2).play(loopAnim(scene, tex, 1.5));
      return still;
    }
    case 'dragon':
      return new Dragon(ctx, x, cellBottom(def.row));
  }
}

type BabyState = 'waiting' | 'following' | 'resting' | 'cheering';

/** A baby giraffe who trots after Leighton for a few steps, then waits, and cheers for the jewel. */
class BabyGiraffe implements Decor {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly startX: number;
  private state: BabyState = 'waiting';
  private readonly trot: string;

  constructor(
    private readonly ctx: LevelContext,
    x: number,
    foot: number,
    private readonly row: number,
  ) {
    const tex = babyGiraffeTexture(ctx.scene);
    this.trot = loopAnim(ctx.scene, tex, 8);
    this.sprite = ctx.scene.add.sprite(x, foot, tex, 0).setOrigin(0.5, 1).setDepth(15);
    this.startX = x;
    ctx.scene.events.once(JEWEL_FOUND, () => this.cheer());
  }

  tick(dt: number): void {
    const p = this.ctx.princess;
    const s = this.sprite;
    if (this.state === 'waiting' && Math.abs(p.x - s.x) < 3 * TILE) this.state = 'following';
    if (this.state === 'following') {
      const target = p.x - 22 * p.facing;
      const dx = target - s.x;
      const step = Math.sign(dx) * Math.min(Math.abs(dx), 80 * dt);
      const nextCol = Math.floor((s.x + step + Math.sign(dx) * 8) / TILE);
      const groundAhead = this.ctx.standableAt(nextCol, this.row + 1);
      if (Math.abs(dx) > 3 && groundAhead) {
        s.x += step;
        s.setFlipX(dx > 0); // the picture faces left; flip to face right
        if (!s.anims.isPlaying) s.play(this.trot);
      } else {
        s.anims.stop();
        s.setFrame(0);
      }
      // "A few steps" only: after 8 tiles she stops and waits for the jewel.
      if (Math.abs(s.x - this.startX) > 8 * TILE || !groundAhead) {
        this.state = 'resting';
        s.anims.stop();
        s.setFrame(0);
      }
    }
    if (this.state === 'resting') s.setFlipX(p.x > s.x);
  }

  private cheer(): void {
    this.state = 'cheering';
    const s = this.sprite;
    s.anims.stop();
    s.setFrame(2).setFlipX(this.ctx.princess.x > s.x);
    const scene = this.ctx.scene;
    scene.tweens.add({ targets: s, y: s.y - 8, duration: 220, yoyo: true, repeat: 6, ease: 'Quad.Out' });
    for (let i = 0; i < 4; i++) scene.time.delayedCall(i * 400, () => sparkleBurst(scene, s.x, s.y - 30, 6, 10));
  }
}

/** A friendly cow. When Leighton comes near she says "moooo" (and again every few seconds while she's close). */
class Cow implements Decor {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private cooldown = 0;

  constructor(
    private readonly ctx: LevelContext,
    x: number,
    foot: number,
    flip: boolean,
  ) {
    this.sprite = ctx.scene.add.sprite(x, foot, cowTexture(ctx.scene), 0).setOrigin(0.5, 1).setDepth(2).setFlipX(flip);
  }

  tick(dt: number): void {
    this.cooldown -= dt;
    const p = this.ctx.princess;
    if (this.cooldown > 0 || Math.abs(p.x - this.sprite.x) > 4 * TILE) return;
    this.cooldown = 6;
    sfx.moo();
    this.sprite.setFrame(1);
    sparkleBurst(this.ctx.scene, this.sprite.x + (this.sprite.flipX ? 12 : -12), this.sprite.y - 22, 5, 8);
    this.ctx.scene.time.delayedCall(900, () => this.sprite.setFrame(0));
  }
}

/**
 * THE FINALE DRAGON. A sleepy, grumpy little dragon sitting on the last jewel.
 * He never moves toward her and can never bonk her. Each wave of the wand that reaches him
 * makes him a bit happier; on the third he opens his arms for a hug (with hearts) and hands
 * over the Heart Jewel. If she has not thought of the wand, a wand-button picture appears above him.
 */
class Dragon implements Decor {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly hint: Phaser.GameObjects.Image;
  private waves = 0;
  private cooldown = 0;
  private nearTime = 0;
  private snoreTimer = 1;
  private spoke = false;
  private sleepyMusic = false;

  constructor(
    private readonly ctx: LevelContext,
    x: number,
    foot: number,
  ) {
    // He sits right on top of the jewel pedestal, hiding the jewel.
    this.sprite = ctx.scene.add.sprite(x + 4, foot, dragonTexture(ctx.scene), 0).setOrigin(0.5, 1).setDepth(16);
    this.hint = ctx.scene.add.image(x - 2, foot - 58, TEX.btnWand).setDepth(31).setAlpha(0).setScale(0.8);
    ctx.scene.tweens.add({ targets: this.hint, y: this.hint.y - 6, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  wandArea(): Phaser.Geom.Rectangle {
    return this.sprite.getBounds();
  }

  onWand(): void {
    if (this.waves >= 3 || this.cooldown > 0) return;
    this.cooldown = 0.6; // one wave counts once, even if lots of sparkles land
    this.waves++;
    const s = this.sprite;
    sfx.dragonHappy(this.waves);
    s.setFrame(this.waves);
    sparkleBurst(this.ctx.scene, s.x - 6, s.y - 26, 8 + this.waves * 2, 14);
    this.ctx.scene.tweens.add({ targets: s, scaleY: 1.06, duration: 120, yoyo: true });
    if (this.waves === 3) this.hug();
  }

  private hug(): void {
    const scene = this.ctx.scene;
    this.hint.setVisible(false);
    music.play(SONGS.dragonHappy, { fade: 0.6 });
    // Hearts (sparkle bursts) all around, then he hands over the jewel.
    for (let i = 0; i < 5; i++) scene.time.delayedCall(i * 250, () => sparkleBurst(scene, this.sprite.x - 10, this.sprite.y - 30, 10, 20));
    scene.time.delayedCall(1400, () => scene.events.emit(DRAGON_GIFT, this.sprite.x - 16, this.sprite.y - 24));
  }

  tick(dt: number): void {
    this.cooldown -= dt;
    if (this.waves >= 3) return;
    const p = this.ctx.princess;
    const near = Math.abs(p.x - this.sprite.x) < 8 * TILE;
    // When she reaches the throne room, the music changes to his sleepy tune.
    if (near && !this.sleepyMusic) {
      this.sleepyMusic = true;
      music.play(SONGS.dragonSleepy, { fade: 1.5 });
    }
    // Little snore bubbles while he is still sleepy.
    this.snoreTimer -= dt;
    if (this.waves === 0 && this.snoreTimer <= 0) {
      this.snoreTimer = 2;
      if (near) sfx.snore();
      const b = this.ctx.scene.add.image(this.sprite.x - 14, this.sprite.y - 30, TK.bubble).setDepth(17);
      this.ctx.scene.tweens.add({ targets: b, y: b.y - 16, x: b.x - 4, alpha: 0, scale: 1.8, duration: 1600, onComplete: () => b.destroy() });
    }
    // The wand-button picture appears if she has been near him a while (and the voice hint, if on).
    if (near) this.nearTime += dt;
    if (this.nearTime > 4 && this.hint.alpha === 0) this.ctx.scene.tweens.add({ targets: this.hint, alpha: 1, duration: 400 });
    if (this.nearTime > 10 && !this.spoke) {
      this.spoke = true;
      speak('Wave your wand at the dragon!');
    }
  }
}
