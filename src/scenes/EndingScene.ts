import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, JEWEL_COLORS, SCENES } from '../constants';
import { comfort } from '../systems/Comfort';
import { babyGiraffeTexture } from '../art/giraffeArt';
import { CROWN_SOCKETS, LEVEL_TEX } from '../art/levelArt';
import { MAP_TEX } from '../art/mapArt';
import { FRAMES, PRINCESS_ANIMS, PRINCESS_TEXTURE } from '../art/princess';
import { prepareTheme, themeSkin } from '../art/themes';
import { dragonTexture } from '../art/themes/castle';
import { cowTexture } from '../art/themes/farm';
import { music } from '../audio/Music';
import { sfx } from '../audio/sfx';
import { SONGS } from '../audio/songs';
import { speak } from '../audio/Speech';
import { controls } from '../input/Controls';
import { sparkleBurst, twinkle } from '../objects/fx';

/**
 * THE ENDING (after the Heart Jewel), in the castle throne room:
 *   1. All 12 jewels spiral into the crown.
 *   2. The crown floats down onto Leighton's head.
 *   3. She walks up to her throne.
 *   4. Fireworks and confetti; friendly creatures from every land (and the little dragon) wave and
 *      hop in the crowd; the ending fanfare plays; optional spoken line.
 *   5. A final screen: the full crown and a big star. Tap to go back to the map and replay favorite lands.
 */
const CROWN_SCALE = 2.5;

export class EndingScene extends Phaser.Scene {
  private phase: 'show' | 'final' | 'leaving' = 'show';
  private canSkip = false;
  private crown!: Phaser.GameObjects.Container;
  private leighton!: Phaser.GameObjects.Sprite;
  private crownOnHead = false;

  constructor() {
    super(SCENES.ending);
  }

  create(): void {
    this.phase = 'show';
    this.canSkip = false;
    this.crownOnHead = false;
    music.play(SONGS.ending);

    // The castle throne room (the castle level's own background) with a royal carpet.
    const { textures } = prepareTheme(this, 'castle');
    this.add.image(0, 0, textures.far).setOrigin(0);
    this.add.image(0, GAME_HEIGHT - 90, textures.middle).setOrigin(0);
    this.add.rectangle(0, 150, GAME_WIDTH, 30, 0xd83a5a).setOrigin(0);
    this.add.rectangle(0, 150, GAME_WIDTH, 2, 0xffd23f).setOrigin(0);
    this.add.image(262, 151, MAP_TEX.throne).setOrigin(0.5, 1).setScale(1.3);

    this.leighton = this.add.sprite(60, 151, PRINCESS_TEXTURE, FRAMES.idle1).setOrigin(0.5, 1).setScale(1.5).setDepth(10).play(PRINCESS_ANIMS.idle);

    // An empty crown in the middle of the room, waiting for its jewels.
    this.crown = this.add.container(GAME_WIDTH / 2, 60).setDepth(11);
    this.crown.add(this.add.image(0, 0, LEVEL_TEX.crown).setScale(CROWN_SCALE));

    this.spiralJewels();
    this.input.on(Phaser.Input.Events.POINTER_UP, () => this.tap());
    this.cameras.main.fadeIn(500, 42, 20, 56);
  }

  update(): void {
    if (controls.justPressed('jump') || controls.justPressed('wand')) this.tap();
    // Once the crown is on her head, it moves with her.
    if (this.crownOnHead) this.crown.setPosition(this.leighton.x, this.leighton.y - 33);
  }

  /** Step 1: the jewels start in a big ring and spiral in, one after another, into their sockets. */
  private spiralJewels(): void {
    const cx = GAME_WIDTH / 2;
    const cy = 60;
    JEWEL_COLORS.forEach((color, i) => {
      const gem = this.add.image(cx, cy, LEVEL_TEX.jewel).setTint(color).setDepth(12);
      const start = (i / 12) * Math.PI * 2;
      const [sx, sy] = CROWN_SOCKETS[i];
      const socket = { x: (sx + 2 - 22) * CROWN_SCALE, y: (sy + 2 - 11) * CROWN_SCALE };
      const spin = { t: 0 };
      this.tweens.add({
        targets: spin,
        t: 1,
        delay: 300 + i * 220,
        duration: 1800,
        ease: 'Sine.InOut',
        onUpdate: () => {
          const r = 120 * (1 - spin.t);
          const a = start + spin.t * Math.PI * 2.5;
          gem.setPosition(cx + Math.cos(a) * r + socket.x * spin.t, cy + Math.sin(a) * r * 0.6 + socket.y * spin.t);
        },
        onComplete: () => {
          gem.destroy();
          this.crown.add(this.add.image(socket.x, socket.y, LEVEL_TEX.jewelMini).setScale(CROWN_SCALE).setTint(color));
          sparkleBurst(this, cx + socket.x, cy + socket.y, 6, 10);
          sfx.twinkle();
          if (i === 11) this.time.delayedCall(700, () => this.crownToHead());
        },
      });
    });
  }

  /** Step 2: the full crown floats down onto her head. */
  private crownToHead(): void {
    sfx.befriend();
    this.tweens.add({
      targets: this.crown,
      x: this.leighton.x,
      y: this.leighton.y - 33,
      scale: 16 / (44 * CROWN_SCALE), // shrink to about 16 pixels wide: just right for her head
      duration: 1600,
      ease: 'Sine.InOut',
      onComplete: () => {
        this.crownOnHead = true;
        sparkleBurst(this, this.leighton.x, this.leighton.y - 34, 12, 20);
        this.time.delayedCall(500, () => this.walkToThrone());
      },
    });
  }

  /** Step 3: she walks up to her throne. */
  private walkToThrone(): void {
    this.leighton.play(PRINCESS_ANIMS.run);
    this.tweens.add({
      targets: this.leighton,
      x: 240,
      duration: 2200,
      onComplete: () => {
        this.leighton.play(PRINCESS_ANIMS.cheer);
        this.celebrate();
      },
    });
  }

  /** Step 4: fireworks, confetti, and the crowd of friends from every land. */
  private celebrate(): void {
    this.canSkip = true;
    speak('Princess Leighton got her crown back! You did it!');
    sfx.jewel();
    const soft = comfort.reduceFlashing;
    this.time.addEvent({ delay: soft ? 1200 : 450, repeat: soft ? 6 : 20, callback: () => this.firework() });
    this.time.addEvent({ delay: soft ? 150 : 70, repeat: soft ? 70 : 160, callback: () => this.confetti() });
    this.crowd();
    this.time.delayedCall(11000, () => this.showFinal());
  }

  private firework(): void {
    const x = Phaser.Math.Between(30, 290);
    const y = Phaser.Math.Between(20, 80);
    const color = Phaser.Utils.Array.GetRandom(JEWEL_COLORS);
    sfx.tap();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const spark = this.add.image(x, y, LEVEL_TEX.glow).setTint(color).setScale(0.18).setDepth(30);
      this.tweens.add({ targets: spark, x: x + Math.cos(a) * 26, y: y + Math.sin(a) * 26 + 6, alpha: 0, duration: 900, ease: 'Quad.Out', onComplete: () => spark.destroy() });
    }
  }

  private confetti(): void {
    const c = this.add
      .image(Phaser.Math.Between(0, GAME_WIDTH), -4, MAP_TEX.confetti)
      .setTint(Phaser.Utils.Array.GetRandom([0xff86bf, 0xffd23f, 0x7fd8ff, 0x8fe0a0, 0xc9a3ff]))
      .setDepth(31);
    this.tweens.add({
      targets: c,
      y: GAME_HEIGHT + 4,
      x: c.x + Phaser.Math.Between(-30, 30),
      angle: Phaser.Math.Between(-360, 360),
      duration: Phaser.Math.Between(2000, 3500),
      onComplete: () => c.destroy(),
    });
  }

  /** Friends from every land line up along the front and hop and wave. */
  private crowd(): void {
    const s = (key: Parameters<typeof themeSkin>[1]) => themeSkin(this, key);
    const friends: { tex: string; frame?: number }[] = [
      { tex: s('meadow').walkerFriend ?? '' },
      { tex: babyGiraffeTexture(this), frame: 2 },
      { tex: s('jungle').hopperFriend ?? '' },
      { tex: s('beach').walkerFriend ?? '' },
      { tex: s('sea').flyerFriend ?? '' },
      { tex: s('candy').walkerFriend ?? '' },
      { tex: s('farm').hopperFriend ?? '' },
      { tex: cowTexture(this) },
      { tex: s('clouds').walkerFriend ?? '' },
      { tex: s('snow').rollerFriend ?? '' },
      { tex: s('toys').walkerFriend ?? '' },
      { tex: s('caves').flyerFriend ?? '' },
      { tex: s('night').flyerFriend ?? '' },
      { tex: s('castle').walkerFriend ?? '' },
    ].filter((f) => f.tex);
    friends.forEach((f, i) => {
      const x = 14 + i * 15;
      const friend = this.add.image(x, GAME_HEIGHT - 2, f.tex, f.frame ?? 0).setOrigin(0.5, 1).setDepth(20).setAlpha(0);
      this.tweens.add({ targets: friend, alpha: 1, duration: 300, delay: i * 120 });
      this.tweens.add({ targets: friend, y: friend.y - 8, duration: 280, yoyo: true, repeat: -1, delay: 400 + i * 90, ease: 'Quad.Out' });
    });
    // The little dragon, happy now, hugging the air beside the throne.
    const dragon = this.add.image(298, 151, dragonTexture(this), 3).setOrigin(0.5, 1).setDepth(9).setFlipX(true).setScale(0.8);
    this.tweens.add({ targets: dragon, y: dragon.y - 4, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  /** Step 5: the final picture. */
  private showFinal(): void {
    if (this.phase !== 'show') return;
    this.phase = 'final';
    this.cameras.main.fadeOut(600, 42, 20, 56);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.children.removeAll(true);
      this.tweens.killAll();
      this.time.removeAllEvents();
      this.cameras.main.setBackgroundColor(0xffe8f4);
      const star = this.add.image(GAME_WIDTH / 2, 132, MAP_TEX.star).setScale(2);
      this.tweens.add({ targets: star, angle: { from: -8, to: 8 }, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut' }); // a gentle happy rock
      this.tweens.add({ targets: star, scale: 2.25, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      const crown = this.add.container(GAME_WIDTH / 2, 40);
      crown.add(this.add.image(0, 0, LEVEL_TEX.crown).setScale(3));
      CROWN_SOCKETS.forEach(([sx, sy], i) =>
        crown.add(this.add.image((sx + 2 - 22) * 3, (sy + 2 - 11) * 3, LEVEL_TEX.jewelMini).setScale(3).setTint(JEWEL_COLORS[i])),
      );
      this.time.addEvent({ delay: 200, loop: true, callback: () => twinkle(this, Phaser.Math.Between(10, 310), Phaser.Math.Between(10, 170), 700) });
      this.time.delayedCall(1500, () => (this.canSkip = true));
      this.canSkip = false;
      this.cameras.main.fadeIn(600, 42, 20, 56);
    });
  }

  private tap(): void {
    if (!this.canSkip) return;
    if (this.phase === 'show') return this.showFinal();
    if (this.phase !== 'final') return;
    this.phase = 'leaving';
    sfx.tap();
    this.cameras.main.fadeOut(500, 42, 20, 56);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(SCENES.map, { levelId: 12 }));
  }
}
