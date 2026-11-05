import type { Song } from '../Music';
import { aaba, arp, bass, pad } from './helpers';

/**
 * Songs for the menus and big moments. All melodies are original, written for this game.
 * Each 16-bar song uses one chord per bar; the bass, pad chords and arpeggios are built from that list.
 */

// ---------------------------------------------------------------------------------------------
// TITLE THEME: royal and sparkly. C major, a stately walking tempo, sparkle arpeggios on top.
// ---------------------------------------------------------------------------------------------
const titleChords = ['C', 'F', 'G', 'C', 'C', 'F', 'G', 'G', 'Am', 'F', 'Dm', 'G', 'C', 'F', 'G', 'C'];
export const titleSong: Song = {
  name: 'Title',
  bpm: 96,
  echo: 0.3,
  pulse1: {
    duty: 0.25,
    notes: aaba(
      ['C5 - E5 G5 C6 - G5 -', 'A5 - G5 F5 A5 - - -', 'G5 - F5 E5 D5 - E5 F5', 'E5 - - - G4 - - -'],
      'D5 - - - B4 - - -',
      ['E5 - C5 E5 A5 - G5 -', 'F5 - A5 - C6 - A5 -', 'D5 - F5 A5 G5 F5 E5 D5', 'D5 - - - G5 - - -'],
      'C5 - - - - - . .',
    ),
  },
  pulse2: { duty: 0.125, notes: arp(titleChords, 5, [0, 1, 2, 3, 2, 1, 2, 1]), volume: 0.8 },
  triangle: { notes: bass(titleChords, 'halves') },
  pad: { notes: pad(titleChords) },
  noise: { notes: 'k . h . s . h . | k . h . s . h h', volume: 0.7 },
};

// ---------------------------------------------------------------------------------------------
// MAP THEME: a gentle walking tune. F major, walking bass, soft shaker.
// ---------------------------------------------------------------------------------------------
const mapChords = ['F', 'C', 'Bb', 'F', 'F', 'Bb', 'C', 'C', 'Dm', 'Bb', 'F', 'C', 'F', 'Bb', 'C', 'F'];
export const mapSong: Song = {
  name: 'Map',
  bpm: 92,
  echo: 0.2,
  pulse1: {
    duty: 0.5,
    notes: aaba(
      ['F4 - A4 - C5 - A4 -', 'G4 - E4 - C4 - E4 -', 'D4 - F4 - Bb4 - A4 G4', 'A4 - - - - - . .'],
      'G4 - - - E4 - - -',
      ['D5 - C5 - A4 - F4 -', 'D5 - Bb4 - F4 - D4 -', 'C5 - A4 - F4 - A4 C5', 'Bb4 - A4 - G4 - - -'],
      'F4 - - - - - . .',
    ),
  },
  pulse2: { duty: 0.125, notes: arp(mapChords, 5, [0, 2, 1, 2], 2), volume: 0.6 },
  triangle: { notes: bass(mapChords, 'walk') },
  pad: { notes: pad(mapChords), volume: 0.8 },
  noise: { notes: 'k . c . k . c .', volume: 0.6 },
};

// ---------------------------------------------------------------------------------------------
// JEWEL FOUND: a short sparkly jingle (plays once).
// ---------------------------------------------------------------------------------------------
export const jewelFoundSong: Song = {
  name: 'Jewel found',
  bpm: 140,
  loop: false,
  echo: 0.35,
  pulse1: { duty: 0.25, notes: 'C5 E5 G5 C6 - E6 - G6 | - - - - - - . .' },
  pulse2: { duty: 0.125, notes: 'G4 C5 E5 G5 - C6 - E6 | - - - - - - . .', volume: 0.8 },
  triangle: { notes: 'C3 - - - G2 - - - | C3 - - - - - . .' },
  pad: { notes: 'C4+E4+G4 - - - - - - - | C5+E5+G5 - - - - - . .' },
  noise: { notes: 'k . . . s . . . | k . . . . . . .' },
};

// ---------------------------------------------------------------------------------------------
// ENDING FANFARE: a 4-bar fanfare, then a joyful 8-bar celebration that loops.
// ---------------------------------------------------------------------------------------------
const endingChords = ['C', 'G', 'F', 'C', 'C', 'F', 'G', 'C', 'F', 'C', 'G', 'C'];
export const endingSong: Song = {
  name: 'Ending',
  bpm: 112,
  echo: 0.3,
  loopStart: 32, // after the 4-bar fanfare, loop the celebration
  pulse1: {
    duty: 0.25,
    notes: [
      'C5 - C5 G4 C5 - E5 -', 'G5 - - - E5 - C5 -', 'F5 - A5 - G5 - F5 -', 'E5 - - - - - . .',
      'E5 G5 C6 - G5 - E5 -', 'F5 A5 C6 - A5 - F5 -', 'G5 - F5 E5 D5 - E5 F5', 'E5 - - - C5 - - -',
      'A5 - G5 F5 E5 - D5 -', 'F5 - E5 D5 C5 - D5 -', 'E5 - D5 C5 B4 - C5 D5', 'C5 - - - - - . .',
    ].join(' | '),
  },
  pulse2: { duty: 0.125, notes: arp(endingChords, 5, [0, 1, 2, 3]), volume: 0.8 },
  triangle: { notes: bass(endingChords, 'bounce') },
  pad: { notes: pad(endingChords) },
  noise: { notes: 'k . h . s . h . | k . h k s . h .' },
};
