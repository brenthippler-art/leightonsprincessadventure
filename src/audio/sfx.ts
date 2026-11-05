import { audioReady, getAudioContext, noteToFreq, playDrum, playVoice, type Envelope, type Voice } from './Synth';

/**
 * SOUND EFFECTS, all made on the synth (no files). Every sound is soft and friendly:
 * no harsh buzzers, nothing sad, nothing sudden and loud. They play on the "sfx" bus, so the
 * pause screen's sound-effects button can switch them all off.
 */

const now = () => getAudioContext().currentTime;
const ready = () => audioReady();

const quick = (release = 0.06): Envelope => ({ attack: 0.004, decay: 0.03, sustain: 0.8, release });
const ring = (release = 0.4): Envelope => ({ attack: 0.003, decay: 0.25, sustain: 0.15, release });

/** Play a note by name (or Hz) on a voice, `delay` seconds from now. */
function note(v: Voice, pitch: string | number, delay: number, length: number): void {
  const f = typeof pitch === 'number' ? pitch : noteToFreq(pitch);
  playVoice(v, f, now() + delay, length, 'sfx');
}

/** A little run of notes, `gap` seconds apart. */
function run(v: Voice, notes: string[], gap: number, length: number, start = 0): void {
  notes.forEach((n, i) => note(v, n, start + i * gap, length));
}

const pulse = (duty: 0.125 | 0.25 | 0.5, volume: number, env = quick()): Voice => ({ wave: 'pulse', duty, volume, env });
const tri = (volume: number, env = quick()): Voice => ({ wave: 'triangle', volume, env });
const sine = (volume: number, env = quick()): Voice => ({ wave: 'sine', volume, env });

export const sfx = {
  /** Jump: a quick rising blip. */
  jump(): void {
    if (!ready()) return;
    playVoice({ ...pulse(0.25, 0.05), glideTo: 760 }, 380, now(), 0.1, 'sfx');
  },

  /** Swim stroke (underwater jump): a soft bubbly blip. */
  swim(): void {
    if (!ready()) return;
    playVoice({ ...sine(0.06), glideTo: 820 }, 420, now(), 0.09, 'sfx');
  },

  /** Landing: a soft little thud. */
  land(): void {
    if (!ready()) return;
    playDrum('t', now(), 0.45, 'sfx');
  },

  /** Wand: a twinkly rising arpeggio with a touch of echo. */
  twinkle(): void {
    if (!ready()) return;
    run({ ...tri(0.05, ring(0.15)), echo: 0.4 }, ['E6', 'G6', 'C7', 'E7'], 0.035, 0.05);
  },

  /** An obstacle turns friendly: a happy bell chime. */
  befriend(): void {
    if (!ready()) return;
    run({ ...sine(0.07, ring(0.5)), echo: 0.3 }, ['C6', 'E6', 'G6', 'C7'], 0.07, 0.12);
    run(tri(0.03, ring(0.3)), ['C5', 'G5'], 0.14, 0.2);
  },

  /** Bonk: a soft, silly cartoon "boing" that wobbles UP (never sad, never harsh). */
  boing(): void {
    if (!ready()) return;
    playVoice({ ...sine(0.12, { attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.12 }), glideTo: 470, vibrato: { depth: 70, rate: 16, delay: 0 } }, 230, now(), 0.32, 'sfx');
  },

  /** Reappearing after a bonk: a soft shimmer. */
  appear(): void {
    if (!ready()) return;
    run({ ...tri(0.035, ring(0.2)), echo: 0.5 }, ['G6', 'D7', 'B6', 'G7', 'E7', 'D7'], 0.04, 0.05);
  },

  /** Checkpoint flag: a tiny fanfare (da-da-da-daaa). */
  chime(): void {
    if (!ready()) return;
    run(pulse(0.5, 0.045), ['G5', 'G5', 'C6'], 0.09, 0.07);
    note(pulse(0.5, 0.045, { attack: 0.005, decay: 0.1, sustain: 0.6, release: 0.2 }), 'E6', 0.27, 0.3);
    note(tri(0.08), 'C4', 0.27, 0.3);
  },

  /** Button pressed: a soft click. */
  click(): void {
    if (!ready()) return;
    note(pulse(0.125, 0.04, quick(0.02)), 1200, 0, 0.02);
    playDrum('h', now(), 0.8, 'sfx');
  },

  /** Gate opening: a bright "ding" and a soft "swoosh". */
  gateOpen(): void {
    if (!ready()) return;
    note({ ...sine(0.08, ring(0.8)), echo: 0.3 }, 'G6', 0, 0.1);
    note(sine(0.04, ring(0.6)), 'D7', 0.02, 0.1);
    playVoice({ wave: 'noise', filter: 500, glideTo: 3500, volume: 0.05, env: { attack: 0.15, decay: 0.1, sustain: 0.6, release: 0.25 } }, 0, now() + 0.05, 0.45, 'sfx');
  },

  /** A wrong puzzle try: a gentle, puzzled "hmm?" (two soft notes, the second a little lower). */
  hmm(): void {
    if (!ready()) return;
    const v = { ...tri(0.09, { attack: 0.03, decay: 0.08, sustain: 0.7, release: 0.12 }), vibrato: { depth: 15, rate: 5, delay: 0.05 } };
    note(v, 'E4', 0, 0.18);
    note(v, 'C4', 0.22, 0.26);
  },

  /** Counting chimes 1-5: do, re, mi, fa, sol. */
  countNote(n: number): void {
    if (!ready()) return;
    const pitch = ['C5', 'D5', 'E5', 'F5', 'G5'][n - 1] ?? 'G5';
    note({ ...sine(0.08, ring(0.6)), echo: 0.25 }, pitch, 0, 0.12);
    note(pulse(0.125, 0.025, ring(0.3)), pitch.replace('5', '6'), 0, 0.08);
  },

  /** Pattern bells: three clearly different pitches (low, middle, high). */
  bell(i: number): void {
    if (!ready()) return;
    const pitch = ['C5', 'E5', 'G5'][i] ?? 'C5';
    const f = noteToFreq(pitch);
    playVoice({ ...sine(0.11, ring(0.9)), echo: 0.3 }, f, now(), 0.1, 'sfx');
    playVoice(sine(0.035, ring(0.5)), f * 2.76, now(), 0.05, 'sfx'); // a bell's shimmery overtone
  },

  /** Bounce pad: a springy "boyoing" up. */
  bounce(): void {
    if (!ready()) return;
    playVoice({ ...sine(0.1, { attack: 0.005, decay: 0.1, sustain: 0.6, release: 0.1 }), glideTo: 700, vibrato: { depth: 40, rate: 22, delay: 0 } }, 160, now(), 0.26, 'sfx');
  },

  /** Picking up the jewel: a sparkly fanfare. */
  jewel(): void {
    if (!ready()) return;
    run({ ...pulse(0.25, 0.04), echo: 0.3 }, ['C6', 'E6', 'G6', 'C7'], 0.05, 0.06);
    run({ ...tri(0.04, ring(0.4)), echo: 0.5 }, ['G7', 'E7', 'C7', 'G7'], 0.05, 0.05, 0.22);
  },

  /** Picking up a key: a happy two-note "got it". */
  keyPickup(): void {
    if (!ready()) return;
    run(pulse(0.25, 0.045), ['B5', 'E6'], 0.08, 0.1);
  },

  /** Menu tap: a soft click. */
  tap(): void {
    if (!ready()) return;
    note(tri(0.07, quick(0.03)), 'A5', 0, 0.03);
  },

  /** An obstacle's "tell" before it acts: a quiet little wobble. */
  tell(): void {
    if (!ready()) return;
    playVoice({ ...sine(0.03), glideTo: 440 }, 392, now(), 0.12, 'sfx');
  },

  /** A happy goat "baa-aa" (a wobbly note). */
  bleat(): void {
    if (!ready()) return;
    playVoice({ ...pulse(0.25, 0.04, { attack: 0.02, decay: 0.05, sustain: 0.8, release: 0.1 }), vibrato: { depth: 60, rate: 14, delay: 0 } }, 540, now(), 0.4, 'sfx');
  },

  /** A long, low, friendly "moooo". */
  moo(): void {
    if (!ready()) return;
    playVoice({ ...pulse(0.5, 0.05, { attack: 0.08, decay: 0.2, sustain: 0.7, release: 0.25 }), glideTo: 130 }, 180, now(), 0.8, 'sfx');
    playVoice({ ...tri(0.08, { attack: 0.08, decay: 0.2, sustain: 0.7, release: 0.25 }), glideTo: 70 }, 90, now(), 0.8, 'sfx');
  },

  /** A sleepy little dragon snore. */
  snore(): void {
    if (!ready()) return;
    playVoice({ ...tri(0.06, { attack: 0.15, decay: 0.1, sustain: 0.8, release: 0.2 }), glideTo: 90 }, 115, now(), 0.4, 'sfx');
  },

  /** The dragon cheering up: each wave of the wand (1-3) plays a higher, happier little tune. */
  dragonHappy(step: number): void {
    if (!ready()) return;
    const tunes = [['G4', 'B4', 'D5'], ['C5', 'E5', 'G5'], ['E5', 'G5', 'C6', 'E6', 'G6']];
    run({ ...pulse(0.25, 0.05), echo: 0.25 }, tunes[step - 1] ?? tunes[2], 0.09, 0.12);
  },
};
