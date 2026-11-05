/**
 * THE SAVE FILE. Everything the game remembers between visits, in ONE small object kept in this
 * browser's localStorage (never sent anywhere). Every read and write is wrapped in try/catch: if
 * storage is blocked (private browsing, strict settings), the game still plays and simply
 * remembers things until the page is closed.
 *
 *   {
 *     version: 1,
 *     jewels:    [true, false, ...],   12 entries: jewels[0] is level 1's Ruby, ... jewels[11] the Heart Jewel
 *     unlocked:  3,                     the highest level she may play (finishing level N unlocks N+1)
 *     seenIntro: true,                  the story intro plays only the first time
 *     settings:  {
 *       music, sfx         the pause-screen speaker buttons
 *       helperMode         parent setting: double jump, obstacles at half speed, faster puzzle hints
 *       autoRun            parent setting: she walks forward on her own (only jump and wand needed)
 *       spokenHints        parent setting: the friendly voice on/off
 *       reduceFlashing     parent setting: softer sparkles and blinking
 *     }
 *   }
 */

const KEY = 'leightons-princess-adventure/save';
/** Older keys from earlier versions of the game; read once and folded into the new save. */
const OLD_PROGRESS_KEY = 'leightons-princess-adventure/v1';
const OLD_SETTINGS_KEY = 'leightons-princess-adventure/settings';

export const LEVEL_COUNT = 12;

export interface Settings {
  music: boolean;
  sfx: boolean;
  helperMode: boolean;
  autoRun: boolean;
  spokenHints: boolean;
  reduceFlashing: boolean;
}

const DEFAULT_SETTINGS: Settings = { music: true, sfx: true, helperMode: false, autoRun: false, spokenHints: true, reduceFlashing: false };

export interface SaveData {
  version: 1;
  jewels: boolean[];
  unlocked: number;
  seenIntro: boolean;
  settings: Settings;
}

function fresh(): SaveData {
  return { version: 1, jewels: Array(LEVEL_COUNT).fill(false), unlocked: 1, seenIntro: false, settings: { ...DEFAULT_SETTINGS } };
}

function readJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Kept in memory too, so the game works (for this visit) even when storage is blocked. */
let cache: SaveData | null = null;

/** Read the save, repairing anything missing or odd (and bringing over older saves). */
export function loadSave(): SaveData {
  if (cache) return cache;
  const data = fresh();
  const stored = readJson(KEY) as Partial<SaveData> | null;
  const oldProgress = readJson(OLD_PROGRESS_KEY) as { jewels?: boolean[] } | null;
  const oldSettings = readJson(OLD_SETTINGS_KEY) as Partial<Settings> | null;
  const src = stored ?? {};
  const jewels = src.jewels ?? oldProgress?.jewels ?? [];
  data.jewels = data.jewels.map((_, i) => !!jewels[i]);
  // Unlocked is at least "the level after the furthest jewel", so it can never be lost.
  const furthest = data.jewels.lastIndexOf(true) + 1;
  data.unlocked = Math.min(LEVEL_COUNT, Math.max(1, Number(src.unlocked) || 1, furthest + 1));
  data.seenIntro = !!src.seenIntro || data.jewels.some(Boolean);
  const settings: Partial<Settings> = src.settings ?? oldSettings ?? {};
  data.settings = {
    music: settings.music !== false,
    sfx: settings.sfx !== false,
    helperMode: settings.helperMode === true,
    autoRun: settings.autoRun === true,
    spokenHints: settings.spokenHints !== false,
    reduceFlashing: settings.reduceFlashing === true,
  };
  cache = data;
  if (!stored && (oldProgress || oldSettings)) writeSave(data);
  return data;
}

function writeSave(data: SaveData): void {
  cache = data;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage blocked: keep going with the in-memory copy.
  }
}

/** She found level N's jewel: remember it and unlock the next land. */
export function markJewel(levelId: number): void {
  if (levelId < 1 || levelId > LEVEL_COUNT) return; // test levels never save
  const data = loadSave();
  data.jewels[levelId - 1] = true;
  data.unlocked = Math.min(LEVEL_COUNT, Math.max(data.unlocked, levelId + 1));
  writeSave(data);
}

export function hasJewel(levelId: number): boolean {
  return !!loadSave().jewels[levelId - 1];
}

export function isUnlocked(levelId: number): boolean {
  return levelId >= 1 && levelId <= loadSave().unlocked;
}

export function markIntroSeen(): void {
  const data = loadSave();
  data.seenIntro = true;
  writeSave(data);
}

export function loadSettings(): Settings {
  return { ...loadSave().settings };
}

export function saveSettings(settings: Settings): void {
  const data = loadSave();
  data.settings = { ...settings };
  writeSave(data);
}

/** Parent setting: open every land (the jewels themselves are not given). */
export function unlockAll(): void {
  const data = loadSave();
  data.unlocked = LEVEL_COUNT;
  writeSave(data);
}

/** The hidden parent reset: forget jewels, unlocks and the intro (sound settings are kept). */
export function resetProgress(): void {
  const data = fresh();
  data.settings = loadSave().settings;
  writeSave(data);
  try {
    window.localStorage.removeItem(OLD_PROGRESS_KEY);
    window.localStorage.removeItem(OLD_SETTINGS_KEY);
  } catch {
    // ignore
  }
}
