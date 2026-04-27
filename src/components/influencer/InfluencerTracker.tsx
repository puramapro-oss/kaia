"use client";

/**
 * InfluencerTracker — composant client qui appelle `/api/influencer/track`
 * une seule fois au mount pour set le cookie httpOnly + log le clic.
 *
 * Aucun rendu visuel. Idempotent : utilise `sessionStorage` pour ne pas
 * spammer la route si l'utilisateur navigue dans le même onglet.
 */

import { useEffect } from "react";

interface Props {
  code: string;
}

export function InfluencerTracker({ code }: Props) {
  useEffect(() => {
    if (!code) return;
    const sessionKey = `kaia-inf-tracked:${code}`;
    try {
      if (sessionStorage.getItem(sessionKey)) return;
      sessionStorage.setItem(sessionKey, "1");
    } catch {
      // sessionStorage indispo (navigation privée Safari ?) — on track quand même
    }
    void fetch(`/api/influencer/track?code=${encodeURIComponent(code)}`, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    }).catch(() => {
      // Best-effort
    });
  }, [code]);

  return null;
}
