import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, JEWEL_COLORS, SCENES } from '../constants';
import { CROWN_SOCKETS, LEVEL_TEX } from '../art/levelArt';
import { MAP_TEX } from '../art/mapArt';
import { FRAMES, PRINCESS_TEXTURE } from '../art/princess';
import { TEX } from '../art/uiArt';
import { music } from '../audio/Music';
import { sfx } from '../audio/sfx';
import { SONGS } from '../audio/songs';
import { speak } from '../audio/Speech';
import { controls } from '../input/Controls';
import { sparkleBurst, twinkle } from '../objects/fx';
import { markIntroSeen } from '../save/Save';

/**
 * THE STORY INTRO (first play only). Three picture panels, no reading needed, with optional
 * spoken narration. A tap (or Jump/Wand) moves to the next panel; the fast-forward button skips it all.
 *   1. Princess Leighton on her throne, wearing her crown with 12 sparkling jewels.
 *   2. A gust of wind blows the jewels away across the land, and her throne fades away.
 *   3. She lifts her wand, ready for adventure.
 */
const PANEL_MS = 7000;
const LINES = [
  'Princess Leighton had a beautiful crown with twelve sparkly jewels.',
  'Whoosh! A big wind blew the jewels far away, all across the land!',
  'Let us find them all! Ready for an adventure!',
];

export class StoryScene extends Phaser.Scene {
  private panel = -1;
  private layer!: Phaser.GameObjects.Container;
  private timer?: Phaser.Time.TimerEvent;
  private finished = false;
  /** Repeating timers belonging to the current panel (stopped when the panel changes). */
  private panelEvents: Phaser.Time.TimerEvent[] = [];

  constructor() {
    super(SCENES.story);
  }

  create(): void {
    this.panel = -1;
    this.finished = false;
    music.play(SONGS.title);
    this.layer = this.add.container(0, 0);

    // Fast-forward (skip) button: two arrows, near the top-right corner.
    const skip = this.add.container(GAME_WIDTH - 52, 14).setDepth(20).setAlpha(0.8); // just left of the fullscreen button
    skip.add([this.add.image(-5, 0, TEX.iconRight), this.add.image(5, 0, TEX.iconRight)]);
    skip.setSize(30, 20).setInteractive();
    skip.on(Phaser.Input.Events.POINTER_UP, (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      e.stopPropagation();
      this.finish();
    });
    this.input.on(Phaser.Input.Events.POINTER_UP, () => this.next());
    this.next();
  }

  update(): void {
    if (controls.justPressed('jump') || controls.justPressed('wand')) this.next();
    if (controls.justPressed('pause')) this.finish();
  }

  private next(): void {
    if (this.finished) return;
    this.panel++;
    if (this.panel > 2) return this.finish();
    this.timer?.remove();
    this.timer = this.time.delayedCall(PANEL_MS, () => this.next());
    this.panelEvents.forEach((e) => e.remove());
    this.panelEvents = [];
    this.tweens.killTweensOf(this.layer.list);
    this.layer.removeAll(true);
    this.cameras.main.fadeIn(350, 42, 20, 56);
    if (this.panel > 0) sfx.tap();
    speak(LINES[this.panel]);
    [this.throneRoom, this.windBlows, this.readyForAdventure][this.panel].call(this);
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    markIntroSeen();
    window.speechSynthesis?.cancel();
    this.cameras.main.fadeOut(400, 42, 20, 56);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(SCENES.map, { levelId: 1 }));
  }

  /** A repeating timer that belongs to the current panel. */
  private every(delay: number, repeat: number, callback: () => void): void {
    this.panelEvents.push(this.time.addEvent({ delay, repeat, callback }));
  }

  /** A crown with all 12 jewels (or none), as one container. */
  private crown(x: number, y: number, scale: number, withJewels: boolean): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    c.add(this.add.image(0, 0, LEVEL_TEX.crown).setOrigin(0.5).setScale(scale));
    if (withJewels)
      CROWN_SOCKETS.forEach(([sx, sy], i) =>
        c.add(this.add.image((sx + 2 - 22) * scale, (sy + 2 - 11) * scale, LEVEL_TEX.jewelMini).setScale(scale).setTint(JEWEL_COLORS[i])),
      );
    return c;
  }

  private princess(x: number, y: number, frame: number, scale = 3): Phaser.GameObjects.Image {
    return this.add.image(x, y, PRINCESS_TEXTURE, frame).setOrigin(0.5, 1).setScale(scale);
  }

  // ---- Panel 1: on her throne, crown sparkling ----
  private throneRoom(): void {
    const bg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffd8e8).setOrigin(0);
    const carpet = this.add.rectangle(0, 150, GAME_WIDTH, 30, 0xd83a5a).setOrigin(0);
    const throne = this.add.image(GAME_WIDTH / 2, 152, MAP_TEX.throne).setOrigin(0.5, 1).setScale(2.2);
    const leighton = this.princess(GAME_WIDTH / 2, 152, FRAMES.idle1);
    const crown = this.crown(GAME_WIDTH / 2, 64, 1, true);
    this.layer.add([bg, carpet, throne, leighton, crown]);
    this.tweens.add({ targets: crown, y: 60, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.every(250, 25, () => twinkle(this, GAME_WIDTH / 2 + Phaser.Math.Between(-24, 24), Phaser.Math.Between(52, 74), 500));
  }

  // ---- Panel 2: the wind blows the jewels away; the throne fades ----
  private windBlows(): void {
    const sky = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xbfe8ff).setOrigin(0);
    const hills = this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT + 40, GAME_WIDTH * 1.6, 140, 0x8fdc84);
    const throne = this.add.image(220, 150, MAP_TEX.throne).setOrigin(0.5, 1).setScale(1.6);
    const wind = this.add.image(40, 50, MAP_TEX.windFace).setScale(1.5);
    const leighton = this.princess(150, 150, FRAMES.jumpUp);
    const crown = this.crown(150, 70, 1, false);
    this.layer.add([sky, hills, throne, wind, leighton, crown]);
    this.tweens.add({ targets: wind, scaleX: 1.65, duration: 300, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: throne, alpha: 0, x: 260, duration: 3000, delay: 1500 });
    // Swirly wind streaks.
    this.every(160, 30, () => {
        const streak = this.add.rectangle(60, Phaser.Math.Between(30, 140), 18, 2, 0xffffff, 0.8);
        this.layer.add(streak);
        this.tweens.add({ targets: streak, x: GAME_WIDTH + 20, duration: 900, onComplete: () => streak.destroy() });
    });
    // The 12 jewels pop out of the crown and fly off in all directions across the land.
    sfx.befriend();
    JEWEL_COLORS.forEach((color, i) => {
      const j = this.add.image(150 + Phaser.Math.Between(-15, 15), 70, LEVEL_TEX.jewel).setTint(color);
      this.layer.add(j);
      this.tweens.add({
        targets: j,
        x: 200 + (i % 4) * 40 + Phaser.Math.Between(-10, 10),
        y: 20 + Math.floor(i / 4) * 40 + Phaser.Math.Between(-8, 8),
        alpha: 0.2,
        angle: 360,
        duration: 1800,
        delay: 300 + i * 120,
        ease: 'Sine.In',
      });
    });
  }

  // ---- Panel 3: wand raised, ready for adventure ----
  private readyForAdventure(): void {
    const bg = this.add.image(0, 0, MAP_TEX.sunset).setOrigin(0).setAlpha(0.6);
    const lands = Array.from({ length: 12 }, (_, i) => {
      const a = Math.PI + (i / 11) * Math.PI;
      return this.add.image(GAME_WIDTH / 2 + Math.cos(a) * 130, 150 + Math.sin(a) * 110, MAP_TEX.land(i + 1)).setAlpha(0).setScale(0.9);
    });
    const leighton = this.princess(GAME_WIDTH / 2, 160, FRAMES.wave1);
    this.layer.add([bg, ...lands, leighton]);
    lands.forEach((l, i) => this.tweens.add({ targets: l, alpha: 1, delay: 400 + i * 150, duration: 300 }));
    this.every(700, 8, () => {
        leighton.setFrame(leighton.frame.name === String(FRAMES.wave1) ? FRAMES.cheer : FRAMES.wave1);
        sparkleBurst(this, GAME_WIDTH / 2 + 24, 100, 10, 20);
    });
    sfx.twinkle();
  }
}
