"use client";

/**
 * ReferralTracker — appelle `/api/referral/track` au mount pour set le cookie
 * `kaia_ref` httpOnly 30 jours.
 */
import { useEffect } from "react";

interface Props {
  code: string;
}

export function ReferralTracker({ code }: Props) {
  useEffect(() => {
    if (!code) return;
    const sessionKey = `kaia-ref-tracked:${code}`;
    try {
      if (sessionStorage.getItem(sessionKey)) return;
      sessionStorage.setItem(sessionKey, "1");
    } catch {
      // ignore
    }
    void fetch(`/api/referral/track?code=${encodeURIComponent(code)}`, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    }).catch(() => {});
  }, [code]);

  return null;
}
