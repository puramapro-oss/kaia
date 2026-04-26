"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export function SubscribeStarter({
  plan,
  returnUrl,
}: {
  plan: "monthly" | "yearly";
  returnUrl?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        toast.error("Paiement indisponible", {
          description: data?.error ?? "Réessaie dans quelques instants.",
        });
        setLoading(false);
        return;
      }
      window.location.href = data.url as string;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur réseau.";
      toast.error("Connexion impossible", { description: message });
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button onClick={start} loading={loading} className="w-full">
        {plan === "yearly" ? "Continuer (annuel −30 %)" : "Continuer"}
      </Button>
      <p className="text-[11px] text-white/40 text-center">
        En continuant, tu acceptes nos conditions et démarres l'essai 14 jours.
      </p>
      {returnUrl ? (
        <p className="text-[11px] text-white/30 text-center">
          Tu seras redirigé·e vers : <code className="text-white/50">{returnUrl}</code>
        </p>
      ) : null}
    </div>
  );
}
