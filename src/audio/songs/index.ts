import type { ThemeKey } from '../../levels/types';
import type { Song } from '../Music';
import {
  beachSong,
  candySong,
  castleSong,
  cavesSong,
  cloudsSong,
  dragonHappySong,
  dragonSleepySong,
  farmSong,
  jungleSong,
  meadowSong,
  nightSong,
  seaSong,
  snowSong,
  toysSong,
} from './lands';
import { endingSong, jewelFoundSong, mapSong, titleSong } from './menus';

/** Every song in the game, by name. */
export const SONGS = {
  title: titleSong,
  map: mapSong,
  jewelFound: jewelFoundSong,
  ending: endingSong,
  dragonSleepy: dragonSleepySong,
  dragonHappy: dragonHappySong,
};

/** Which song plays in each land (the test levels borrow the meadow song). */
const THEME_SONGS: Record<ThemeKey, Song> = {
  test: meadowSong,
  meadow: meadowSong,
  jungle: jungleSong,
  beach: beachSong,
  sea: seaSong,
  candy: candySong,
  farm: farmSong,
  clouds: cloudsSong,
  snow: snowSong,
  toys: toysSong,
  caves: cavesSong,
  night: nightSong,
  castle: castleSong,
};

export function songForTheme(theme: ThemeKey): Song {
  return THEME_SONGS[theme];
}
