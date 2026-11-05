import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, JEWEL_COLORS, SCENES } from '../constants';
import { CROWN_SOCKETS, LEVEL_TEX } from '../art/levelArt';
import { MAP_TEX } from '../art/mapArt';
import { PRINCESS_ANIMS, PRINCESS_TEXTURE } from '../art/princess';
import { jewelTexture } from '../art/themes';
import { TEX } from '../art/uiArt';
import { music } from '../audio/Music';
import { sfx } from '../audio/sfx';
import { SONGS } from '../audio/songs';
import { controls } from '../input/Controls';
import { getLevel, LEVELS } from '../levels';
import { gentleShake } from '../objects/LevelContext';
import { hasJewel, isUnlocked, loadSave } from '../save/Save';

/**
 * THE WORLD MAP: a storybook page with the 12 lands joined by a dotted path (two rows: lands 1-6
 * left to right, then 7-12 back right to left).
 *  - Unlocked lands glow; finished lands show their jewel; locked lands are dimmed with a soft padlock.
 *  - Leighton walks along the path to the chosen land.
 *  - Big left/right arrows move her; the big green Go button starts the land. Tapping a land walks
 *    there (tap it again, or Go, to play). Keyboard/controller: Left/Right, then Jump or Wand.
 *  - The crown at the top fills in with every jewel found.
 *
 * Scene data: { levelId?: number (which land to stand on), walkFrom?: number (walk here from that land first) }
 */
export interface MapSceneData {
  levelId?: number;
  walkFrom?: number;
}

/** Where each land sits on the page (index 0 = land 1). */
const NODES = Array.from({ length: 12 }, (_, i) => ({
  x: i < 6 ? 35 + i * 50 : 285 - (i - 6) * 50,
  y: i < 6 ? 64 : 114,
}));
const FEET = 31; // Leighton stands just below the land's badge (not covering it)

export class MapScene extends Phaser.Scene {
  private selected = 1;
  private walkFrom: number | null = null;
  private leighton!: Phaser.GameObjects.Sprite;
  private icons: Phaser.GameObjects.Image[] = [];
  private locks: (Phaser.GameObjects.Image | null)[] = [];
  private walking = false;
  private leaving = false;

  constructor() {
    super(SCENES.map);
  }

  init(data: MapSceneData): void {
    const save = loadSave();
    this.selected = Phaser.Math.Clamp(data.levelId ?? 1, 1, save.unlocked);
    this.walkFrom = data.walkFrom && isUnlocked(data.walkFrom) ? data.walkFrom : null;
    this.walking = false;
    this.leaving = false;
    this.icons = [];
    this.locks = [];
  }

  create(): void {
    music.play(SONGS.map);
    this.add.image(0, 0, MAP_TEX.parchment).setOrigin(0);
    this.drawCrown();
    this.drawPath();

    LEVELS.forEach((level, i) => {
      const { x, y } = NODES[i];
      const id = level.id;
      const open = isUnlocked(id);
      if (open) {
        // Unlocked lands glow softly.
        const glow = this.add.image(x, y, LEVEL_TEX.glow).setTint(0xffe066).setScale(1.5).setAlpha(0.35);
        this.tweens.add({ targets: glow, alpha: 0.7, scale: 1.8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: i * 80 });
      }
      const icon = this.add.image(x, y, MAP_TEX.land(id)).setAlpha(open ? 1 : 0.45);
      icon.setInteractive(new Phaser.Geom.Circle(12, 12, 15), Phaser.Geom.Circle.Contains);
      icon.on(Phaser.Input.Events.POINTER_UP, () => this.tapLand(id));
      this.icons.push(icon);
      this.locks.push(open ? null : this.add.image(x + 8, y + 6, MAP_TEX.padlock));
      if (hasJewel(id)) {
        // Finished lands show their jewel, bobbing above the badge.
        const gem = this.add.image(x + 10, y - 11, jewelTexture(this, getLevel(id).theme));
        this.tweens.add({ targets: gem, y: gem.y - 2, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: i * 60 });
      }
    });

    // Leighton, standing at her land (or at the land she just finished, ready to walk on).
    const start = NODES[(this.walkFrom ?? this.selected) - 1];
    this.leighton = this.add.sprite(start.x, start.y + FEET, PRINCESS_TEXTURE).setOrigin(0.5, 1).setDepth(10).play(PRINCESS_ANIMS.idle);

    // Big buttons along the bottom.
    const button = (x: number, tex: string, scale: number, onTap: () => void) => {
      const b = this.add.image(x, GAME_HEIGHT - 18, tex).setScale(scale).setDepth(20);
      b.setInteractive(new Phaser.Geom.Circle(b.width / 2, b.height / 2, b.width / 2 + 4), Phaser.Geom.Circle.Contains);
      b.on(Phaser.Input.Events.POINTER_UP, onTap);
      return b;
    };
    button(26, TEX.btnLeft, 0.7, () => this.step(-1));
    button(GAME_WIDTH - 26, TEX.btnRight, 0.7, () => this.step(1));
    const go = button(GAME_WIDTH / 2, TEX.btnPlay, 0.65, () => this.go());
    this.tweens.add({ targets: go, scale: 0.75, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    this.cameras.main.fadeIn(350, 42, 20, 56);
    if (this.walkFrom !== null && this.walkFrom !== this.selected) {
      const target = this.selected;
      this.selected = this.walkFrom;
      this.time.delayedCall(600, () => this.walkTo(target));
    }
  }

  update(): void {
    if (controls.justPressed('left')) this.step(-1);
    if (controls.justPressed('right')) this.step(1);
    if (controls.justPressed('jump') || controls.justPressed('wand')) this.go();
  }

  private drawCrown(): void {
    const scale = 1.5;
    const x0 = GAME_WIDTH / 2 - 22 * scale;
    this.add.image(x0, 3, LEVEL_TEX.crown).setOrigin(0).setScale(scale);
    loadSave().jewels.forEach((found, i) => {
      if (!found) return;
      const [sx, sy] = CROWN_SOCKETS[i];
      this.add.image(x0 + sx * scale, 3 + sy * scale, LEVEL_TEX.jewelMini).setOrigin(0).setScale(scale).setTint(JEWEL_COLORS[i]);
    });
  }

  /** The dotted path joining the lands in order. */
  private drawPath(): void {
    for (let i = 0; i < NODES.length - 1; i++) {
      const a = NODES[i];
      const b = NODES[i + 1];
      const len = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      for (let d = 14; d < len - 12; d += 6) {
        const t = d / len;
        this.add.image(Phaser.Math.Linear(a.x, b.x, t), Phaser.Math.Linear(a.y, b.y, t) + FEET - 4, MAP_TEX.dot);
      }
    }
  }

  private tapLand(id: number): void {
    if (this.leaving) return;
    if (!isUnlocked(id)) return this.locked(id);
    if (id === this.selected && !this.walking) return this.go();
    sfx.tap();
    this.walkTo(id);
  }

  /** Big arrows: one land back or forward. */
  private step(dir: number): void {
    if (this.walking || this.leaving) return;
    const target = this.selected + dir;
    if (target < 1 || target > 12) return;
    if (!isUnlocked(target)) return this.locked(target);
    sfx.tap();
    this.walkTo(target);
  }

  private locked(id: number): void {
    sfx.hmm();
    const lock = this.locks[id - 1];
    gentleShake(this, [this.icons[id - 1], ...(lock ? [lock] : [])]);
  }

  /** Walk along the path, land by land, to the target. */
  private walkTo(target: number): void {
    if (this.walking || target === this.selected) return;
    this.walking = true;
    const dir = Math.sign(target - this.selected);
    const stops: number[] = [];
    for (let id = this.selected + dir; dir > 0 ? id <= target : id >= target; id += dir) stops.push(id);
    this.leighton.play(PRINCESS_ANIMS.run);
    const walkNext = () => {
      const id = stops.shift();
      if (id === undefined) {
        this.walking = false;
        this.leighton.play(PRINCESS_ANIMS.idle);
        return;
      }
      const node = NODES[id - 1];
      this.leighton.setFlipX(node.x < this.leighton.x);
      this.tweens.add({
        targets: this.leighton,
        x: node.x,
        y: node.y + FEET,
        duration: 380,
        onComplete: () => {
          this.selected = id;
          walkNext();
        },
      });
    };
    walkNext();
  }

  private go(): void {
    if (this.walking || this.leaving) return;
    this.leaving = true;
    sfx.tap();
    this.leighton.play(PRINCESS_ANIMS.cheer);
    this.cameras.main.fadeOut(400, 42, 20, 56);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(SCENES.level, { levelId: this.selected }));
  }
}
