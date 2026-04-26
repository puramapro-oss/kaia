"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ className = "" }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut({ scope: "local" });
      // Hard reset for any in-memory state, then full nav.
      try {
        sessionStorage.clear();
        localStorage.removeItem("kaia_intro_seen");
      } catch {
        // storage may be unavailable (private mode)
      }
      window.location.href = "/login";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Déconnexion impossible.";
      toast.error("Oups", { description: message });
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={loading}
      className={`inline-flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-white/55 hover:text-red-300 hover:bg-red-500/10 wellness-anim disabled:opacity-50 ${className}`}
    >
      <LogOut className="w-4 h-4" />
      {loading ? "Au revoir…" : "Me déconnecter"}
    </button>
  );
}
