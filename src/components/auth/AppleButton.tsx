"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/**
 * Sign in with Apple — obligatoire si Google OAuth présent (Apple Guidelines §4.8).
 * Provider configuré côté Supabase Auth (auth.purama.dev) avec Service ID + key.
 *
 * Sur web : redirige vers Apple OAuth flow.
 * Sur Capacitor iOS : utilise sign-in-with-apple natif (lib @capacitor-community
 * /apple-sign-in) → on pourra brancher en P10 mobile-tests si besoin. Le flow
 * web fonctionne déjà dans le WebView Capacitor.
 */
export function AppleButton({ next = "/dashboard" }: { next?: string }) {
  const [loading, setLoading] = useState(false);

  async function signInWithApple() {
    setLoading(true);
    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL ?? "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
          scopes: "name email",
        },
      });
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Échec de la connexion Apple.";
      toast.error("Apple indisponible", { description: message });
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={signInWithApple}
      disabled={loading}
      aria-label="Continuer avec Apple"
      className="w-full inline-flex items-center justify-center gap-3 h-12 rounded-2xl border border-white/15 bg-black/80 text-white text-sm font-medium hover:bg-black/90 active:scale-[0.99] wellness-anim disabled:opacity-60"
    >
      {loading ? (
        <span aria-hidden className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      ) : (
        <AppleLogo />
      )}
      Continuer avec Apple
    </button>
  );
}

function AppleLogo() {
  return (
    <svg width="16" height="18" viewBox="0 0 14 17" aria-hidden fill="currentColor">
      <path d="M11.6 9c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.2.8-.7 0-1.7-.7-2.8-.7-1.4 0-2.7.8-3.4 2.1-1.5 2.5-.4 6.3 1 8.4.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7 1.3 0 1.7.7 2.8.7 1.2 0 1.9-1 2.6-2.1.8-1.2 1.2-2.4 1.2-2.4 0 0-2.4-.9-2.4-3.6zM9.6 2.6c.6-.7 1-1.7.9-2.6-.9 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .1 2-.5 2.5-1.3z" />
    </svg>
  );
}
