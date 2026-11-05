import Phaser from 'phaser';

/**
 * ONE input layer for the whole game.
 *
 * Keyboard, game controller, and touch buttons all feed into the same four "actions".
 * Scenes never look at keys or fingers directly; they just ask:
 *
 *   controls.isDown('right')        -> is she holding right right now?
 *   controls.justPressed('jump')    -> did she start pressing jump this frame?
 *   controls.moveX                  -> -1 (left), 0 (still), or 1 (right)
 *
 * That way every level works the same no matter how she plays.
 */

export type Action = 'left' | 'right' | 'jump' | 'wand' | 'pause';
export const ACTIONS: readonly Action[] = ['left', 'right', 'jump', 'wand', 'pause'];

/** Which kind of device was used most recently (handy later for showing the right picture hints). */
export type InputDevice = 'keyboard' | 'gamepad' | 'touch';

/** Keyboard keys (KeyboardEvent.code) for each action. */
const KEY_MAP: Record<string, Action> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Space: 'jump',
  ArrowUp: 'jump',
  KeyW: 'jump',
  KeyX: 'wand',
  Enter: 'wand',
  NumpadEnter: 'wand',
  Escape: 'pause',
  KeyP: 'pause',
};

/**
 * Game controller buttons, using the browser's "standard" layout
 * (Xbox / PlayStation / Switch Pro controllers all report this layout in Chrome, Edge, Safari, Firefox).
 *   0 = A (bottom), 1 = B (right), 2 = X (left), 3 = Y (top)
 *   9 = Start (pause), 12 = d-pad up, 13 = down, 14 = left, 15 = right
 */
const PAD = { A: 0, B: 1, X: 2, START: 9, UP: 12, LEFT: 14, RIGHT: 15 } as const;
const STICK_DEADZONE = 0.4; // ignore tiny wobbles of the thumbstick

type ActionSet = Record<Action, boolean>;
const emptySet = (): ActionSet => ({ left: false, right: false, jump: false, wand: false, pause: false });

class Controls {
  /** Keys currently held on the keyboard (by KeyboardEvent.code). */
  private keysHeld = new Set<string>();
  /** Actions held by each source, combined every frame. */
  private gamepad = emptySet();
  private touch = emptySet();
  /** Final combined state for this frame and the previous frame (to detect "just pressed"). */
  private current = emptySet();
  private previous = emptySet();
  /**
   * "Latches" remember a press that started AND ended between two frames
   * (a super-quick tap), so it is never missed.
   */
  private latched = emptySet();
  private pressedThisFrame = emptySet();

  /** Function that the on-screen touch buttons provide, returning which buttons fingers are on. */
  private touchSource: (() => ActionSet) | null = null;

  /** True once a finger has touched the screen. The touch buttons stay hidden until then. */
  touchUsed = false;
  lastDevice: InputDevice = 'keyboard';

  private attached = false;

  /** Start listening. Called once from main.ts. */
  attach(game: Phaser.Game): void {
    if (this.attached) return;
    this.attached = true;

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    // If the window loses focus (alt-tab, notification), let go of everything so she doesn't keep walking.
    window.addEventListener('blur', this.releaseAll);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.releaseAll();
    });

    // PRE_STEP runs once per frame BEFORE any scene updates, so all scenes see the same input.
    game.events.on(Phaser.Core.Events.PRE_STEP, this.update, this);
  }

  // ---------- What scenes use ----------

  /** Is this action being held right now (by any device)? */
  isDown(action: Action): boolean {
    return this.current[action];
  }

  /** Did this action START being pressed this frame? (Use for jump and wand, so holding doesn't repeat.) */
  justPressed(action: Action): boolean {
    return this.pressedThisFrame[action];
  }

  /** -1 = left, 1 = right, 0 = none (or both at once). */
  get moveX(): number {
    return (this.current.right ? 1 : 0) - (this.current.left ? 1 : 0);
  }

  // ---------- Used by the touch-button overlay ----------

  /** The overlay scene registers a function that reports which on-screen buttons are pressed. */
  setTouchSource(source: (() => ActionSet) | null): void {
    this.touchSource = source;
  }

  /** Called the instant a finger lands on a button, so even a tiny tap counts. */
  tapLatch(action: Action): void {
    this.latched[action] = true;
  }

  markTouchUsed(): void {
    this.touchUsed = true;
    this.lastDevice = 'touch';
  }

  // ---------- Internals ----------

  private onKeyDown = (e: KeyboardEvent): void => {
    const action = KEY_MAP[e.code];
    if (!action) return;
    // Stop arrows/space from scrolling the page.
    e.preventDefault();
    this.lastDevice = 'keyboard';
    if (!e.repeat) this.latched[action] = true;
    this.keysHeld.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (KEY_MAP[e.code]) e.preventDefault();
    this.keysHeld.delete(e.code);
  };

  private releaseAll = (): void => {
    this.keysHeld.clear();
    this.gamepad = emptySet();
  };

  private pollGamepads(): void {
    const result = emptySet();
    let pads: (Gamepad | null)[] = [];
    try {
      pads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
    } catch {
      // Some browsers block gamepads on non-secure (http://192.168...) pages. Just ignore.
    }
    for (const pad of pads) {
      if (!pad || !pad.connected) continue;
      const btn = (i: number) => !!pad.buttons[i]?.pressed;
      const stickX = pad.axes[0] ?? 0;

      const left = btn(PAD.LEFT) || stickX < -STICK_DEADZONE;
      const right = btn(PAD.RIGHT) || stickX > STICK_DEADZONE;
      const jump = btn(PAD.A) || btn(PAD.UP);
      const wand = btn(PAD.B) || btn(PAD.X);
      const pause = btn(PAD.START);

      if (left || right || jump || wand) this.lastDevice = 'gamepad';
      result.left ||= left;
      result.right ||= right;
      result.jump ||= jump;
      result.wand ||= wand;
      result.pause ||= pause;
    }
    this.gamepad = result;
  }

  private update(): void {
    this.pollGamepads();
    this.touch = this.touchSource ? this.touchSource() : emptySet();

    const keyboard = emptySet();
    for (const code of this.keysHeld) keyboard[KEY_MAP[code]] = true;

    this.previous = this.current;
    this.current = emptySet();
    for (const a of ACTIONS) {
      this.current[a] = keyboard[a] || this.gamepad[a] || this.touch[a];
      this.pressedThisFrame[a] = (this.current[a] && !this.previous[a]) || this.latched[a];
      this.latched[a] = false;
    }
  }
}

/** The single shared controls object. Import this anywhere: `import { controls } from '../input/Controls'`. */
export const controls = new Controls();
export type { ActionSet };
export { emptySet };
