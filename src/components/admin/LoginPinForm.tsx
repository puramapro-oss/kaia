"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function LoginPinForm({ totpEnabled }: { totpEnabled: boolean }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/login-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "PIN incorrect.");
        return;
      }
      const j = await res.json();
      if (j.next === "totp") {
        // Refresh page → server détecte cookie pre2fa et affiche TOTP form
        router.refresh();
      } else {
        router.push("/admin");
      }
    });
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs text-white/60">PIN admin</label>
      <input
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="current-password"
        maxLength={8}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        autoFocus
        className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 font-mono text-center text-2xl tracking-widest"
        aria-label="PIN admin"
      />
      <button
        onClick={submit}
        disabled={pending}
        className="w-full rounded-xl bg-amber-300 text-black font-medium py-2.5 hover:bg-amber-200 disabled:opacity-60"
      >
        {pending ? "…" : totpEnabled ? "Continuer (2FA)" : "Connexion"}
      </button>
      {error && (
        <p className="text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
