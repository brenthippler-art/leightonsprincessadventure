import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, JEWEL_COLORS, SCENES } from '../constants';
import { CROWN_SOCKETS, LEVEL_TEX } from '../art/levelArt';
import { MAP_TEX } from '../art/mapArt';
import { pixelText } from '../art/pixelFont';
import { TEX } from '../art/uiArt';
import { music } from '../audio/Music';
import { sfx } from '../audio/sfx';
import { SONGS } from '../audio/songs';
import { audioReady } from '../audio/Synth';
import { controls } from '../input/Controls';
import { firstUnfinishedLevel } from '../levels';
import { sparkleBurst } from '../objects/fx';
import { loadSave, loadSettings, resetProgress, saveSettings, unlockAll, type Settings } from '../save/Save';

/**
 * TITLE SCREEN: a castle at sunset, drifting sparkles, the game's name in a hand-drawn pixel font,
 * and one giant pulsing Play button. Tapping Play starts the sound and goes to the story intro
 * (first time only) or the map.
 *
 * HIDDEN PARENT SETTINGS: hold the little crown in the top-left corner for 5 seconds. A parent panel
 * opens: Helper Mode, Auto-run, Spoken hints, Reduce flashing, Unlock all lands, and Clear progress
 * (which asks with pictures: full crown -> empty crown, green check = clear, pink X = keep).
 */
const HOLD_TO_RESET_MS = 5000;

export class TitleScene extends Phaser.Scene {
  private leaving = false;
  private holdStart: number | null = null;
  private dialog: Phaser.GameObjects.Container | null = null;
  private panel: Phaser.GameObjects.Container | null = null;

  constructor() {
    super(SCENES.title);
  }

  create(): void {
    this.leaving = false;
    this.holdStart = null;
    this.dialog = null;
    this.panel = null;

    this.add.image(0, 0, MAP_TEX.sunset).setOrigin(0);

    // The title, made from the code-drawn pixel font, bobbing gently.
    const line1 = this.add.image(GAME_WIDTH / 2, 22, pixelText(this, 'title-1', "LEIGHTON'S", { fill: '#ffd23f', shine: '#fff6b0', scale: 3 }));
    const line2 = this.add.image(GAME_WIDTH / 2, 50, pixelText(this, 'title-2', 'PRINCESS ADVENTURE', { fill: '#ff86bf', shine: '#ffd8ec', scale: 2 }));
    this.tweens.add({ targets: [line1, line2], y: '-=3', duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // Sparkles drifting up through the sunset.
    this.time.addEvent({
      delay: 220,
      loop: true,
      callback: () => {
        const s = this.add.image(Phaser.Math.Between(0, GAME_WIDTH), GAME_HEIGHT + 4, TEX.sparkle).setAlpha(0.9);
        this.tweens.add({ targets: s, y: Phaser.Math.Between(40, 120), x: s.x + Phaser.Math.Between(-20, 20), alpha: 0, duration: 4000, onComplete: () => s.destroy() });
      },
    });

    // One giant pulsing Play button.
    const play = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 32, TEX.btnPlay).setScale(1.15);
    play.setInteractive(new Phaser.Geom.Circle(26, 26, 32), Phaser.Geom.Circle.Contains);
    play.on(Phaser.Input.Events.POINTER_UP, () => this.go());
    this.tweens.add({ targets: play, scale: 1.3, duration: 550, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // The small corner crown: the hidden parent reset (hold 5 seconds).
    const crown = this.add.image(4, 4, LEVEL_TEX.crown).setOrigin(0).setScale(0.5).setAlpha(0.8);
    crown.setInteractive();
    crown.on(Phaser.Input.Events.POINTER_DOWN, () => (this.holdStart = this.time.now));
    crown.on(Phaser.Input.Events.POINTER_UP, () => (this.holdStart = null));
    crown.on(Phaser.Input.Events.POINTER_OUT, () => (this.holdStart = null));

    // Music: if sound is already allowed (coming back from the map), play now; otherwise the first tap starts it.
    if (audioReady()) music.play(SONGS.title);
    else this.input.once(Phaser.Input.Events.POINTER_DOWN, () => music.play(SONGS.title, { fade: 0.5 }));
    this.cameras.main.fadeIn(400, 42, 20, 56);
  }

  update(time: number): void {
    if (this.holdStart !== null && time - this.holdStart >= HOLD_TO_RESET_MS) {
      this.holdStart = null;
      if (!this.panel) this.openParentPanel();
    }
    if (this.dialog || this.panel) return;
    if (controls.justPressed('jump') || controls.justPressed('wand') || controls.justPressed('pause')) this.go();
  }

  private go(): void {
    if (this.leaving || this.dialog || this.panel) return;
    this.leaving = true;
    sfx.tap();
    const firstTime = !loadSave().seenIntro;
    if (!firstTime) music.play(SONGS.map);
    else music.play(SONGS.title);
    this.cameras.main.fadeOut(400, 42, 20, 56);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      if (firstTime) this.scene.start(SCENES.story);
      else this.scene.start(SCENES.map, { levelId: firstUnfinishedLevel(loadSave().jewels) });
    });
  }

  /**
   * PARENT SETTINGS (behind the 5-second hold). Small text labels are fine here: it's for grown-ups,
   * and a 4-year-old won't find it. Every switch is saved immediately and applies to the next land played.
   */
  private openParentPanel(): void {
    sfx.tap();
    const p = this.add.container(0, 0).setDepth(40);
    this.panel = p;
    p.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.letterbox, 0.94).setOrigin(0).setInteractive());
    p.add(this.add.image(GAME_WIDTH / 2, 12, pixelText(this, 'parent-title', 'PARENT SETTINGS', { fill: '#ffd23f', shine: '#fff6b0' })));

    const label = (key: string, text: string, y: number) =>
      p.add(this.add.image(46, y, pixelText(this, `parent-${key}`, text, { fill: '#ffffff', shine: '#ffffff' })).setOrigin(0, 0.5));

    // Four on/off switches.
    const toggles: [keyof Settings, string, string][] = [
      ['helperMode', 'helper', 'HELPER MODE'],
      ['autoRun', 'autorun', 'AUTO-RUN'],
      ['spokenHints', 'spoken', 'SPOKEN HINTS'],
      ['reduceFlashing', 'flashing', 'REDUCE FLASHING'],
    ];
    const icons = [TEX.iconJump, TEX.iconRight, TEX.btnSfx, TEX.sparkle];
    toggles.forEach(([setting, key, text], i) => {
      const y = 34 + i * 20;
      p.add(this.add.image(30, y, icons[i]).setScale(icons[i] === TEX.btnSfx ? 0.35 : icons[i] === TEX.sparkle ? 2 : 1));
      label(key, text, y);
      const sw = this.add.image(270, y, loadSettings()[setting] ? MAP_TEX.switchOn : MAP_TEX.switchOff).setInteractive();
      sw.on(Phaser.Input.Events.POINTER_UP, () => {
        const s = loadSettings();
        s[setting] = !s[setting];
        saveSettings(s);
        sw.setTexture(s[setting] ? MAP_TEX.switchOn : MAP_TEX.switchOff);
        sfx.tap();
      });
      p.add(sw);
    });

    // Two actions: open every land, and clear progress (which asks first).
    const action = (y: number, key: string, text: string, icon: Phaser.GameObjects.Image, onTap: () => void) => {
      p.add(icon.setPosition(30, y));
      label(key, text, y);
      const btn = this.add.image(270, y, TEX.iconRight).setInteractive();
      btn.on(Phaser.Input.Events.POINTER_UP, onTap);
      p.add(btn);
      return btn;
    };
    const unlockBtn = action(122, 'unlock', 'UNLOCK ALL LANDS', this.add.image(0, 0, MAP_TEX.padlock), () => {
      unlockAll();
      sfx.befriend();
      sparkleBurst(this, 270, 122, 8, 14);
      unlockBtn.setAlpha(0.4);
    });
    action(142, 'reset', 'CLEAR PROGRESS', this.add.image(0, 0, LEVEL_TEX.crown).setScale(0.45), () => this.askReset());

    // Close (pink X), top-right.
    const close = this.add.image(GAME_WIDTH - 16, 164, MAP_TEX.no).setScale(0.6).setInteractive();
    close.on(Phaser.Input.Events.POINTER_UP, () => {
      sfx.tap();
      p.destroy();
      this.panel = null;
    });
    p.add(close);
  }

  /** The parent question, in pictures: "full crown -> empty crown?"  check = clear, X = keep. */
  private askReset(): void {
    sfx.hmm();
    const d = this.add.container(0, 0).setDepth(50);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.letterbox, 0.85).setOrigin(0).setInteractive();
    const full = this.add.image(90, 60, LEVEL_TEX.crown).setScale(1.5);
    const sparkle = this.add.image(90, 60, LEVEL_TEX.glow).setTint(0xffe066).setScale(1.6).setAlpha(0.5);
    const arrow = this.add.image(160, 60, TEX.iconRight).setScale(2);
    const empty = this.add.image(230, 60, LEVEL_TEX.crown).setScale(1.5).setAlpha(0.6);
    const yes = this.add.image(120, 130, MAP_TEX.yes).setInteractive();
    const no = this.add.image(200, 130, MAP_TEX.no).setInteractive();
    d.add([shade, sparkle, full, arrow, empty, yes, no]);
    // The left crown is FULL (all 12 jewels), so the picture reads "jewels... then no jewels".
    CROWN_SOCKETS.forEach(([sx, sy], i) =>
      d.add(this.add.image(90 + (sx + 2 - 22) * 1.5, 60 + (sy + 2 - 11) * 1.5, LEVEL_TEX.jewelMini).setScale(1.5).setTint(JEWEL_COLORS[i])),
    );
    this.dialog = d;

    const close = () => {
      d.destroy();
      this.dialog = null;
    };
    yes.on(Phaser.Input.Events.POINTER_UP, () => {
      resetProgress();
      sfx.befriend();
      sparkleBurst(this, 160, 90, 16, 40);
      close();
    });
    no.on(Phaser.Input.Events.POINTER_UP, () => {
      sfx.tap();
      close();
    });
  }
}
