import { audioReady, busFor, getAudioContext, noteToFreq, playDrum, playVoice, type Drum, type Duty, type Voice } from './Synth';

/**
 * THE SONG FORMAT (a tiny "tracker", like old game composers used)
 *
 * A song is a TypeScript object. Time is split into equal STEPS (by default 2 steps per beat, so
 * one step = an eighth note, and a 4/4 bar = 8 steps). Each channel is a string of space-separated
 * tokens, one token per step:
 *
 *   C5  F#4  Bb3     start a note (letter, optional # or b, octave; C4 is middle C)
 *   -               keep holding the note before it for one more step
 *   .               silence (a rest)
 *   C4+E4+G4        (pad channel) a chord: several notes at once
 *   |               ignored; use it to mark bars so you can read the music
 *
 *   Example, one bar:  "C5 - E5 G5 C6 - G5 -"
 *     = C5 for 2 steps, E5 for 1, G5 for 1, C6 for 2, G5 for 2.
 *
 * The NOISE channel uses drum letters instead of notes:
 *   k kick   s snare   h hi-hat   c shaker   j sleigh bells   w wood block   b bongo   t soft tom
 *   Example, one bar of a gentle beat: "k . h . s . h ."
 *
 * Channels: pulse1 (melody), pulse2 (harmony or sparkly arpeggios), triangle (bass),
 * noise (drums), pad (soft chords). Every channel is optional.
 * A channel shorter than the song simply repeats (handy: a one-bar drum beat loops all song long).
 *
 * Song settings: bpm (speed), stepsPerBeat (2 = eighth notes; 3 for a lilting triplet feel),
 * swing (0-0.3: delays every other step for a bouncy "swing" feel), echo (0-1), loop (default true),
 * loopStart (the step to jump back to when looping, e.g. after an intro).
 * Per channel you can also set duty (pulse color: 0.125, 0.25, 0.5) and volume (multiplier, 1 = normal).
 *
 * Writing songs is easier with the helpers in songs/helpers.ts (chords, bass lines, arpeggios),
 * which just build these same strings for you.
 */
export interface Track {
  notes: string;
  /** Pulse channels only: 0.125 thin/sparkly, 0.25 bright, 0.5 round. */
  duty?: Duty;
  /** Loudness multiplier for this channel (1 = normal). */
  volume?: number;
  /** Give this channel a music-box/bell sound (notes ring and fade instead of holding). */
  bell?: boolean;
}

export interface Song {
  name: string;
  bpm: number;
  stepsPerBeat?: number;
  swing?: number;
  echo?: number;
  loop?: boolean;
  loopStart?: number;
  pulse1?: Track;
  pulse2?: Track;
  triangle?: Track;
  noise?: Track;
  pad?: Track;
}

type Channel = 'pulse1' | 'pulse2' | 'triangle' | 'noise' | 'pad';
const CHANNELS: Channel[] = ['pulse1', 'pulse2', 'triangle', 'noise', 'pad'];

/** The sound of each channel (soft and gentle on purpose). */
function voiceFor(ch: Channel, track: Track, echo: number): Voice {
  const vol = track.volume ?? 1;
  const bellEnv = { attack: 0.003, decay: 0.35, sustain: 0.0, release: 0.2 };
  switch (ch) {
    case 'pulse1':
      return {
        wave: 'pulse',
        duty: track.duty ?? 0.25,
        volume: 0.075 * vol,
        env: track.bell ? bellEnv : { attack: 0.008, decay: 0.1, sustain: 0.65, release: 0.08 },
        vibrato: track.bell ? undefined : { depth: 12, rate: 5.5, delay: 0.18 },
        echo: echo * 0.6,
      };
    case 'pulse2':
      return {
        wave: 'pulse',
        duty: track.duty ?? 0.125,
        volume: 0.045 * vol,
        env: track.bell ? bellEnv : { attack: 0.006, decay: 0.12, sustain: 0.45, release: 0.08 },
        echo,
      };
    case 'triangle':
      return { wave: 'triangle', volume: 0.16 * vol, env: { attack: 0.005, decay: 0.08, sustain: 0.75, release: 0.06 } };
    case 'pad':
      return { wave: 'sine', volume: 0.05 * vol, env: { attack: 0.25, decay: 0.3, sustain: 0.75, release: 0.5 }, echo: echo * 0.5 };
    case 'noise':
      return { wave: 'noise', volume: vol, env: { attack: 0, decay: 0, sustain: 1, release: 0 } };
  }
}

const DRUMS = new Set(['k', 's', 'h', 'c', 'j', 'w', 'b', 't']);

/** Split a channel string into tokens, dropping bar lines. */
function tokens(s: string): string[] {
  return s.trim().split(/\s+/).filter((t) => t && t !== '|');
}

/** One song playing (several can overlap briefly during a crossfade). */
class Playback {
  readonly gain: GainNode;
  private readonly tracks: { ch: Channel; toks: string[]; voice: Voice; volume: number }[] = [];
  private readonly length: number;
  private readonly stepDur: number;
  private step = 0;
  private nextTime = -1;
  private timer: number | null = null;
  paused = false;
  finished = false;

  constructor(
    readonly song: Song,
    private readonly onEnd?: () => void,
  ) {
    const ctx = getAudioContext();
    this.gain = ctx.createGain();
    this.gain.gain.value = 0;
    this.gain.connect(busFor('music'));
    for (const ch of CHANNELS) {
      const t = song[ch];
      if (!t) continue;
      this.tracks.push({ ch, toks: tokens(t.notes), voice: voiceFor(ch, t, song.echo ?? 0.2), volume: t.volume ?? 1 });
    }
    this.length = Math.max(1, ...this.tracks.map((t) => t.toks.length));
    this.stepDur = 60 / song.bpm / (song.stepsPerBeat ?? 2);
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  /** Look a little way ahead and schedule any notes that start soon (the standard Web Audio pattern). */
  private schedule(): void {
    if (this.paused || this.finished || !audioReady()) return;
    const ctx = getAudioContext();
    if (this.nextTime < ctx.currentTime - 0.2) this.nextTime = ctx.currentTime + 0.05; // after a pause or hiccup
    while (this.nextTime < ctx.currentTime + 0.15) {
      this.playStep(this.step, this.nextTime);
      this.step++;
      if (this.step >= this.length) {
        if (this.song.loop === false) {
          this.finished = true;
          window.setTimeout(() => this.onEnd?.(), (this.nextTime - ctx.currentTime + this.stepDur) * 1000);
          return;
        }
        this.step = this.song.loopStart ?? 0;
      }
      this.nextTime += this.stepDur;
    }
  }

  private playStep(step: number, time: number): void {
    const swing = step % 2 === 1 ? (this.song.swing ?? 0) * this.stepDur : 0;
    for (const t of this.tracks) {
      const i = step % t.toks.length;
      const tok = t.toks[i];
      if (tok === '-' || tok === '.') continue;
      if (t.ch === 'noise') {
        for (const d of tok) if (DRUMS.has(d)) playDrum(d as Drum, time + swing, t.volume, this.gain);
        continue;
      }
      // How long is this note? Count the "-" holds after it.
      let len = 1;
      while (len < t.toks.length && t.toks[(i + len) % t.toks.length] === '-' && i + len < t.toks.length) len++;
      const notes = tok.split('+');
      const vol = notes.length > 1 ? 1 / Math.sqrt(notes.length) : 1;
      for (const n of notes) {
        const f = noteToFreq(n);
        if (f > 0) playVoice({ ...t.voice, volume: t.voice.volume * vol }, f, time + swing, len * this.stepDur * 0.92, this.gain);
      }
    }
  }

  fadeTo(level: number, seconds: number): void {
    const ctx = getAudioContext();
    this.gain.gain.cancelScheduledValues(ctx.currentTime);
    this.gain.gain.setValueAtTime(this.gain.gain.value, ctx.currentTime);
    this.gain.gain.linearRampToValueAtTime(level, ctx.currentTime + seconds);
  }

  stop(fadeSeconds: number): void {
    this.fadeTo(0, fadeSeconds);
    window.setTimeout(() => {
      if (this.timer !== null) window.clearInterval(this.timer);
      this.timer = null;
      this.gain.disconnect();
    }, fadeSeconds * 1000 + 400);
    this.finished = true;
  }
}

/**
 * The MUSIC PLAYER. Scenes just say music.play(SONGS.meadow); it crossfades from whatever was playing.
 * It pauses with the pause screen, and (through the synth) whenever the browser tab is hidden.
 */
class MusicPlayer {
  private current: Playback | null = null;

  play(song: Song | null, opts: { fade?: number; onEnd?: () => void } = {}): void {
    const fade = opts.fade ?? 1;
    if (this.current && this.current.song === song && !this.current.finished) {
      if (this.current.paused) this.resume();
      return;
    }
    this.current?.stop(fade);
    this.current = null;
    if (!song) return;
    this.current = new Playback(song, opts.onEnd);
    this.current.fadeTo(1, fade);
  }

  stop(fade = 1): void {
    this.current?.stop(fade);
    this.current = null;
  }

  pause(): void {
    if (!this.current) return;
    this.current.paused = true;
    this.current.fadeTo(0, 0.15);
  }

  resume(): void {
    if (!this.current || !this.current.paused) return;
    this.current.paused = false;
    this.current.fadeTo(1, 0.4);
  }

  get playing(): Song | null {
    return this.current?.song ?? null;
  }
}

export const music = new MusicPlayer();
