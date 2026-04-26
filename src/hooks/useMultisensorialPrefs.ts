"use client";

import { createContext, useContext } from "react";

/**
 * Préférences multisensorielles du user — diffusées par MultisensorialProvider
 * (server-rendered) à toute l'app cliente. Default-safe en SSR / non logged.
 */
export interface MultisensorialPrefs {
  background_video: boolean;
  haptics: boolean;
  binaural: boolean;
  cinematic: boolean;
  reduced_motion: boolean;
}

export const DEFAULT_MULTISENSORIAL_PREFS: MultisensorialPrefs = {
  background_video: true,
  haptics: true,
  binaural: false,
  cinematic: true,
  reduced_motion: false,
};

export const MultisensorialContext = createContext<MultisensorialPrefs>(
  DEFAULT_MULTISENSORIAL_PREFS
);

export function useMultisensorialPrefs(): MultisensorialPrefs {
  return useContext(MultisensorialContext);
}
