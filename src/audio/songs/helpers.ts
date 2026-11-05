/**
 * SONG-WRITING HELPERS. Nothing magic: each function just builds the same note strings you could
 * type by hand (see the format notes at the top of ../Music.ts). Using them, a song is mostly:
 *   - a MELODY you write note by note, and
 *   - a CHORD LIST, from which bass, pad chords and arpeggios are built automatically.
 *
 * Chord names: a root (C, F#, Bb...) plus an optional kind: "" major, "m" minor, "7", "maj7", "m7", "sus4".
 * Each chord lasts one bar by default (`steps`, 8 = one 4/4 bar of eighth notes, 6 = one 3/4 bar).
 */

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ROOT: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const KINDS: Record<string, number[]> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  sus4: [0, 5, 7],
};

/** MIDI number to note name, e.g. 60 -> "C4". */
export function noteName(midi: number): string {
  return `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

/** A chord's notes (as MIDI numbers), with its root in the given octave. */
export function chordMidi(symbol: string, octave: number): number[] {
  const m = /^([A-G])([#b]?)(.*)$/.exec(symbol);
  if (!m) throw new Error(`Unknown chord ${symbol}`);
  const root = (octave + 1) * 12 + ROOT[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const kind = KINDS[m[3]];
  if (!kind) throw new Error(`Unknown chord kind in ${symbol}`);
  return kind.map((i) => root + i);
}

/** A note held for n steps: "C4 - - -". */
function held(note: string, n: number): string[] {
  return [note, ...Array(Math.max(0, n - 1)).fill('-')];
}

/**
 * A bass line for the triangle channel.
 *   root      the root, held the whole bar
 *   halves    root, then the fifth halfway through
 *   walk      a gentle walking line on the beats: root, third, fifth, sixth
 *   bounce    root and fifth bouncing on every other step (country/march feel)
 *   waltz     (3/4) root on beat 1, fifth on beat 2 and 3
 */
export function bass(chords: string[], style: 'root' | 'halves' | 'walk' | 'bounce' | 'waltz', octave = 2, steps = 8): string {
  const out: string[] = [];
  for (const sym of chords) {
    const [r, third, fifth] = chordMidi(sym, octave);
    const R = noteName(r);
    const F = noteName(fifth);
    if (style === 'root') out.push(...held(R, steps));
    else if (style === 'halves') out.push(...held(R, steps / 2), ...held(F, steps / 2));
    else if (style === 'walk') out.push(...held(R, 2), ...held(noteName(third), 2), ...held(F, 2), ...held(noteName(r + 9), 2));
    else if (style === 'bounce') for (let i = 0; i < steps; i++) out.push(i % 2 ? '.' : i % 4 === 0 ? R : F);
    else out.push(...held(R, 2), ...held(F, 2), ...held(F, 2));
  }
  return out.join(' ');
}

/** Pad chords: each chord held for the whole bar, e.g. "C4+E4+G4 - - - - - - -". */
export function pad(chords: string[], octave = 4, steps = 8): string {
  return chords.map((sym) => held(chordMidi(sym, octave).map(noteName).join('+'), steps).join(' ')).join(' ');
}

/**
 * An arpeggio (chord notes one after another), for a sparkly second pulse channel.
 * `order` picks chord notes by position (0 = root, 1 = third, 2 = fifth, 3 = root an octave up).
 * `every` = how many steps each arpeggio note lasts.
 */
export function arp(chords: string[], octave = 5, order = [0, 1, 2, 3], every = 1, steps = 8): string {
  const out: string[] = [];
  for (const sym of chords) {
    const notes = chordMidi(sym, octave);
    const pick = (i: number) => (i >= notes.length ? notes[0] + 12 * Math.floor(i / notes.length) : notes[i]);
    for (let s = 0; s < steps; s += every) out.push(...held(noteName(pick(order[(s / every) % order.length])), every));
  }
  return out.join(' ');
}

/**
 * Put a 16-bar song together from 4-bar phrases, in the classic "A A B A" shape:
 *   A (4 bars), A again with a different last bar, B (4 bars), A again with a final ending bar.
 */
export function aaba(a: string[], aSecondEnding: string, b: string[], finalEnding: string): string {
  return [...a, ...a.slice(0, 3), aSecondEnding, ...b, ...a.slice(0, 3), finalEnding].join(' | ');
}

/** Move every note in a string up or down by some half steps (12 = one octave). */
export function transpose(notes: string, semitones: number): string {
  return notes.replace(/([A-G])([#b]?)(-?\d)/g, (_m, l: string, acc: string, oct: string) => {
    const midi = (Number(oct) + 1) * 12 + ROOT[l] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0) + semitones;
    return noteName(midi);
  });
}
