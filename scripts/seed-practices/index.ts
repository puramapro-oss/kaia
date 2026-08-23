import { MEDITATION_PRACTICES } from "./meditation";
import { BREATHING_PRACTICES } from "./breathing";
import { MANTRA_PRACTICES } from "./mantra";
import { MUDRA_PRACTICES } from "./mudra";
import { MOVEMENT_PRACTICES } from "./movement";
import { LEARNING_PRACTICES } from "./learning";
import { REPROGRAMMING_PRACTICES } from "./reprogramming";

export const ALL_PRACTICES = [
  ...MEDITATION_PRACTICES,
  ...BREATHING_PRACTICES,
  ...MANTRA_PRACTICES,
  ...MUDRA_PRACTICES,
  ...MOVEMENT_PRACTICES,
  ...LEARNING_PRACTICES,
  ...REPROGRAMMING_PRACTICES,
];

export type { PracticeSeed, Category } from "./types";
