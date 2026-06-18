"use client";

import Link from "next/link";
import { useState } from "react";
import { BookHeart, HeartHandshake, Wind, Users, MessageCircle, Sparkles, Lock, Copy } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import { toast } from "sonner";

interface CaregiverModule {
  title: string;
  description: string;
  href: string;
  icon: typeof BookHeart;
}

const MODULES: CaregiverModule[] = [
  { title: "Comprendre son cycle", description: "Les 4 phases et leurs besoins, expliquées simplement.", href: "/cycle/rituels", icon: BookHeart },
  { title: "Soutien émotionnel", description: "Comment accompagner phase par phase, sans projeter.", href: "/luna?mode=caregiver_support", icon: HeartHandshake },
  { title: "AURORA pour aidant·e", description: "Respiration guidée pour te ressourcer toi aussi.", href: "/aurora", icon: Wind },
  { title: "Cercle accompagnants", description: "Un espace collectif C.O.R.E. entre aidant·es.", href: "/core", icon: Users },
  { title: "Questions fréquentes", description: "LUNA répond aux questions des accompagnant·es.", href: "/luna?mode=caregiver_support", icon: MessageCircle },
  { title: "Bien-être aidant·e", description: "Prévenir l'épuisement, poser des limites saines.", href: "/aurora", icon: Sparkles },
];

export default function CaregiverDashboard({
  unlocked,
  inviteCode,
}: {
  unlocked: boolean;
  inviteCode: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyInvite() {
    const url = `${window.location.origin}/r/${inviteCode}`;
    if (await copyToClipboard(url)) {
      setCopied(true);
      toast.success("Lien d'invitation copié");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!unlocked) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Lock className="w-8 h-8 text-[var(--kaia-moon)] mx-auto mb-3" />
        <h2 className="font-display text-xl font-medium mb-2">Espace réservé</h2>
        <p className="text-sm text-[var(--foreground-muted)] mb-5">
          L&apos;espace Accompagnants est inclus dans les plans Infini et Légende.
        </p>
        <Link
          href="/moi/abonnement"
          className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-gold)] text-sm font-medium"
        >
          Découvrir les plans
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MODULES.map((m) => (
          <Link key={m.title} href={m.href} className="glass rounded-2xl p-5 hover:bg-[var(--kaia-moon)]/10 transition-colors">
            <m.icon className="w-5 h-5 text-[var(--kaia-moon)] mb-2" />
            <h3 className="font-medium text-sm mb-1">{m.title}</h3>
            <p className="text-xs text-[var(--foreground-muted)]">{m.description}</p>
          </Link>
        ))}
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-medium mb-1">Inviter la personne que j&apos;accompagne</h3>
        <p className="text-xs text-[var(--foreground-muted)] mb-3">
          Partage ce lien pour relier vos comptes (avec son accord).
        </p>
        <button
          onClick={copyInvite}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--kaia-moon)]/20 hover:bg-[var(--kaia-moon)]/30 transition-colors text-sm"
        >
          <Copy className="w-4 h-4" />
          {copied ? "Lien copié ✓" : "Copier le lien d'invitation"}
        </button>
      </div>
    </div>
  );
}
