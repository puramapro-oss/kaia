"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import GrainesWallet from "@/components/terra-nova/GrainesWallet";
import KYCGate from "@/components/terra-nova/KYCGate";
import BackButton from "@/components/ui/BackButton";
import type { TerraNode } from "@/components/terra-nova/TerraNovaMap";

const TerraNovaMap = dynamic(() => import("@/components/terra-nova/TerraNovaMap"), {
  ssr: false,
  loading: () => <div className="w-full h-72 rounded-2xl glass animate-pulse" />,
});

export default function TerraNovaClient({
  nodes,
  balance,
  totalEarned,
  kycCompleted,
}: {
  nodes: TerraNode[];
  balance: number;
  totalEarned: number;
  kycCompleted: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  function createNode() {
    if (!navigator.geolocation) {
      toast.error("Géolocalisation indisponible sur cet appareil.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/terra-nova/create-node", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude, meetingType: "rencontre" }),
          });
          const data = await res.json();
          if (!res.ok) {
            toast.error(data.error ?? "Création impossible.");
            return;
          }
          toast.success("Nœud créé sur la carte 🌍");
          router.refresh();
        } catch {
          toast.error("Connexion impossible.");
        } finally {
          setBusy(false);
        }
      },
      () => {
        toast.error("Autorise la géolocalisation pour créer un nœud.");
        setBusy(false);
      },
    );
  }

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto pb-28 space-y-6">
      <BackButton href="/moi" />

      <div>
        <h1 className="font-display text-3xl font-semibold gradient-kaia-text mb-2">TERRA NOVA</h1>
        <p className="text-[var(--foreground-muted)] text-sm">
          Le réseau des rencontres réelles — sème une graine là où tu es
        </p>
      </div>

      <TerraNovaMap nodes={nodes} />

      <button
        onClick={createNode}
        disabled={busy}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-gold)] text-sm font-medium disabled:opacity-50"
      >
        <MapPin className="w-4 h-4" />
        {busy ? "..." : "Créer un nœud ici"}
      </button>

      <GrainesWallet balance={balance} totalEarned={totalEarned} />
      <KYCGate kycCompleted={kycCompleted} />
    </div>
  );
}
