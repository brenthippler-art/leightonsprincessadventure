import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, JEWEL_COLORS, JEWEL_NAMES, SCENES } from '../constants';
import { CROWN_SOCKETS, LEVEL_TEX } from '../art/levelArt';
import { PRINCESS_ANIMS, PRINCESS_TEXTURE } from '../art/princess';
import { jewelTexture } from '../art/themes';
import { music } from '../audio/Music';
import { sfx } from '../audio/sfx';
import { SONGS } from '../audio/songs';
import { speak } from '../audio/Speech';
import { controls } from '../input/Controls';
import { getLevel } from '../levels';
import { sparkleBurst, twinkle } from '../objects/fx';
import { loadSave } from '../save/Save';

/**
 * CROWN MOMENT: after each jewel, a short celebration. The big crown (with the jewels found
 * before) is at the top; the new jewel rises from Leighton's hands and flies into its slot with a
 * sparkle burst and a jingle, while she cheers. Optional spoken line: "You found the Ruby!"
 * Then on to the map (walking to the newly unlocked land), or, after the Heart Jewel, the ending.
 *
 * Scene data: { levelId: number }  (the level she just finished; its jewel is already saved)
 */
const SCALE = 4;

export class CrownScene extends Phaser.Scene {
  private levelId = 1;
  private ready = false;
  private leaving = false;

  constructor() {
    super(SCENES.crown);
  }

  init(data: { levelId?: number }): void {
    this.levelId = Phaser.Math.Clamp(data.levelId ?? 1, 1, 12);
    this.ready = false;
    this.leaving = false;
  }

  create(): void {
    const slot = this.levelId - 1;
    this.cameras.main.setBackgroundColor(0xfff0f6);
    this.time.addEvent({ delay: 200, loop: true, callback: () => twinkle(this, Phaser.Math.Between(10, 310), Phaser.Math.Between(10, 170), 600) });

    // The big crown, with every jewel found so far EXCEPT the new one (that one is about to fly in).
    const x0 = GAME_WIDTH / 2 - 22 * SCALE;
    const y0 = 6;
    this.add.image(x0, y0, LEVEL_TEX.crown).setOrigin(0).setScale(SCALE);
    loadSave().jewels.forEach((found, i) => {
      if (!found || i === slot) return;
      const [sx, sy] = CROWN_SOCKETS[i];
      this.add.image(x0 + sx * SCALE, y0 + sy * SCALE, LEVEL_TEX.jewelMini).setOrigin(0).setScale(SCALE).setTint(JEWEL_COLORS[i]);
    });

    const leighton = this.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 6, PRINCESS_TEXTURE).setOrigin(0.5, 1).setScale(2.5).play(PRINCESS_ANIMS.cheer);
    this.tweens.add({ targets: leighton, y: leighton.y - 6, duration: 260, yoyo: true, repeat: -1, ease: 'Quad.Out' });

    // The new jewel rises from her hands and swoops into its socket.
    const [sx, sy] = CROWN_SOCKETS[slot];
    const target = { x: x0 + (sx + 2) * SCALE, y: y0 + (sy + 2) * SCALE };
    const gem = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 70, jewelTexture(this, getLevel(this.levelId).theme)).setScale(3).setDepth(5);
    const glow = this.add.image(gem.x, gem.y, LEVEL_TEX.glow).setTint(JEWEL_COLORS[slot]).setScale(2).setAlpha(0.6).setDepth(4);
    this.tweens.add({ targets: [gem, glow], y: '-=8', duration: 500, yoyo: true, ease: 'Sine.InOut' });
    this.time.delayedCall(1000, () => {
      this.tweens.add({ targets: glow, alpha: 0, duration: 400 });
      this.tweens.add({
        targets: gem,
        x: target.x,
        y: target.y,
        scale: 1.2,
        duration: 900,
        ease: 'Sine.InOut',
        onComplete: () => {
          gem.destroy();
          this.add.image(target.x, target.y, LEVEL_TEX.jewelMini).setScale(SCALE).setTint(JEWEL_COLORS[slot]);
          sparkleBurst(this, target.x, target.y, 14, 26);
          sfx.jewel();
          music.play(SONGS.jewelFound, { fade: 0.2 });
          speak(`You found the ${JEWEL_NAMES[slot]}!`);
          this.time.delayedCall(1200, () => (this.ready = true));
          this.time.delayedCall(4500, () => this.next());
        },
      });
    });

    this.input.on(Phaser.Input.Events.POINTER_UP, () => this.next());
    this.cameras.main.fadeIn(400, 42, 20, 56);
  }

  update(): void {
    if (controls.justPressed('jump') || controls.justPressed('wand')) this.next();
  }

  private next(): void {
    if (!this.ready || this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(400, 42, 20, 56);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      if (this.levelId === 12) this.scene.start(SCENES.ending);
      else this.scene.start(SCENES.map, { levelId: this.levelId + 1, walkFrom: this.levelId });
    });
  }
}
