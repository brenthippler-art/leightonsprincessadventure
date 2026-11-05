import { HINTS } from '../config';
import { loadSettings } from '../save/Save';

/**
 * Spoken hints using the browser's built-in voice (speechSynthesis).
 *
 * RULE 3 (no network): some browser voices (for example Chrome's "Google ..." voices) are
 * generated on a server. We only ever use voices marked `localService`, which run on the
 * device itself. If there's no on-device voice, we simply stay quiet. Hints are always
 * shown with pictures too, so speech is a bonus, never required.
 */

let voice: SpeechSynthesisVoice | null | undefined; // undefined = not chosen yet

/** Names of friendly-sounding on-device voices on common systems (Windows, Mac/iPad, Android). */
const FRIENDLY = /samantha|karen|moira|tessa|zira|aria|jenny|sonia|libby|natasha|female/i;

function pickVoice(): SpeechSynthesisVoice | null {
  const all = window.speechSynthesis.getVoices().filter((v) => v.localService && /^en/i.test(v.lang));
  return all.find((v) => FRIENDLY.test(v.name)) ?? all[0] ?? null;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  // Voices load in the background in some browsers; re-pick when they arrive.
  window.speechSynthesis.addEventListener?.('voiceschanged', () => (voice = pickVoice()));
}

/** Say something, if spoken hints are on (parent setting) and an on-device voice exists. Interrupts the previous phrase. */
export function speak(text: string): void {
  if (!loadSettings().spokenHints || !('speechSynthesis' in window)) return;
  if (voice === undefined) voice = pickVoice();
  if (!voice) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = HINTS.voiceRate;
  u.pitch = HINTS.voicePitch;
  synth.speak(u);
}
