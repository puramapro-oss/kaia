"use client";

import { type ReactNode } from "react";
import {
  MultisensorialContext,
  type MultisensorialPrefs,
} from "@/hooks/useMultisensorialPrefs";

export function MultisensorialProvider({
  prefs,
  children,
}: {
  prefs: MultisensorialPrefs;
  children: ReactNode;
}) {
  return (
    <MultisensorialContext.Provider value={prefs}>
      {children}
    </MultisensorialContext.Provider>
  );
}
