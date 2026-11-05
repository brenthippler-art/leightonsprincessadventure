import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, JEWEL_COLORS, LEVEL_TOP, SCENES, TILE_SIZE } from '../constants';
import { CAMERA, PARALLAX } from '../config';
import { LAYER_HEIGHTS, prepareTheme, TILE_INDEX } from '../art/themes';
import { loopAnim } from '../art/anim';
import { sfx } from '../audio/sfx';
import { music } from '../audio/Music';
import { SONGS, songForTheme } from '../audio/songs';
import { controls } from '../input/Controls';
import { getLevel } from '../levels';
import { isStandable, T, type LevelData } from '../levels/types';
import { validateLevel } from '../levels/validate';
import { Checkpoint } from '../objects/Checkpoint';
import { createDecor, DRAGON_GIFT, JEWEL_FOUND, type Decor } from '../objects/Decor';
import { sparkleBurst } from '../objects/fx';
import { Jewel } from '../objects/Jewel';
import type { LevelContext } from '../objects/LevelContext';
import type { Barrier } from '../objects/barriers/Barriers';
import type { Puzzle } from '../objects/puzzles/Puzzle';
import { createBarrier, createObstacle, createPuzzle } from '../objects/registry';
import { SparkleShot } from '../objects/SparkleShot';
import { Princess } from '../objects/Princess';
import { loadSave, markJewel } from '../save/Save';
import { GentleReset, type Spot } from '../systems/GentleReset';
import { Hud } from '../ui/Hud';
import { comfort } from '../systems/Comfort';
import { Obstacle as ObstacleClass } from '../objects/Obstacle';

/**
 * LevelScene: builds a level from its data file and runs it.
 * Start it with: this.scene.start(SCENES.level, { levelId: 3 })
 */

export interface LevelSceneData {
  levelId?: number;
}

/** Which level to start when none is given: `?level=N` in the address, or level 1. */
export function defaultLevelId(): number {
  const fromUrl = Number(new URLSearchParams(window.location.search).get('level'));
  return Number.isFinite(fromUrl) && window.location.search.includes('level=') ? fromUrl : 1;
}

interface ParallaxLayer {
  sprite: Phaser.GameObjects.TileSprite;
  factor: number;
}

export class LevelScene extends Phaser.Scene {
  private level!: LevelData;
  private princess!: Princess;
  private reset!: GentleReset;
  private hud!: Hud;
  private jewel: Jewel | null = null;
  private obstacles: ObstacleClass[] = [];
  private barriers: Barrier[] = [];
  private puzzles: Puzzle[] = [];
  private decor: Decor[] = [];
  private layers: ParallaxLayer[] = [];
  /** Current camera look-ahead in pixels (positive = looking right). Glides when she turns. */
  private lookX = CAMERA.lookAhead;
  private finished = false;
  private autoRunOn = false;

  constructor() {
    super(SCENES.level);
  }

  /** Phaser reuses the same scene object each time a level starts, so reset everything here. */
  init(data: LevelSceneData): void {
    this.level = getLevel(data.levelId ?? defaultLevelId());
    // The scene's event emitter survives restarts: drop listeners left by the previous run
    // (baby giraffe, dragon), or they'd fire on objects that no longer exist.
    this.events.off(JEWEL_FOUND);
    this.events.off(DRAGON_GIFT);
    this.jewel = null;
    this.obstacles = [];
    this.barriers = [];
    this.puzzles = [];
    this.decor = [];
    this.layers = [];
    this.lookX = CAMERA.lookAhead;
    this.finished = false;
  }

  create(): void {
    const level = this.level;
    const grid = level.grid;
    const worldWidth = grid[0].length * TILE_SIZE;
    const charAt = (col: number, row: number) => grid[row]?.[col];

    if (import.meta.env.DEV) this.showDevWarnings(validateLevel(level));

    // ---------- Theme art (background layers, tiles, jewel, reskinned pieces) ----------
    const { theme, textures: tex, skin } = prepareTheme(this, level.theme);

    this.layers = [
      { key: tex.far, y: 0, h: LAYER_HEIGHTS.far, factor: PARALLAX.far },
      { key: tex.middle, y: GAME_HEIGHT - LAYER_HEIGHTS.middle, h: LAYER_HEIGHTS.middle, factor: PARALLAX.middle },
      // The near layer sits a little higher, so its flowers and leaves peek out above the ground.
      { key: tex.near, y: GAME_HEIGHT - LAYER_HEIGHTS.near - 20, h: LAYER_HEIGHTS.near, factor: PARALLAX.near },
    ].map((l, i) => ({
      // Each layer is pinned to the screen; we slide its picture sideways at its own speed.
      sprite: this.add.tileSprite(0, l.y, GAME_WIDTH, l.h, l.key).setOrigin(0).setScrollFactor(0).setDepth(-30 + i * 10),
      factor: l.factor,
    }));

    // ---------- Tiles ----------
    // Turn the text map into tile numbers. Ground gets grass on top only where there's sky above it.
    const data = grid.map((row, r) =>
      Array.from(row, (ch, c) => {
        if (ch === T.ground) return charAt(c, r - 1) === T.ground ? TILE_INDEX.groundFill : TILE_INDEX.groundTop;
        if (ch === T.platform) return TILE_INDEX.platform;
        return -1; // empty
      }),
    );
    const map = this.make.tilemap({ data, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
    const tileset = map.addTilesetImage(tex.tiles, tex.tiles, TILE_SIZE, TILE_SIZE, 0, 0)!;
    const layer = map.createLayer(0, tileset, 0, LEVEL_TOP) as Phaser.Tilemaps.TilemapLayer;
    layer.setCollision([TILE_INDEX.groundTop, TILE_INDEX.groundFill, TILE_INDEX.platform]);
    // Floating platforms are "one-way": solid only on top, so she can jump up through them.
    layer.forEachTile((t) => {
      if (t.index === TILE_INDEX.platform) t.setCollision(false, false, true, false);
    });

    // ---------- World edges ----------
    this.physics.world.setBounds(0, 0, worldWidth, GAME_HEIGHT);
    // Walls on the left and right; open at the top (jump freely) and bottom (falls get caught by the reset).
    this.physics.world.setBoundsCollision(true, true, false, false);

    // ---------- Things marked in the map ----------
    const cellSpot = (col: number, row: number): Spot => ({
      x: col * TILE_SIZE + TILE_SIZE / 2,
      bottom: LEVEL_TOP + (row + 1) * TILE_SIZE,
    });
    let start: Spot = cellSpot(2, 8);
    const checkpoints: Checkpoint[] = [];
    grid.forEach((row, r) =>
      Array.from(row).forEach((ch, c) => {
        if (ch === T.start) start = cellSpot(c, r);
        if (ch === T.checkpoint) checkpoints.push(new Checkpoint(this, c, r));
        if (ch === T.jewel && !this.jewel) this.jewel = new Jewel(this, c, r, this.jewelColor(), tex.jewel, theme.jewelGlow);
      }),
    );

    // ---------- Princess ----------
    this.princess = new Princess(this, start.x, start.bottom - 12);
    this.princess.underwater = !!theme.underwater;
    // Helper Mode (parent setting): every obstacle at half speed.
    ObstacleClass.globalSpeed = comfort.helperMode ? 0.5 : 1;
    this.autoRunOn = comfort.autoRun;
    this.physics.add.collider(this.princess, layer);

    // ---------- Toolkit pieces: obstacles, barriers, puzzles (see src/objects/registry.ts) ----------
    const solids = this.physics.add.staticGroup();
    this.physics.add.collider(this.princess, solids);
    const ctx: LevelContext = {
      scene: this,
      princess: this.princess,
      layer,
      solids,
      standableAt: (col, row) => isStandable(charAt(col, row)),
      skin,
    };
    this.decor = (level.decor ?? []).map((def) => createDecor(ctx, def));
    this.barriers = level.barriers.map((def) => createBarrier(ctx, def));
    this.obstacles = level.obstacles.map((def) => createObstacle(ctx, def));
    this.puzzles = level.puzzles.map((def) => createPuzzle(ctx, def));

    // ---------- Camera ----------
    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldWidth, GAME_HEIGHT);
    cam.setRoundPixels(true);
    this.followPrincess();

    // ---------- Gentle reset (safe spots, bonks, extra help) ----------
    this.reset = new GentleReset({
      scene: this,
      princess: this.princess,
      obstacles: this.obstacles,
      standableAt: (col, row) => isStandable(charAt(col, row)),
      start,
      panCameraTo: (x, ms) => {
        this.lookX = CAMERA.lookAhead;
        cam.stopFollow();
        cam.pan(x + this.lookX, GAME_HEIGHT / 2, ms, 'Sine.easeInOut');
      },
      followPrincess: () => this.followPrincess(),
    });

    this.physics.add.overlap(this.princess, this.obstacles, (_p, o) => {
      const obstacle = o as ObstacleClass;
      if (this.finished || !obstacle.harmful) return;
      // Practice obstacles (the first of each kind) only nudge her back; the rest gently reset her.
      if (obstacle.practice) this.reset.nudge(obstacle.x);
      else this.reset.bonk();
    });

    // ---------- Shallow water in the gaps (beach) ----------
    if (tex.water) {
      const water = tex.water;
      for (let c = 0; c < grid[0].length; c++) {
        if (isStandable(charAt(c, 9)) || isStandable(charAt(c, 10))) continue;
        for (const r of [9, 10])
          this.add.sprite(c * TILE_SIZE, LEVEL_TOP + r * TILE_SIZE + 6, water, 0).setOrigin(0).setDepth(25).setAlpha(0.85).play(loopAnim(this, water, 2));
      }
    }
    for (const cp of checkpoints) {
      this.physics.add.overlap(this.princess, cp.zone, () => {
        if (cp.reach()) this.reset.reachedCheckpoint(cp.spot);
      });
    }
    if (this.jewel) {
      const jewel = this.jewel;
      this.physics.add.overlap(this.princess, jewel.zone, () => this.collectJewel(jewel));
      // The finale: the dragon sits on the jewel until he hands it over.
      if (level.decor?.some((d) => d.type === 'dragon')) {
        jewel.hold();
        this.events.once(DRAGON_GIFT, (x: number, y: number) => {
          jewel.release(x, y);
          this.tweens.add({
            targets: jewel,
            x: this.princess.x,
            y: this.princess.y - 20,
            duration: 700,
            ease: 'Sine.InOut',
            onComplete: () => this.collectJewel(jewel),
          });
        });
      }
    }

    // ---------- Developer-only debug overlay (press ` in a level). Never included in the real build. ----------
    if (import.meta.env.DEV) {
      const reset = this.reset;
      const levelId = level.id;
      void import('../systems/DebugOverlay').then((m) => m.attachDebugOverlay(this, levelId, reset, checkpoints));
    }

    // ---------- HUD ----------
    this.hud = new Hud(this, loadSave().jewels, () => this.pauseGame());

    cam.fadeIn(300, 42, 20, 56);
    music.play(songForTheme(level.theme));
  }

  update(_time: number, delta: number): void {
    if (!this.finished && controls.justPressed('pause')) {
      this.pauseGame();
      return;
    }
    const dt = Math.min(delta / 1000, 1 / 20);

    // Auto-run (parent setting): walk on her own, but not inside a puzzle area, so puzzles stay calm.
    this.princess.autoRun = this.autoRunOn && !this.puzzles.some((p) => p.contains(this.princess.x));
    this.princess.update(delta);
    for (const o of this.obstacles) o.tick(dt);
    for (const b of this.barriers) b.tick(dt);
    for (const pz of this.puzzles) pz.tick(dt);
    for (const d of this.decor) d.tick(dt);
    this.checkWandShots();
    if (!this.finished) this.reset.update();

    // Look-ahead: glide the camera's aim a little ahead of where she's facing.
    const cam = this.cameras.main;
    const wanted = CAMERA.lookAhead * this.princess.facing;
    this.lookX += (wanted - this.lookX) * CAMERA.lookAheadLerp;
    cam.setFollowOffset(-this.lookX, 0);

    // Parallax: far layers slide slower than near ones, which makes the world feel deep.
    for (const l of this.layers) l.sprite.tilePositionX = Math.round(cam.scrollX * l.factor);
  }

  /** Any sparkle shot touching an obstacle turns that obstacle friendly. */
  private checkWandShots(): void {
    for (const shot of SparkleShot.live) {
      if (shot.scene !== this) continue;
      const box = shot.getBounds();
      const hit = this.obstacles.find((o) => o.befriendable && Phaser.Geom.Rectangle.Overlaps(box, o.wandArea()));
      if (hit) {
        hit.befriend();
        shot.pop();
        continue;
      }
      // Some decorations react to the wand too (the finale dragon).
      const friend = this.decor.find((d) => d.wandArea && d.onWand && Phaser.Geom.Rectangle.Overlaps(box, d.wandArea()));
      if (friend) {
        friend.onWand!();
        shot.pop();
      }
    }
  }

  private followPrincess(): void {
    this.cameras.main.startFollow(this.princess, true, CAMERA.followLerp, 1, -this.lookX, 0);
  }

  /** Level N's jewel has color N (the test level borrows color 1). */
  private jewelColor(): number {
    return JEWEL_COLORS[this.level.id >= 1 && this.level.id <= 12 ? this.level.id - 1 : 0];
  }

  private pauseGame(): void {
    if (this.finished || this.scene.isPaused()) return;
    this.scene.launch(SCENES.pause, { levelId: this.level.id });
    this.scene.pause();
  }

  /** She touched the jewel: cheer, the jewel flies into the crown, jingle, then on to the map. */
  private collectJewel(jewel: Jewel): void {
    if (this.finished || this.reset.respawning) return;
    this.finished = true;
    this.reset.active = false;

    const p = this.princess;
    p.controlsEnabled = false;
    p.cheer(3);
    sfx.jewel();
    music.play(SONGS.jewelFound, { fade: 0.3 });
    this.events.emit(JEWEL_FOUND);

    const slot = this.level.id >= 1 && this.level.id <= 12 ? this.level.id - 1 : 0;
    const cam = this.cameras.main;
    jewel.detach();
    // Switch the jewel from world position to screen position, so it can fly to the HUD crown.
    jewel.setScrollFactor(0).setPosition(jewel.x - cam.scrollX, jewel.y - cam.scrollY).setDepth(110);
    const target = this.hud.slotPosition(slot);

    // 1) pop up and grow a little, 2) swoop into its socket while shrinking.
    this.tweens.add({
      targets: jewel,
      y: jewel.y - 24,
      scale: 1.8,
      duration: 450,
      ease: 'Quad.Out',
      onComplete: () =>
        this.tweens.add({
          targets: jewel,
          x: target.x,
          y: target.y,
          scale: 0.4,
          duration: 700,
          ease: 'Sine.InOut',
          onComplete: () => {
            jewel.destroy();
            this.hud.fillSlot(slot, this.jewelColor(), true);
            sparkleBurst(this, target.x + cam.scrollX, target.y + cam.scrollY, 10, 16);
            this.time.delayedCall(1300, () => this.finishLevel(slot));
          },
        }),
    });
  }

  private finishLevel(_slot: number): void {
    // Save the jewel (and unlock the next land). Test levels (0, 90) are never saved.
    markJewel(this.level.id);
    const cam = this.cameras.main;
    cam.fadeOut(500, 42, 20, 56);
    // Real levels go to the crown celebration; test levels go straight back to the map.
    const real = this.level.id >= 1 && this.level.id <= 12;
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
      real ? this.scene.start(SCENES.crown, { levelId: this.level.id }) : this.scene.start(SCENES.map, { levelId: 1 }),
    );
  }

  /** Development only: show level-checker warnings in a small red box (and the console). */
  private showDevWarnings(warnings: string[]): void {
    if (!warnings.length) return;
    for (const w of warnings) console.warn(w);
    const text = this.add
      .text(GAME_WIDTH / 2, 26, ['Level check (dev only):', ...warnings.slice(0, 4)].join('\n'), {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffffff',
        backgroundColor: '#b0003a',
        padding: { x: 3, y: 2 },
        wordWrap: { width: GAME_WIDTH - 60 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(200)
      .setInteractive();
    text.on(Phaser.Input.Events.POINTER_DOWN, () => text.destroy());
    this.time.delayedCall(10000, () => text.destroy());
  }
}
