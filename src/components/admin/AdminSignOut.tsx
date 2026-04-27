"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function AdminSignOut() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function logout() {
    startTransition(async () => {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    });
  }
  return (
    <button
      onClick={logout}
      disabled={pending}
      className="text-xs text-white/60 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.06]"
    >
      {pending ? "…" : "Déconnexion"}
    </button>
  );
}
