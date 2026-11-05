import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../constants';
import { LIT, TEX } from '../art/uiArt';
import { controls, emptySet, type Action, type ActionSet } from './Controls';
import { sfx } from '../audio/sfx';

/**
 * A see-through scene that sits on top of every other scene and draws:
 *   - the on-screen touch buttons (Left, Right at bottom-left; Wand, Jump at bottom-right)
 *   - the small fullscreen button (top-right)
 *
 * It reports which buttons fingers are on to the shared `controls` object,
 * so levels don't need to know touch buttons exist.
 */

interface TouchButton {
  action: Action;
  x: number;
  y: number;
  radius: number; // size of the picture
  hitRadius: number; // a bit bigger than the picture, so near-misses still count
  texture: string;
  image?: Phaser.GameObjects.Image;
}

const IDLE_ALPHA = 0.5; // semi-transparent so she can still see the level behind
const PRESSED_ALPHA = 0.95;
const HIT_PADDING = 8;

export class ControlsOverlayScene extends Phaser.Scene {
  private buttons: TouchButton[] = [
    { action: 'left', x: 30, y: GAME_HEIGHT - 30, radius: 24, hitRadius: 0, texture: TEX.btnLeft },
    { action: 'right', x: 86, y: GAME_HEIGHT - 30, radius: 24, hitRadius: 0, texture: TEX.btnRight },
    { action: 'wand', x: GAME_WIDTH - 88, y: GAME_HEIGHT - 26, radius: 24, hitRadius: 0, texture: TEX.btnWand },
    { action: 'jump', x: GAME_WIDTH - 32, y: GAME_HEIGHT - 34, radius: 28, hitRadius: 0, texture: TEX.btnJump },
  ];
  private buttonLayer!: Phaser.GameObjects.Container;
  private fullscreenIcon?: Phaser.GameObjects.Image;

  constructor() {
    super(SCENES.controlsOverlay);
  }

  create(): void {
    // Testing helper: open the game with ?touch at the end of the address to see the buttons with a mouse.
    if (new URLSearchParams(window.location.search).has('touch')) controls.touchUsed = true;

    this.buttonLayer = this.add.container(0, 0);
    for (const b of this.buttons) {
      b.hitRadius = b.radius + HIT_PADDING;
      b.image = this.add.image(b.x, b.y, b.texture).setAlpha(IDLE_ALPHA);
      this.buttonLayer.add(b.image);
    }
    this.buttonLayer.setVisible(controls.touchUsed);

    // Any finger landing on the screen reveals the buttons; a finger landing on a button counts instantly.
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      if (p.wasTouch) controls.markTouchUsed();
      if (!controls.touchUsed || !this.inLevel) return;
      const hit = this.buttonAt(p.x, p.y);
      if (hit) controls.tapLatch(hit.action);
    });

    controls.setTouchSource(() => this.readTouches());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => controls.setTouchSource(null));

    this.createFullscreenButton();
  }

  /** Which button (if any) is closest to this point and within reach? */
  private buttonAt(x: number, y: number): TouchButton | null {
    let best: TouchButton | null = null;
    let bestDist = Infinity;
    for (const b of this.buttons) {
      const d = Phaser.Math.Distance.Between(x, y, b.x, b.y);
      if (d <= b.hitRadius && d < bestDist) {
        best = b;
        bestDist = d;
      }
    }
    return best;
  }

  /**
   * Look at every finger currently on the screen (multi-touch!) and report which buttons are held.
   * Sliding a finger from Left to Right switches buttons, just like a real d-pad.
   */
  /** Touch buttons only appear in levels; the menus have their own big buttons. */
  private get inLevel(): boolean {
    return this.scene.isActive(SCENES.level);
  }

  private readTouches(): ActionSet {
    const held = emptySet();
    if (!controls.touchUsed || !this.inLevel) return held;
    for (const p of this.input.manager.pointers) {
      if (!p.isDown) continue;
      const hit = this.buttonAt(p.x, p.y);
      if (hit) held[hit.action] = true;
    }
    return held;
  }

  private createFullscreenButton(): void {
    // Hide it on devices that can't go fullscreen (for example iPhone Safari).
    if (!this.sys.game.device.fullscreen.available) return;

    const x = GAME_WIDTH - 12;
    const y = 12;
    this.fullscreenIcon = this.add.image(x, y, TEX.fullscreen).setAlpha(0.7);

    // A bigger invisible hit area than the 16x16 picture, so it's easy to tap.
    const zone = this.add.zone(x + 2, y, 24, 28).setInteractive({ useHandCursor: true });
    zone.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.fullscreenIcon?.setTexture(TEX.fullscreen + LIT).setAlpha(1);
    });
    const unlight = () => this.fullscreenIcon?.setTexture(TEX.fullscreen).setAlpha(0.7);
    zone.on(Phaser.Input.Events.POINTER_OUT, unlight);
    // Browsers only allow fullscreen as a direct response to a tap/click, so we do it on "pointer up".
    zone.on(Phaser.Input.Events.POINTER_UP, () => {
      unlight();
      sfx.tap();
      this.scale.toggleFullscreen();
    });
  }

  update(): void {
    const show = controls.touchUsed && this.inLevel;
    this.buttonLayer.setVisible(show);
    if (!show) return;
    // Light up any button whose action is active (from touch, keyboard, or controller).
    for (const b of this.buttons) {
      const down = controls.isDown(b.action);
      b.image!.setTexture(down ? b.texture + LIT : b.texture).setAlpha(down ? PRESSED_ALPHA : IDLE_ALPHA);
    }
  }
}
