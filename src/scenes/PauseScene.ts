import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../constants';
import { LIT, OFF, TEX } from '../art/uiArt';
import { music } from '../audio/Music';
import { sfx } from '../audio/sfx';
import { setBusEnabled } from '../audio/Synth';
import { controls } from '../input/Controls';
import { loadSettings, saveSettings } from '../save/Save';

/**
 * The pause screen: big picture buttons, no words.
 *   Top row:    Play (green, triangle) = keep playing      Home (pink, house) = go to the map
 *   Bottom row: Music on/off (speaker + note)                Sounds on/off (speaker + sparkle)
 * The music and sound choices are saved for next time.
 *
 * Touch: tap a button. Keyboard/controller: Left/Right pick a button, Jump or Wand presses it,
 * and Pause again (Esc / P / Start) keeps playing.
 */
interface PauseButton {
  image: Phaser.GameObjects.Image;
  texture: () => string;
  action: () => void;
}

export class PauseScene extends Phaser.Scene {
  private buttons: PauseButton[] = [];
  private selected = 0;
  private levelId = 0;

  constructor() {
    super(SCENES.pause);
  }

  init(data: { levelId?: number }): void {
    this.levelId = data.levelId ?? 0;
  }

  create(): void {
    this.selected = 0;
    music.pause();
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.letterbox, 0.75).setOrigin(0).setInteractive();

    const settings = loadSettings();
    const toggle = (kind: 'music' | 'sfx') => {
      settings[kind] = !settings[kind];
      saveSettings(settings);
      setBusEnabled(kind, settings[kind]);
      sfx.tap();
      this.highlight();
    };

    const make = (x: number, y: number, r: number, texture: () => string, action: () => void): PauseButton => {
      const image = this.add.image(x, y, texture());
      image.setInteractive(new Phaser.Geom.Circle(r, r, r + 4), Phaser.Geom.Circle.Contains);
      image.on(Phaser.Input.Events.POINTER_UP, action);
      return { image, texture, action };
    };
    const cx = GAME_WIDTH / 2;
    this.buttons = [
      make(cx - 40, 72, 26, () => TEX.btnPlay, () => this.resume()),
      make(cx + 40, 72, 26, () => TEX.btnHome, () => this.goHome()),
      make(cx - 30, 140, 20, () => TEX.btnMusic + (settings.music ? '' : OFF), () => toggle('music')),
      make(cx + 30, 140, 20, () => TEX.btnSfx + (settings.sfx ? '' : OFF), () => toggle('sfx')),
    ];

    // The chosen button gently "breathes" so it's clear which one Jump/Wand will press.
    this.tweens.add({ targets: this.buttons.map((b) => b.image), scale: 1.08, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.highlight();
  }

  update(): void {
    if (controls.justPressed('pause')) return this.resume();
    // Left/Right step through all four buttons in reading order (Play, Home, Music, Sounds), wrapping around.
    const n = this.buttons.length;
    if (controls.justPressed('left')) this.select((this.selected + n - 1) % n);
    if (controls.justPressed('right')) this.select((this.selected + 1) % n);
    if (controls.justPressed('jump') || controls.justPressed('wand')) this.buttons[this.selected].action();
  }

  private select(i: number): void {
    this.selected = i;
    sfx.tap();
    this.highlight();
  }

  private highlight(): void {
    this.buttons.forEach((b, i) => {
      const on = i === this.selected;
      b.image.setTexture(on ? b.texture() + LIT : b.texture()).setAlpha(on ? 1 : 0.85);
    });
  }

  private resume(): void {
    sfx.tap();
    music.resume();
    this.scene.resume(SCENES.level);
    this.scene.stop();
  }

  private goHome(): void {
    sfx.tap();
    this.scene.stop(SCENES.level);
    this.scene.start(SCENES.map, { levelId: this.levelId });
  }
}
