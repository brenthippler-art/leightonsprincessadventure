# Leighton's Princess Adventure: project rules

A 16-bit-style, left-to-right side-scrolling platformer for a 4-year-old.
Princess Leighton lost the 12 jewels from her crown and travels through 12 themed levels
to find them and win back her throne. **It must be very easy: a 4-year-old has to be able to play and win.**

Tech: Vite + TypeScript + Phaser 4 (Arcade Physics). Internal resolution 320x180, scaled to fit
(`pixelArt: true`, `roundPixels: true`), dark purple letterbox. Must work on desktop and on a
tablet in landscape. Developer is on Windows; npm scripts must work there.

## The rules (follow these for every change)

1. **There is NO losing.** No lives, no timer, no game over, no score that decreases.
   If the princess touches an obstacle or falls, she gently respawns on the last safe ground she stood on.
2. **A 4-year-old can't read.** Every instruction must be shown with pictures, colors, arrows, or sound.
   No words on screen for the player.
3. **No network calls of any kind.** No analytics, no fonts or images from CDNs, no external links, no ads.
   Everything ships in the bundle.
4. **All art is original pixel art generated in code** (pixel arrays or drawn to textures at boot).
   No downloaded sprites. No copyrighted characters.
5. **All music and sound effects are original**, generated with the Web Audio API in a 16-bit console style.
   Don't recreate any existing game's melodies.
6. **After every change, explain in plain language** what changed, which files, and why, so the developer can learn from it.

## Where things live

- `src/main.ts`: Phaser game config (size, scaling, physics, scene list).
- `src/constants.ts`: screen size, colors, scene keys.
- `src/config.ts`: ALL gameplay tuning numbers (speeds, jump, gravity, coyote time, buffer, double jump). Put new tuning numbers here, with comments.
- `src/objects/`: game objects (Princess, SparkleShot, Obstacle, Checkpoint, Jewel, fx sparkles).
- `src/systems/GentleReset.ts`: safe-spot tracking, bonk/respawn, and the quiet extra help (rule 1 lives here).
- `src/ui/Hud.ts`: the crown + pause button. The HUD shows NOTHING else (no numbers, timers, scores, bonk counts).
- `src/scenes/`: BootScene -> TitleScene -> StoryScene (first play only) -> MapScene -> LevelScene -> CrownScene -> MapScene ... -> EndingScene (after level 12) -> MapScene. PauseScene sits on top of LevelScene.
  Scene data: Map `{ levelId?, walkFrom? }`, Level `{ levelId }`, Crown `{ levelId }`, Pause `{ levelId }`. Everything else is read from the save.
- `src/art/`: code-generated sprites and tiles (`pixels.ts` helpers, `uiArt.ts` UI, `princess.ts` Leighton, `effects.ts` sparkles, `levelArt.ts` jewel/flags/obstacles/crown, `toolkitArt.ts` placeholder pieces, `giraffeArt.ts` giraffes, `anim.ts` loopAnim helper).
- `src/art/themes/`: one file per theme (13 including `test.ts`), shared drawing helpers in `common.ts`, the `Theme`/`Skin` types in `types.ts`, and the registry in `index.ts`.
- `src/objects/Decor.ts`: non-solid pictures and friendly characters (signs, background giraffes, baby giraffe).
- `src/audio/`: all sound, made with the Web Audio API (no files):
  - `Synth.ts`: the "sound chip" (pulse with 12.5/25/50% duty, triangle, noise drums, sine pad; ADSR, vibrato, echo; music and sfx buses with on/off; soft limiter; suspends while the tab is hidden).
  - `Music.ts`: the tracker song format (documented at the top) and the `music` player (crossfades, pause/resume, one-shot songs).
  - `songs/`: original songs (`menus.ts`, `lands.ts`), `helpers.ts` (chords, bass, arpeggios, A A B A form), `index.ts` (`SONGS`, `songForTheme`).
  - `sfx.ts`: every sound effect. `Speech.ts`: optional spoken hints.
- `src/save/Save.ts`: THE save file (one localStorage key): `{ version, jewels[12], unlocked, seenIntro, settings: { music, sfx, helperMode, autoRun, spokenHints, reduceFlashing } }`. Every read/write is in try/catch, with an in-memory copy so the game works even if storage is blocked. Use its helpers (`markJewel`, `isUnlocked`, `hasJewel`, `loadSettings`...), never localStorage directly.
- `src/art/mapArt.ts`: menu art (sunset castle, storybook map, land badges, padlock, yes/no, throne, star). `src/art/pixelFont.ts`: the code-drawn title font.
- `src/levels/`: level data files (format documented in `types.ts`), `validate.ts` level checker (dev only), `index.ts` registry.
- `src/input/`: the shared controls layer. Touch buttons only show during levels; menus use their own big buttons.
- Hidden parent settings: hold the small crown in the title screen's top-left corner for 5 seconds (TitleScene `openParentPanel`): Helper mode, Auto-run, Spoken hints, Reduce flashing, Unlock all lands, Clear progress. Gameplay code reads them through `comfort` (`src/systems/Comfort.ts`); spoken hints are checked inside `speak()`.
- `src/systems/DebugOverlay.ts`: DEV-ONLY playtest overlay (backquote key: safe spot, checkpoints, bonk counts). Only loaded via `import.meta.env.DEV` dynamic import; it must never reach the production bundle.
- PWA: `public/manifest.webmanifest`, icons in `public/icons/` (made by `npm run icons` from `scripts/make-icons.mjs`), and `dist/sw.js` generated by the plugin in `vite.config.ts` (cache-first, same-origin only; registered in `main.ts` only in production). `vercel.json` sets deploy headers.

## Controls conventions

- Scenes read input ONLY through `controls` from `src/input/Controls.ts`
  (`controls.moveX`, `controls.isDown(action)`, `controls.justPressed(action)`).
  Never read keys, gamepads, or pointers directly in a scene.
- Actions (`ACTIONS` in Controls.ts): `left`, `right`, `jump`, `wand`, `pause` (Esc / P / controller Start; touch uses the HUD pause button).
- `ControlsOverlayScene` (touch buttons + fullscreen button) comes after the game scenes in the scene list so it draws on top of them; `PauseScene` is last so it covers everything.
- `LevelScene` is reused by Phaser for every level: reset all per-level state in `init()`.
- Be forgiving with timing (coyote time, jump buffering, generous hit areas).

## Level conventions

- Levels are exactly 11 rows tall and 8-12 screens (160-240 columns) wide. Legend: `.` sky, `#` ground, `=` one-way platform, `S` start, `C` checkpoint, `J` jewel.
- Obstacles, barriers and puzzles go in their own lists (`obstacles`, `barriers`, `puzzles`) by `type` with col/row and optional parameters. All types and parameters are documented in `src/levels/types.ts`; `src/objects/registry.ts` maps each type key to its class. Keep gaps to 3 tiles or less, and keep obstacles at least 4 columns from the start.
- Run `npm run dev` after editing a level: the level checker reports problems in the console and in a red box on screen.
- Test levels: id 0 = playground, id 90 = toolkit (one of every piece). Open any level with `?level=N` in the address (default is level 1). Only ids 1-12 save jewels.
- Real levels are `src/levels/levelNN.ts`, registered in `src/levels/index.ts` (`LEVELS`). All 12 are built. Level 12 ends with the dragon finale (`dragon` decor on the 'J' cell holds the jewel until 3 wand waves).
- Difficulty ramp (enforced by the level checker): levels 1-4 about 8 screens, gaps <= 2, 1 puzzle, 2-3 obstacle kinds; 5-8 about 10 screens, gaps <= 3, 2 puzzles; 9-12 about 12 screens, gaps <= 3, 2-3 puzzles. Every level: a calm first screen (cols 0-19: no obstacles, puzzles or gaps), a checkpoint at least every 2 screens, and the FIRST obstacle of each kind marked `practice: true` (touching it only nudges her back).
- Giraffes are always friendly, never obstacles.

## Theme conventions (src/art/themes/)

- A theme paints 3 parallax layers (far 320x180, middle 320x90, near 320x40), a 48x16 tile strip ([ground top] [ground fill] [platform]), and a jewel (`GemStyle`), and may return a `Skin` mapping pieces to its own textures (normal + friendly versions, as 2-frame strips). Anything not in the skin falls back to the placeholder art.
- Bright, cheerful, limited palette, 1-pixel dark outline (`OUT`), nothing scary (calm or happy faces, no fangs or stingers).
- `waterInGaps` draws shallow water in gaps; `underwater` switches the princess to swimming physics (`WATER` in config) and stops her rising above the screen top.
- Gaps must be easy to SEE: the ground's top layer must contrast with the near background layer (don't make both white, as learned on the cloud and snow levels).
- Theme files: test, meadow, jungle, beach, sea, candy, farm, clouds, snow, toys, caves, night, castle. Skin options include `walkerFriendStays`, `hopperFriendStops` (goats bleat), `plank` (push-block bridge), `movingPlatform` (2-wide, e.g. toy train), `bell` (pattern bells), and `jewelGlow` (shimmering jewel).
- Background "near" layer details must never look like solid things she has to jump over: draw them pale and without outlines.
- `LevelScene.init()` removes scene-event listeners (`JEWEL_FOUND`, `DRAGON_GIFT`) because the scene's event emitter survives restarts. Any new decor that listens to scene events needs the same cleanup.
- Prefer moving platforms with `body.setDirectControl(true)` + `setPosition` for curved paths (vines); one-way pieces must be level with the ground where she steps on and off.

## Toolkit conventions (src/objects/)

- Every obstacle extends `Obstacle`: moves itself (`body.moves = false`), never faster than `MAX_OBSTACLE_SPEED` (half her run speed), shows a tell (wiggle/glow/sound) before acting, honours `speedScale`, reports `zone()` for safe-spot checks, and implements `turnFriendly()` for the wand. Friendly obstacles are harmless forever.
- Barriers never bonk. Moving platforms use real velocity (so Arcade carries her) and snap exactly to their end points.
- Every puzzle extends `Puzzle`: wrong tries only call `wrong()` (soft "hmm" + gentle shake); right steps call `progress()` (resets hints); `hintTarget()` says what to glow at/point at; `hintText()` is the optional spoken hint.
- Spoken hints use ONLY on-device voices (`localService`), never network voices (rule 3). They are a bonus, never required.
- Placeholder art lives in `src/art/toolkitArt.ts`; themes reskin pieces by swapping those textures.
- Phaser tweens run on the real clock; when scripting tests that fast-forward `game.step`, wait real time too.

## Audio conventions

- All music must be ORIGINAL: never copy or imitate an existing song or game melody (no nursery-rhyme or holiday-tune quotes either).
- Keep it gentle: moderate volumes (song channel volumes near the defaults in `Music.ts`), no harsh or sad sounds, no sudden loud peaks. Wrong answers get the soft `hmm`, bonks get the upward `boing`.
- Sound only starts after the first tap/key (browser rule): the title screen's first tap starts the music. Every `sfx.*` call is silently skipped until then.
- Scenes choose music with `music.play(...)`; the player crossfades. Land songs come from `songForTheme(theme)`.
- Songs are 30-60 s before looping; check new songs: every channel string the same length (drums may be shorter and loop), all tokens valid.

## Checks before finishing a change

- `npm run build` passes (it type-checks first).
- No `http://` or `https://` resources are loaded at runtime.

## Comfort and accessibility rules

- Every color-coded thing also has a unique shape (buttons, bells, gems). Never rely on color alone.
- No full-screen flashes or bright full-screen fades (use the dark purple 42,20,56 for fades).
- Respect `comfort.reduceFlashing`: fewer/softer sparkles, no color cycling, gentle glows. Sparkles share a budget (`MAX_LIVE` in `fx.ts`) to keep older iPads at 60 fps.
- Obstacles honour `Obstacle.globalSpeed` (Helper mode halves it); puzzle hints honour the helper hint scale.
