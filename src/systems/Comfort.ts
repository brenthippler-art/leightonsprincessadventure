import { loadSettings } from '../save/Save';

/**
 * Quick, read-anywhere access to the parent settings that change how the game plays and looks.
 * (They're set on the title screen's hidden parent panel and saved in the save file.)
 */
export const comfort = {
  /** Double jump, obstacles at half speed, puzzle hints after 5 s instead of 10 s. */
  get helperMode(): boolean {
    return loadSettings().helperMode;
  },
  /** Leighton walks forward by herself; she only needs jump and the wand. */
  get autoRun(): boolean {
    return loadSettings().autoRun;
  },
  /** Fewer, softer sparkles; gentle pulsing instead of quick blinking. */
  get reduceFlashing(): boolean {
    return loadSettings().reduceFlashing;
  },
};
