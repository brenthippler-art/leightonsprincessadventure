import Phaser from 'phaser';
import { GAME_HEIGHT, TILE_SIZE } from '../constants';
import type { GentleReset } from './GentleReset';

/**
 * DEVELOPER-ONLY DEBUG OVERLAY (for playtesting). LevelScene only loads this file during
 * `npm run dev`, so it never exists in the real build.
 *
 * Press the ` key (backquote, left of 1) in a level to show/hide:
 *   - a green flag at her current LAST SAFE SPOT (where she'd reappear after a bonk)
 *   - blue lines at every CHECKPOINT
 *   - red numbers: how many BONKS happened at each spot this session (across restarts)
 *   - Phaser's physics boxes (her hit box, obstacle hit boxes, platforms)
 */

export const DEBUG_BONK = 'debug-bonk';

/** Bonk counts for the whole session: "levelId:column" -> count. Survives level restarts. */
const sessionBonks = new Map<string, number>();
let visible = false;

export function attachDebugOverlay(scene: Phaser.Scene, levelId: number, reset: GentleReset, checkpoints: { x: number }[]): void {
  const g = scene.add.graphics().setDepth(500);
  const labels: Phaser.GameObjects.Text[] = [];

  const onBonk = (x: number) => {
    const key = `${levelId}:${Math.round(x / TILE_SIZE)}`;
    sessionBonks.set(key, (sessionBonks.get(key) ?? 0) + 1);
    console.info(`[debug] bonk at level ${levelId}, column ${Math.round(x / TILE_SIZE)} (${sessionBonks.get(key)} so far)`);
  };
  scene.events.on(DEBUG_BONK, onBonk);

  const onKey = (e: KeyboardEvent) => {
    if (e.code !== 'Backquote') return;
    visible = !visible;
    scene.physics.world.drawDebug = visible;
    if (visible && !scene.physics.world.debugGraphic) scene.physics.world.createDebugGraphic();
    scene.physics.world.debugGraphic?.setVisible(visible);
  };
  window.addEventListener('keydown', onKey);

  const draw = () => {
    g.clear();
    labels.forEach((l) => l.destroy());
    labels.length = 0;
    if (!visible) return;
    // Checkpoints: blue lines.
    g.lineStyle(1, 0x3f7fff, 0.9);
    for (const c of checkpoints) g.lineBetween(c.x, 0, c.x, GAME_HEIGHT);
    // Last safe spot: a green flag.
    const s = reset.safe;
    g.lineStyle(2, 0x22cc55, 1).lineBetween(s.x, s.bottom, s.x, s.bottom - 20);
    g.fillStyle(0x22cc55, 1).fillTriangle(s.x, s.bottom - 20, s.x + 8, s.bottom - 16, s.x, s.bottom - 12);
    // Bonk counts at each spot (this level only).
    for (const [key, count] of sessionBonks) {
      const [lvl, col] = key.split(':').map(Number);
      if (lvl !== levelId) continue;
      labels.push(
        scene.add
          .text(col * TILE_SIZE, 30, `x${count}`, { fontFamily: 'monospace', fontSize: '8px', color: '#ffffff', backgroundColor: '#cc2244' })
          .setDepth(501),
      );
    }
  };
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, draw);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    window.removeEventListener('keydown', onKey);
    scene.events.off(DEBUG_BONK, onBonk);
    scene.events.off(Phaser.Scenes.Events.POST_UPDATE, draw);
  });
}

/** For quick checks in the console: window.__bonks() lists every bonk spot this session. */
(window as unknown as { __bonks: () => Record<string, number> }).__bonks = () => Object.fromEntries(sessionBonks);
