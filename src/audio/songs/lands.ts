import type { Song } from '../Music';
import { aaba, arp, bass, pad, transpose } from './helpers';

/**
 * One original song per land, plus the finale dragon's tune. Happy and calm, never frantic.
 * Most are 16 bars (A A B A); see helpers.ts for how aaba() and the chord helpers work.
 */

// 1. FLOWER MEADOW: bouncy and bright. G major.
const meadowChords = ['G', 'C', 'D', 'G', 'G', 'C', 'D', 'D', 'Em', 'C', 'G', 'D', 'G', 'C', 'D', 'G'];
export const meadowSong: Song = {
  name: 'Flower Meadow',
  bpm: 120,
  pulse1: {
    duty: 0.25,
    notes: aaba(
      ['G4 B4 D5 - B4 - D5 -', 'E5 - D5 C5 E5 - - -', 'D5 - C5 B4 A4 - B4 C5', 'B4 - G4 - - - . .'],
      'A4 - - - D5 - - -',
      ['B4 - E5 - G5 - E5 -', 'C5 - E5 - G5 - E5 C5', 'D5 - B4 - G4 - B4 D5', 'C5 - B4 - A4 - - -'],
      'G4 - - - G5 - . .',
    ),
  },
  pulse2: { duty: 0.5, notes: arp(meadowChords, 4, [0, 2, 1, 2], 2), volume: 0.7 },
  triangle: { notes: bass(meadowChords, 'bounce') },
  pad: { notes: pad(meadowChords), volume: 0.6 },
  noise: { notes: 'k . h k s . h .' },
};

// 2. ENCHANTED JUNGLE: curious and a little magical, with light tropical percussion. A minor.
const jungleChords = ['Am', 'Am', 'F', 'G', 'Am', 'Am', 'F', 'E', 'Dm', 'Am', 'Dm', 'E', 'Am', 'Am', 'F', 'Am'];
export const jungleSong: Song = {
  name: 'Enchanted Jungle',
  bpm: 100,
  echo: 0.35,
  pulse1: {
    duty: 0.5,
    notes: aaba(
      ['A4 - . C5 E5 - D5 C5', 'B4 - . A4 E5 - - -', 'F5 - E5 D5 C5 - A4 -', 'B4 - - - D5 - - -'],
      'G#4 - - - B4 - - -',
      ['D5 - F5 - A5 - F5 -', 'E5 - C5 - A4 - C5 -', 'D5 - F5 - E5 D5 C5 B4', 'B4 - - - G#4 - - -'],
      'A4 - - - - - . .',
    ),
  },
  pulse2: { duty: 0.125, notes: arp(jungleChords, 5, [0, 2, 3, 2]), volume: 0.6 },
  triangle: { notes: bass(jungleChords, 'halves') },
  pad: { notes: pad(jungleChords), volume: 0.7 },
  noise: { notes: 'b . w . b b w . | b . w c b . w c' },
};

// 3. SUNNY BEACH: sunny, with a light swing. C major.
const beachChords = ['C', 'Am', 'Dm', 'G', 'C', 'Am', 'Dm', 'G', 'F', 'C', 'D7', 'G', 'C', 'Am', 'G', 'C'];
export const beachSong: Song = {
  name: 'Sunny Beach',
  bpm: 108,
  swing: 0.22,
  pulse1: {
    duty: 0.5,
    notes: aaba(
      ['E5 - G5 - E5 C5 D5 -', 'C5 - A4 - C5 - - -', 'D5 - F5 - A5 G5 F5 -', 'D5 - - - B4 - - -'],
      'G4 - B4 - D5 - - -',
      ['A5 - - G5 F5 - A5 -', 'G5 - E5 - C5 - - -', 'F#5 - - E5 D5 - C5 -', 'B4 - - - D5 - - -'],
      'C5 - - - - - . .',
    ),
  },
  pulse2: { duty: 0.25, notes: arp(beachChords, 4, [2, 1, 0, 1], 2), volume: 0.6 },
  triangle: { notes: bass(beachChords, 'walk') },
  pad: { notes: pad(beachChords), volume: 0.6 },
  noise: { notes: 'k . c . s . c c' },
};

// 4. UNDER THE SEA: slow and dreamy, lots of echo. F major.
const seaChords = ['F', 'Am', 'Bb', 'C', 'F', 'Am', 'Bb', 'Bb', 'Dm', 'Bb', 'F', 'C', 'F', 'Am', 'Bb', 'F'];
export const seaSong: Song = {
  name: 'Under the Sea',
  bpm: 72,
  echo: 0.5,
  pulse1: {
    duty: 0.5,
    volume: 0.85,
    notes: aaba(
      ['A4 - - - C5 - - -', 'E5 - - - D5 - C5 -', 'D5 - - - F5 - - -', 'E5 - - - - - - -'],
      'D5 - - - - - - -',
      ['F5 - - - E5 - D5 -', 'D5 - - - F4 - - -', 'A4 - - - C5 - F5 -', 'E5 - - - G5 - - -'],
      'F5 - - - - - - -',
    ),
  },
  pulse2: { duty: 0.125, bell: true, notes: arp(seaChords, 5, [0, 1, 2, 1], 2), volume: 0.7 },
  triangle: { notes: bass(seaChords, 'root') },
  pad: { notes: pad(seaChords) },
  noise: { notes: '. . . . c . . . | . . . . . . . .', volume: 0.6 },
};

// 5. SWEET TREAT VALLEY: playful, with bouncy short notes. F major.
const candyChords = ['F', 'Dm', 'Gm', 'C', 'F', 'Dm', 'Gm', 'C', 'Bb', 'F', 'G', 'C', 'F', 'Dm', 'C', 'F'];
export const candySong: Song = {
  name: 'Sweet Treat Valley',
  bpm: 126,
  pulse1: {
    duty: 0.125,
    notes: aaba(
      ['C5 . A4 . F4 A4 C5 .', 'D5 . F5 . D5 - A4 .', 'Bb4 . G4 . D5 C5 Bb4 .', 'C5 - - - E5 - . .'],
      'G4 - - - C5 - . .',
      ['D5 F5 D5 . Bb4 . D5 .', 'C5 A4 C5 . F5 . . .', 'B4 D5 B4 . G4 . B4 .', 'C5 - E5 - G5 - . .'],
      'F5 - - - F4 - . .',
    ),
  },
  pulse2: { duty: 0.25, notes: arp(candyChords, 4, [0, 1, 2, 1], 2), volume: 0.6 },
  triangle: { notes: bass(candyChords, 'bounce') },
  pad: { notes: pad(candyChords), volume: 0.5 },
  noise: { notes: 'k . s . k k s .', volume: 0.8 },
};

// 6. FARMYARD: a country hoedown feel (fiddle-like pulse with vibrato, oom-pah bass). G major.
const farmChords = ['G', 'G', 'C', 'D', 'G', 'G', 'C', 'G', 'C', 'G', 'A', 'D', 'G', 'G', 'C', 'G'];
export const farmSong: Song = {
  name: 'Farmyard',
  bpm: 124,
  pulse1: {
    duty: 0.25,
    notes: aaba(
      ['G4 A4 B4 D5 . B4 D5 .', 'E5 D5 B4 . G4 - . .', 'C5 E5 . C5 D5 E5 D5 C5', 'A4 - B4 C5 D5 - . .'],
      'B4 - A4 - G4 - . .',
      ['E5 . G5 . E5 D5 C5 .', 'D5 . B4 . G4 B4 D5 .', 'C#5 . E5 . A5 G5 E5 .', 'F#5 - E5 - D5 - . .'],
      'G5 - D5 - G4 - . .',
    ),
  },
  pulse2: { duty: 0.5, notes: arp(farmChords, 4, [0, 2], 2), volume: 0.5 },
  triangle: { notes: bass(farmChords, 'bounce') },
  noise: { notes: 'k . s c k . s c' },
};

// 7. RAINBOW CLOUDS: airy and floaty, a slow 3/4 sway. C major (6 steps per bar).
const cloudChords = ['C', 'Em', 'F', 'G', 'C', 'Em', 'F', 'C', 'Am', 'Em', 'F', 'G', 'C', 'Em', 'F', 'C'];
export const cloudsSong: Song = {
  name: 'Rainbow Clouds',
  bpm: 84,
  echo: 0.45,
  pulse1: {
    duty: 0.5,
    notes: aaba(
      ['G5 - - E5 - C5', 'B4 - - - G4 -', 'A4 - C5 F5 - A5', 'G5 - - - - -'],
      'E5 - - - - -',
      ['A5 - - E5 - C5', 'B4 - - G4 - E4', 'F4 - A4 C5 - F5', 'D5 - - - - -'],
      'C5 - - - - -',
    ),
  },
  pulse2: { duty: 0.125, bell: true, notes: arp(cloudChords, 5, [0, 1, 2, 3, 2, 1], 1, 6), volume: 0.6 },
  triangle: { notes: bass(cloudChords, 'waltz', 2, 6) },
  pad: { notes: pad(cloudChords, 4, 6) },
};

// 8. SNOWY MOUNTAIN: sleigh-bell sparkle. D major.
const snowChords = ['D', 'Bm', 'G', 'A', 'D', 'Bm', 'G', 'A', 'G', 'D', 'Em', 'A', 'D', 'Bm', 'A', 'D'];
export const snowSong: Song = {
  name: 'Snowy Mountain',
  bpm: 112,
  echo: 0.3,
  pulse1: {
    duty: 0.25,
    notes: aaba(
      ['F#5 - A5 - D6 - A5 -', 'B5 - - - F#5 - D5 -', 'G5 - B5 - A5 G5 F#5 E5', 'E5 - - - A4 - - -'],
      'C#5 - - - E5 - - -',
      ['B4 - D5 - G5 - - B5', 'A5 - F#5 - D5 - - -', 'G5 - E5 - B4 - E5 G5', 'F#5 - E5 - - - . .'],
      'D5 - - - D6 - . .',
    ),
  },
  pulse2: { duty: 0.125, bell: true, notes: arp(snowChords, 5, [0, 2, 3, 2]), volume: 0.6 },
  triangle: { notes: bass(snowChords, 'halves') },
  pad: { notes: pad(snowChords), volume: 0.6 },
  noise: { notes: 'k j j j s j j j', volume: 0.8 },
};

// 9. TOY WORKSHOP: a music-box march. C major, bell-like high melody, marching snare.
const toysChords = ['C', 'G', 'C', 'G', 'C', 'G', 'C', 'C', 'F', 'C', 'G', 'C', 'C', 'G', 'C', 'C'];
export const toysSong: Song = {
  name: 'Toy Workshop',
  bpm: 108,
  pulse1: {
    duty: 0.125,
    bell: true,
    volume: 1.2,
    notes: aaba(
      ['C6 . C6 D6 E6 . C6 .', 'D6 . B5 . G5 - . .', 'C6 . E6 . G6 . E6 C6', 'D6 - - - G5 - . .'],
      'C6 - - - - - . .',
      ['A5 . A5 . C6 . A5 .', 'G5 . E5 . C5 - . .', 'D5 . G5 . B5 . D6 .', 'C6 - - - E6 - . .'],
      'C6 - - - C5 - . .',
    ),
  },
  pulse2: { duty: 0.25, notes: arp(toysChords, 4, [0, 2], 2), volume: 0.5 },
  triangle: { notes: bass(toysChords, 'bounce') },
  noise: { notes: 'k . s . k s s .', volume: 0.7 },
};

// 10. CRYSTAL CAVES: soft echoing chimes, bright and never spooky (it ends on a happy G major).
const cavesChords = ['Em', 'C', 'G', 'D', 'Em', 'C', 'G', 'G', 'C', 'G', 'Am', 'D', 'Em', 'C', 'D', 'G'];
export const cavesSong: Song = {
  name: 'Crystal Caves',
  bpm: 80,
  echo: 0.55,
  pulse1: {
    duty: 0.125,
    bell: true,
    volume: 1.3,
    notes: aaba(
      ['B5 - - - G5 - E5 -', 'E5 - - - G5 - - -', 'D5 - - - B4 - D5 -', 'F#5 - - - - - - -'],
      'G5 - - - - - - -',
      ['E5 - - - G5 - C6 -', 'B5 - - - D5 - - -', 'C6 - - - A5 - E5 -', 'F#5 - - - A5 - - -'],
      'G5 - - - - - - -',
    ),
  },
  pulse2: { duty: 0.125, bell: true, notes: arp(cavesChords, 5, [0, 2, 1, 3], 2), volume: 0.6 },
  triangle: { notes: bass(cavesChords, 'root') },
  pad: { notes: pad(cavesChords) },
};

// 11. STARRY NIGHT SKY: a lullaby in a rocking 3/4. F major (6 steps per bar).
const nightChords = ['F', 'C', 'Bb', 'F', 'F', 'C', 'Bb', 'C', 'Dm', 'Bb', 'F', 'C', 'F', 'C', 'Bb', 'F'];
export const nightSong: Song = {
  name: 'Starry Night Sky',
  bpm: 66,
  echo: 0.4,
  pulse1: {
    duty: 0.5,
    volume: 0.8,
    notes: aaba(
      ['A4 - - C5 - A4', 'G4 - - E4 - -', 'F4 - D4 F4 - Bb4', 'A4 - - - - -'],
      'G4 - - - - -',
      ['D5 - - F5 - D5', 'D5 - - Bb4 - -', 'C5 - A4 F4 - A4', 'G4 - - - - -'],
      'F4 - - - - -',
    ),
  },
  pulse2: { duty: 0.125, bell: true, notes: arp(nightChords, 5, [0, 1, 2, 1, 2, 1], 1, 6), volume: 0.45 },
  triangle: { notes: bass(nightChords, 'root', 2, 6), volume: 0.8 },
  pad: { notes: pad(nightChords, 4, 6) },
};

// 12. ROYAL CASTLE: grand and happy. D major.
const castleChords = ['D', 'G', 'A', 'D', 'D', 'G', 'A', 'A', 'Bm', 'G', 'E', 'A', 'D', 'G', 'A', 'D'];
export const castleSong: Song = {
  name: 'Royal Castle',
  bpm: 104,
  echo: 0.25,
  pulse1: {
    duty: 0.25,
    notes: aaba(
      ['D5 - F#5 - A5 - - D6', 'B5 - A5 G5 B5 - - -', 'A5 - G5 F#5 E5 - F#5 G5', 'F#5 - - - D5 - . .'],
      'E5 - - - C#5 - - -',
      ['F#5 - D5 - B4 - D5 F#5', 'G5 - B5 - D6 - B5 -', 'G#5 - B5 - E6 - D6 -', 'C#6 - - - A5 - - -'],
      'D6 - - - D5 - . .',
    ),
  },
  pulse2: { duty: 0.5, notes: arp(castleChords, 4, [0, 1, 2, 1]), volume: 0.6 },
  triangle: { notes: bass(castleChords, 'halves') },
  pad: { notes: pad(castleChords) },
  noise: { notes: 'k . h . s . h . | k . h . s . h k', volume: 0.8 },
};

// FINALE DRAGON: a short sleepy tune (low, slow, yawning), then the SAME tune turned cheerful
// (an octave higher, faster, with a bouncy beat) once he's happy. B-flat major, 8 bars.
const dragonChords = ['Bb', 'Gm', 'Eb', 'F', 'Bb', 'Gm', 'Eb', 'Bb'];
const dragonTune = [
  'D4 - - - Bb3 - - -',
  'D4 - C4 - Bb3 - - -',
  'G3 - - - Bb3 - Eb4 -',
  'D4 - - - C4 - - -',
  'D4 - - - Bb3 - - -',
  'F4 - Eb4 - D4 - - -',
  'C4 - - - Eb4 - G3 -',
  'Bb3 - - - - - . .',
].join(' | ');
export const dragonSleepySong: Song = {
  name: 'Sleepy dragon',
  bpm: 66,
  echo: 0.3,
  pulse1: { duty: 0.5, notes: dragonTune },
  triangle: { notes: bass(dragonChords, 'root', 1) },
  pad: { notes: pad(dragonChords, 3), volume: 0.8 },
  noise: { notes: 't . . . . . . . | . . . . . . . .', volume: 0.6 },
};
export const dragonHappySong: Song = {
  name: 'Happy dragon',
  bpm: 126,
  echo: 0.25,
  pulse1: { duty: 0.25, notes: transpose(dragonTune, 12) },
  pulse2: { duty: 0.125, notes: arp(dragonChords, 5, [0, 1, 2, 3]), volume: 0.6 },
  triangle: { notes: bass(dragonChords, 'bounce', 2) },
  pad: { notes: pad(dragonChords, 4), volume: 0.6 },
  noise: { notes: 'k . h k s . h .' },
};
