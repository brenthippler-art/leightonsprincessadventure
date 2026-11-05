import Phaser from 'phaser';
import { PRACTICE, PRINCESS as C, WATER } from '../config';
import { FRAME_H, PRINCESS_ANIMS, PRINCESS_TEXTURE, WAND_TIP_OFFSET } from '../art/princess';
import { controls } from '../input/Controls';
import { sfx } from '../audio/sfx';
import { SparkleShot } from './SparkleShot';
import { comfort } from '../systems/Comfort';

/**
 * Princess Leighton: movement, jumping, wand, and choosing which animation to show.
 *
 * The scene creates her and calls `princess.update(delta)` once per frame.
 * All the feel numbers come from src/config.ts.
 *
 * We do our own gravity (instead of Phaser's built-in) because we want THREE different
 * gravities: floaty while rising with jump held, a bit heavier after letting go, and
 * a solid-but-gentle fall.
 */
export class Princess extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  /** 1 = facing right, -1 = facing left. */
  facing = 1;

  /** Counts DOWN from coyoteTime after leaving the ground. While above 0 she may still jump. */
  private coyoteTimer = 0;
  /** Counts DOWN from jumpBuffer after jump is pressed. While above 0 a landing triggers a jump. */
  private bufferTimer = 0;
  /** Extra mid-air jumps left (only used when doubleJump is on in config). */
  private airJumpsLeft = 0;
  private wandTimer = 0;
  private cheerTimer = 0;

  private safeBlinkTimer = 0;
  /** True while rising from a bounce pad: keeps the floaty gravity even if jump isn't held. */
  private launched = false;

  /** When false she ignores the controls (e.g. while celebrating the jewel). Gravity still works. */
  controlsEnabled = true;
  /** When true she's hidden and completely still (during the bonk poof). */
  frozen = false;
  /** Auto-run (parent setting): walk forward by herself. LevelScene switches it off inside puzzle areas. */
  autoRun = false;
  /** Helper Mode gives her a double jump; read once when she is created. */
  private readonly helper = comfort.helperMode;
  /** Reduce flashing: a slow gentle pulse instead of quick blinking. */
  private readonly softBlink = comfort.reduceFlashing;
  /** Underwater levels: floaty, and every tap of jump is a swim stroke upward. */
  underwater = false;
  /** Frames left of "standing on something that isn't a tile or body" (like a giraffe's neck). */
  private supportFrames = 0;
  /** After a practice nudge, the controls rest for a moment so the nudge can be seen. */
  private nudgeTimer = 0;
  /** For the landing thud: was she in the air last frame, and how fast was she falling? */
  private wasAirborne = false;
  private fallSpeed = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, PRINCESS_TEXTURE, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // The collision box is a bit smaller than the picture: 10 wide, 21 tall, centered, feet at the bottom.
    // Slightly-too-small boxes feel fair: she never gets snagged on a corner she "didn't touch".
    this.body.setSize(10, 21).setOffset(5, FRAME_H - 21);
    this.body.setAllowGravity(false); // we apply our own gravity below
    this.setCollideWorldBounds(true);

    this.setDepth(20);
    this.play(PRINCESS_ANIMS.idle);
  }

  get onGround(): boolean {
    return this.body.blocked.down || this.body.touching.down || this.supportFrames > 0;
  }

  /**
   * Something that isn't a normal platform (a giraffe's neck ramp) holds her up with her feet at `footY`.
   * Called every frame she's on it.
   */
  standOn(footY: number): void {
    this.body.y = footY - this.body.height;
    if (this.body.velocity.y > 0) this.body.velocity.y = 0;
    this.supportFrames = 2;
  }

  /** A gentle push back (from a practice obstacle): a little hop away, then a short safe blink. */
  nudge(fromX: number): void {
    const away = Math.sign(this.x - fromX) || -1;
    this.body.velocity.x = away * PRACTICE.nudgeSpeedX;
    this.body.velocity.y = -PRACTICE.nudgeSpeedY;
    this.nudgeTimer = 0.25;
    this.safeBlinkTimer = PRACTICE.blinkTime;
  }

  /** Show the happy cheer pose for a moment (used when she finds a jewel). */
  cheer(seconds: number = C.cheerTime): void {
    this.cheerTimer = seconds;
  }

  /** True while she's blinking after reappearing: nothing can bonk her. */
  get isSafeBlinking(): boolean {
    return this.safeBlinkTimer > 0;
  }

  /** Hide her and stop all movement (the moment of the sparkle poof). */
  freeze(): void {
    this.frozen = true;
    this.setVisible(false);
    this.body.stop();
    this.body.enable = false;
  }

  /** Show her again and start the protective blink. */
  unfreeze(blinkSeconds: number): void {
    this.frozen = false;
    this.setVisible(true);
    this.body.enable = true;
    this.safeBlinkTimer = blinkSeconds;
    this.bufferTimer = 0;
    this.coyoteTimer = 0;
  }

  /** Call once per frame from the scene. `delta` is milliseconds since last frame. */
  update(delta: number): void {
    if (this.frozen) return;
    // Cap the time step so a hiccup (like switching browser tabs) can't make her jump through the floor.
    const dt = Math.min(delta / 1000, 1 / 20);
    const body = this.body;
    const onGround = this.onGround;
    const cheering = this.cheerTimer > 0;
    this.nudgeTimer -= dt;
    const inControl = this.controlsEnabled && !cheering && this.nudgeTimer <= 0;
    this.cheerTimer -= dt;
    if (this.supportFrames > 0) this.supportFrames--;

    // Protective blink after reappearing: flicker every 0.1 s, then fully visible again.
    if (this.safeBlinkTimer > 0) {
      this.safeBlinkTimer -= dt;
      if (this.safeBlinkTimer <= 0) this.setAlpha(1);
      else if (this.softBlink) this.setAlpha(0.6 + 0.4 * Math.abs(Math.cos(this.safeBlinkTimer * Math.PI * 1.5)));
      else this.setAlpha(Math.floor(this.safeBlinkTimer * 10) % 2 === 0 ? 0.35 : 1);
    }

    // ---------- Landing thud (only after a real fall, not little steps) ----------
    if (onGround && this.wasAirborne && this.fallSpeed > 140 && !this.underwater) sfx.land();
    this.wasAirborne = !onGround;
    this.fallSpeed = onGround ? 0 : Math.max(this.fallSpeed, body.velocity.y);

    // ---------- Coyote time ----------
    // While she stands on ground the timer stays full. Once she leaves the ground it starts
    // counting down, and she may still jump until it reaches zero.
    if (onGround) {
      this.coyoteTimer = C.coyoteTime;
      this.airJumpsLeft = C.doubleJump || this.helper ? 1 : 0;
    } else {
      this.coyoteTimer -= dt;
    }

    // ---------- Jump buffer ----------
    // A press fills the buffer timer. The jump happens as soon as she is allowed to jump
    // (on the ground or within coyote time), as long as the timer hasn't run out.
    const pressedJump = inControl && controls.justPressed('jump');
    if (pressedJump) this.bufferTimer = C.jumpBuffer;
    else this.bufferTimer -= dt;

    if (this.underwater && pressedJump && this.coyoteTimer <= 0) {
      // Swimming: every tap is a stroke upward (as many as she likes).
      body.velocity.y = Math.min(body.velocity.y, -WATER.swimSpeed);
      sfx.swim();
      this.bufferTimer = 0;
    } else if (this.bufferTimer > 0 && this.coyoteTimer > 0) {
      this.jump();
    } else if (pressedJump && !onGround && this.airJumpsLeft > 0) {
      this.airJumpsLeft--;
      this.jump();
    }

    // ---------- Running ----------
    // With auto-run she walks right by herself; holding left still lets her turn back.
    const dir = inControl ? controls.moveX || (this.autoRun ? 1 : 0) : 0;
    const target = dir * (this.underwater ? WATER.runSpeed : C.runSpeed);
    const speedingUp = dir !== 0 && Math.sign(body.velocity.x) !== -dir;
    let rate = speedingUp ? C.acceleration : C.deceleration;
    if (!onGround) rate *= C.airControl;
    if (this.nudgeTimer <= 0) body.velocity.x = approach(body.velocity.x, target, rate * dt);
    if (dir !== 0) this.facing = dir;
    this.setFlipX(this.facing < 0);

    // ---------- Gravity (three flavors) ----------
    if (body.velocity.y >= 0) this.launched = false;
    let gravity = C.gravityFalling;
    if (body.velocity.y < 0)
      gravity = this.launched || (inControl && controls.isDown('jump')) ? C.gravityRisingHeld : C.gravityRising;
    if (this.underwater) {
      body.velocity.y = Math.min(body.velocity.y + WATER.gravity * dt, WATER.maxFallSpeed);
      // Never swim up off the top of the screen (so she can't float over gates).
      if (body.y < 2) {
        body.y = 2;
        if (body.velocity.y < 0) body.velocity.y = 0;
      }
    } else {
      body.velocity.y = Math.min(body.velocity.y + gravity * dt, C.maxFallSpeed);
    }

    // ---------- Never off the left edge of the screen ----------
    // (scrollX is the world position of the screen's left edge.)
    const leftEdge = this.scene.cameras.main.scrollX;
    if (body.x < leftEdge) {
      body.x = leftEdge;
      if (body.velocity.x < 0) body.velocity.x = 0;
    }

    // ---------- Wand ----------
    this.wandTimer -= dt;
    if (inControl && controls.justPressed('wand')) this.waveWand();

    this.chooseAnimation(onGround, cheering);
  }

  /** Sent flying upward by something (like a bounce pad). */
  launch(speed: number): void {
    this.body.velocity.y = -speed;
    this.launched = true;
    this.bufferTimer = 0;
    this.coyoteTimer = 0;
  }

  private jump(): void {
    if (this.underwater) sfx.swim();
    else sfx.jump();
    this.body.velocity.y = -(this.underwater ? WATER.jumpSpeed : C.jumpSpeed);
    this.bufferTimer = 0;
    this.coyoteTimer = 0; // used up: no second jump from the same coyote window
  }

  private waveWand(): void {
    this.wandTimer = C.wandWaveTime;
    this.anims.timeScale = 1;
    this.play(PRINCESS_ANIMS.wand); // restarts the wave even if already waving: no cooldown
    sfx.twinkle();
    new SparkleShot(
      this.scene,
      this.x + WAND_TIP_OFFSET.x * this.facing,
      this.y + WAND_TIP_OFFSET.y,
      this.facing,
    );
  }

  /**
   * Move her instantly to a spot AND snap the camera there too. Without the camera snap,
   * the "never off the left edge" rule would see the camera still showing the old place
   * and push her back toward it.
   */
  teleport(x: number, y: number, snapCamera = true): void {
    this.body.reset(x, y);
    if (!snapCamera) return;
    const cam = this.scene.cameras.main;
    const bounds = cam.getBounds();
    cam.scrollX = Phaser.Math.Clamp(x - cam.width / 2, bounds.x, Math.max(bounds.x, bounds.right - cam.width));
  }

  private chooseAnimation(onGround: boolean, cheering: boolean): void {
    if (cheering) {
      this.play(PRINCESS_ANIMS.cheer, true);
      return;
    }
    if (this.wandTimer > 0) return; // let the wave finish
    if (!onGround) {
      this.play(this.body.velocity.y < 0 ? PRINCESS_ANIMS.jumpUp : PRINCESS_ANIMS.fall, true);
      return;
    }
    const speed = Math.abs(this.body.velocity.x);
    if (speed > 5) {
      this.play(PRINCESS_ANIMS.run, true);
      // Legs move slower when she's going slower (e.g. just starting to run).
      this.anims.timeScale = Phaser.Math.Clamp(speed / C.runSpeed, 0.5, 1);
    } else {
      this.play(PRINCESS_ANIMS.idle, true);
      this.anims.timeScale = 1;
    }
  }
}

/** Move `value` toward `target` by at most `maxStep`, without overshooting. */
function approach(value: number, target: number, maxStep: number): number {
  if (value < target) return Math.min(value + maxStep, target);
  return Math.max(value - maxStep, target);
}
