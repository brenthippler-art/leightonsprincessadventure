import { loadSettings } from '../save/Save';

/**
 * THE SYNTH: a tiny "sound chip" made with the Web Audio API (no audio files at all).
 *
 * It copies the kinds of voices old game consoles had:
 *   - PULSE waves (2 channels in songs): buzzy square-ish tones. The "duty cycle" (how much of each
 *     wave is "up") changes the color: 50% = round and hollow, 25% = brighter, 12.5% = thin and sparkly.
 *   - TRIANGLE: soft and round; used for bass lines.
 *   - NOISE: hiss, shaped into drums (kick, snare, hi-hat, shaker, sleigh bells, wood block...).
 *   - PAD: a soft sine "cushion" for chords, for a warmer 16-bit feel.
 * Every note has an ADSR envelope (Attack, Decay, Sustain, Release: how a note swells in and fades out),
 * optional gentle vibrato (a slight wobble in pitch), and can send some sound into an echo.
 *
 * Signal path:  voices -> music bus or sfx bus -> master volume -> soft limiter -> speakers
 * The two buses can be switched on/off separately (pause-screen speaker buttons).
 */

export type Duty = 0.125 | 0.25 | 0.5;
export type Wave = 'pulse' | 'triangle' | 'sine' | 'noise';

/** How a note's volume changes over time. Times in seconds; sustain is a fraction (0-1) of full volume. */
export interface Envelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface Voice {
  wave: Wave;
  duty?: Duty;
  /** Peak volume (keep it small: 0.02 - 0.2). */
  volume: number;
  env: Envelope;
  /** Gentle pitch wobble: depth in cents (100 = a half step), speed in Hz, starts after `delay` s. */
  vibrato?: { depth: number; rate: number; delay: number };
  /** How much of this voice goes into the echo (0-1). */
  echo?: number;
  /** For noise: the filter's center frequency (shapes the hiss). */
  filter?: number;
  /** Slide the pitch to this frequency over the note's length (for boings and blips). */
  glideTo?: number;
}

interface Chip {
  ctx: AudioContext;
  music: GainNode;
  sfx: GainNode;
  musicEcho: AudioNode;
  sfxEcho: AudioNode;
  noise: AudioBuffer;
}

let chip: Chip | null = null;
const waves = new Map<Duty, PeriodicWave>();

/** Overall loudness. Kept moderate on purpose; the limiter stops any sudden loud peaks. */
const MASTER_VOLUME = 0.55;
const MUSIC_VOLUME = 0.55;
const SFX_VOLUME = 0.8;

/** An echo: a short delay that feeds back into itself, softened by a low-pass filter. */
function makeEcho(ctx: AudioContext, out: AudioNode): AudioNode {
  const input = ctx.createGain();
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.27;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.32;
  const soften = ctx.createBiquadFilter();
  soften.type = 'lowpass';
  soften.frequency.value = 2400;
  input.connect(delay);
  delay.connect(soften);
  soften.connect(feedback);
  feedback.connect(delay);
  soften.connect(out);
  return input;
}

function getChip(): Chip {
  if (chip) return chip;
  const ctx = new AudioContext();
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -14;
  limiter.knee.value = 10;
  limiter.ratio.value = 6;
  const master = ctx.createGain();
  master.gain.value = MASTER_VOLUME;
  master.connect(limiter).connect(ctx.destination);

  const settings = loadSettings();
  const music = ctx.createGain();
  music.gain.value = settings.music ? MUSIC_VOLUME : 0;
  music.connect(master);
  const sfx = ctx.createGain();
  sfx.gain.value = settings.sfx ? SFX_VOLUME : 0;
  sfx.connect(master);

  // One second of white noise, reused by every drum and swoosh.
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  chip = { ctx, music, sfx, musicEcho: makeEcho(ctx, music), sfxEcho: makeEcho(ctx, sfx), noise };

  // Pause all sound while the browser tab is hidden; carry on when it's back.
  document.addEventListener('visibilitychange', () => {
    if (!chip) return;
    if (document.hidden) void chip.ctx.suspend();
    else if (unlocked) void chip.ctx.resume();
  });
  return chip;
}

/** A pulse wave with a given duty cycle, built from its harmonics (cached). */
function pulseWave(ctx: AudioContext, duty: Duty): PeriodicWave {
  let w = waves.get(duty);
  if (w) return w;
  const n = 40;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let k = 1; k < n; k++) real[k] = ((2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty)) * 0.9;
  w = ctx.createPeriodicWave(real, imag);
  waves.set(duty, w);
  return w;
}

let unlocked = false;

export function getAudioContext(): AudioContext {
  return getChip().ctx;
}

/** Is sound allowed to play yet (after the first tap or key press)? */
export function audioReady(): boolean {
  return !!chip && chip.ctx.state === 'running';
}

/** Browsers only allow sound after a tap or key press: call this from one. */
export function unlock(): void {
  const c = getChip().ctx;
  unlocked = true;
  if (c.state === 'suspended' && !document.hidden) void c.resume();
}

export function busFor(kind: 'music' | 'sfx'): GainNode {
  return kind === 'music' ? getChip().music : getChip().sfx;
}

/** Switch music or sound effects on/off, with a short smooth fade (never a click). */
export function setBusEnabled(kind: 'music' | 'sfx', on: boolean): void {
  const c = getChip();
  const bus = kind === 'music' ? c.music : c.sfx;
  const target = on ? (kind === 'music' ? MUSIC_VOLUME : SFX_VOLUME) : 0;
  bus.gain.cancelScheduledValues(c.ctx.currentTime);
  bus.gain.setTargetAtTime(target, c.ctx.currentTime, 0.08);
}

/** Note name ("C4", "F#5", "Bb3") to frequency in Hz. C4 is middle C. */
export function noteToFreq(name: string): number {
  const m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(name);
  if (!m) return 0;
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1].toUpperCase() as 'C'];
  const shift = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  const midi = (Number(m[3]) + 1) * 12 + base + shift;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Play one note on a voice at `time` (AudioContext seconds) for `duration` seconds, into `dest`
 * ('music', 'sfx', or a song's own volume node).
 * This is the heart of everything: songs and sound effects both use it.
 */
export type Destination = 'music' | 'sfx' | AudioNode;

export function playVoice(v: Voice, freq: number, time: number, duration: number, dest: Destination): void {
  const c = getChip();
  const ctx = c.ctx;
  const out = dest === 'sfx' ? c.sfx : dest === 'music' ? c.music : dest;
  const t = Math.max(time, ctx.currentTime);
  const { attack, decay, sustain, release } = v.env;
  const end = t + Math.max(duration, attack + decay);

  // The envelope: swell in, settle to the sustain level, hold, then fade out.
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(v.volume, t + attack);
  amp.gain.linearRampToValueAtTime(v.volume * sustain, t + attack + decay);
  amp.gain.setValueAtTime(v.volume * sustain, end);
  amp.gain.linearRampToValueAtTime(0, end + release);
  amp.connect(out);
  if (v.echo) {
    const send = ctx.createGain();
    send.gain.value = v.echo;
    amp.connect(send).connect(dest === 'sfx' ? c.sfxEcho : c.musicEcho);
  }
  const stopAt = end + release + 0.05;

  if (v.wave === 'noise') {
    const src = ctx.createBufferSource();
    src.buffer = c.noise;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(v.filter ?? freq ?? 2000, t);
    if (v.glideTo) filter.frequency.exponentialRampToValueAtTime(v.glideTo, end);
    filter.Q.value = 0.9;
    src.connect(filter).connect(amp);
    src.start(t, Math.random() * 0.5);
    src.stop(stopAt);
    return;
  }

  const osc = ctx.createOscillator();
  if (v.wave === 'pulse') osc.setPeriodicWave(pulseWave(ctx, v.duty ?? 0.5));
  else osc.type = v.wave;
  osc.frequency.setValueAtTime(freq, t);
  if (v.glideTo) osc.frequency.exponentialRampToValueAtTime(v.glideTo, end);
  if (v.vibrato) {
    const lfo = ctx.createOscillator();
    lfo.frequency.value = v.vibrato.rate;
    const depth = ctx.createGain();
    const hz = freq * (Math.pow(2, v.vibrato.depth / 1200) - 1);
    depth.gain.setValueAtTime(0, t);
    depth.gain.setValueAtTime(0, t + v.vibrato.delay);
    depth.gain.linearRampToValueAtTime(hz, t + v.vibrato.delay + 0.15);
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(t);
    lfo.stop(stopAt);
  }
  osc.connect(amp);
  osc.start(t);
  osc.stop(stopAt);
}

/** Drum kit for the noise channel. Each letter is one drum (see the song format notes in Music.ts). */
export type Drum = 'k' | 's' | 'h' | 'c' | 'j' | 'w' | 'b' | 't';

export function playDrum(d: Drum, time: number, volume = 1, dest: Destination = 'music'): void {
  const short = (a: number, r: number) => ({ attack: a, decay: 0.01, sustain: 1, release: r });
  switch (d) {
    case 'k': // soft kick: a sine that drops in pitch
      playVoice({ wave: 'sine', volume: 0.32 * volume, env: short(0.003, 0.12), glideTo: 45 }, 140, time, 0.04, dest);
      break;
    case 's': // gentle snare: mid hiss plus a little body
      playVoice({ wave: 'noise', filter: 1800, volume: 0.09 * volume, env: short(0.002, 0.11) }, 0, time, 0.02, dest);
      playVoice({ wave: 'triangle', volume: 0.06 * volume, env: short(0.002, 0.06), glideTo: 140 }, 200, time, 0.02, dest);
      break;
    case 'h': // tiny hi-hat tick
      playVoice({ wave: 'noise', filter: 8000, volume: 0.035 * volume, env: short(0.001, 0.035) }, 0, time, 0.01, dest);
      break;
    case 'c': // shaker
      playVoice({ wave: 'noise', filter: 5200, volume: 0.04 * volume, env: { attack: 0.015, decay: 0.02, sustain: 0.6, release: 0.05 } }, 0, time, 0.03, dest);
      break;
    case 'j': // sleigh bells: a cluster of tiny high jingles
      for (const [f, dt] of [[2637, 0], [3136, 0.012], [3520, 0.025]] as const)
        playVoice({ wave: 'pulse', duty: 0.125, volume: 0.016 * volume, env: short(0.001, 0.09) }, f, time + dt, 0.01, dest);
      playVoice({ wave: 'noise', filter: 9000, volume: 0.025 * volume, env: short(0.002, 0.08) }, 0, time, 0.02, dest);
      break;
    case 'w': // wood block (tropical)
      playVoice({ wave: 'sine', volume: 0.09 * volume, env: short(0.001, 0.04) }, 1100, time, 0.01, dest);
      break;
    case 'b': // bongo
      playVoice({ wave: 'sine', volume: 0.12 * volume, env: short(0.002, 0.1), glideTo: 210 }, 300, time, 0.02, dest);
      break;
    case 't': // soft low tom / heartbeat thud
      playVoice({ wave: 'sine', volume: 0.12 * volume, env: short(0.004, 0.15), glideTo: 70 }, 110, time, 0.03, dest);
      break;
  }
}
