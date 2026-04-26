"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function GoogleButton({ next = "/dashboard" }: { next?: string }) {
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL ?? "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Échec de la connexion Google.";
      toast.error("Google indisponible", { description: message });
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      disabled={loading}
      className="w-full inline-flex items-center justify-center gap-3 h-12 rounded-2xl border border-white/12 bg-white/[0.04] text-white text-sm font-medium hover:bg-white/[0.08] active:scale-[0.99] wellness-anim disabled:opacity-60"
    >
      {loading ? (
        <span className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      ) : (
        <GoogleLogo />
      )}
      Continuer avec Google
    </button>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#FFC107"
        d="M21.8 12.2c0-.7-.1-1.4-.2-2.1H12v3.9h5.5a4.7 4.7 0 0 1-2 3v2.5h3.3c1.9-1.8 3-4.4 3-7.3z"
      />
      <path
        fill="#FF3D00"
        d="M12 22c2.7 0 5-1 6.7-2.5l-3.3-2.5c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4H3v2.5A10 10 0 0 0 12 22z"
      />
      <path
        fill="#4CAF50"
        d="M6.5 14a5.9 5.9 0 0 1 0-4V7.5H3a10 10 0 0 0 0 9L6.5 14z"
      />
      <path
        fill="#1976D2"
        d="M12 6c1.5 0 2.8.5 3.9 1.5l2.9-2.9A10 10 0 0 0 3 7.5L6.5 10A5.9 5.9 0 0 1 12 6z"
      />
    </svg>
  );
}
