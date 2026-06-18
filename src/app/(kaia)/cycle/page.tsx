import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { detectPhase, getCycleDay } from "@/lib/cycle/phases";
import PhaseCard from "@/components/cycle/PhaseCard";
import LunarCalendar from "@/components/cycle/LunarCalendar";
import CycleInput from "@/components/cycle/CycleInput";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookHeart, Flower2, Users, HandHeart } from "lucide-react";

const CYCLE_LINKS = [
  { href: "/cycle/guide", label: "Guide de Vie", desc: "Ton quotidien par phase", Icon: BookHeart },
  { href: "/cycle/rituels", label: "Rituels", desc: "Gestes sacrés du moment", Icon: Flower2 },
  { href: "/cycle/transmission", label: "Transmission", desc: "Mères & filles reliées", Icon: Users },
  { href: "/cycle/reconciliation", label: "Réconciliation", desc: "Apaiser ta relation au corps", Icon: HandHeart },
];

export const metadata: Metadata = { title: "Mon Cycle — KAÏA" };

export default async function CyclePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("cycle_start_date, cycle_duration")
    .eq("id", user.id)
    .single();

  const cycleStartDate = profile?.cycle_start_date;
  const cycleDuration = profile?.cycle_duration || 28;

  let currentPhase = null;
  let cycleDay = 0;
  let lunaRecommendation = null;

  if (cycleStartDate) {
    const startDate = new Date(cycleStartDate);
    cycleDay = getCycleDay(startDate);
    currentPhase = detectPhase(cycleDay, cycleDuration);

    // Fetch LUNA recommendation
    try {
      const recRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/api/luna/recommend`, {
        cache: "no-store",
      });
      if (recRes.ok) {
        const recData = await recRes.json();
        lunaRecommendation = recData.recommendation;
      }
    } catch {
      // Ignore if API fails
    }
  }

  return (
    <div className="px-5 py-8 max-w-4xl mx-auto space-y-6">
      <h1 className="font-cormorant text-4xl font-semibold text-kaia-moon">Mon Cycle</h1>

      <div className="grid grid-cols-2 gap-3">
        {CYCLE_LINKS.map(({ href, label, desc, Icon }) => (
          <Link
            key={href}
            href={href}
            className="bg-white/5 backdrop-blur-xl border border-white/8 rounded-2xl p-4 hover:bg-white/10 transition-colors"
          >
            <Icon className="w-5 h-5 text-kaia-moon mb-2" />
            <p className="font-medium text-sm">{label}</p>
            <p className="text-xs text-white/60 mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>

      {!cycleStartDate ? (
        <ClientCycleInput />
      ) : (
        <>
          {/* Phase Card */}
          {currentPhase && <PhaseCard phase={currentPhase} />}

          {/* Lunar Calendar */}
          {cycleStartDate && (
            <LunarCalendar startDate={new Date(cycleStartDate)} cycleDay={cycleDay} />
          )}

          {/* Journal du jour button */}
          <Link
            href="/cycle/journal"
            className="block bg-white/5 backdrop-blur-xl border border-white/8 rounded-2xl p-6 hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-cormorant font-semibold text-kaia-moon group-hover:text-kaia-gold transition-colors">
                  Journal du jour
                </h3>
                <p className="text-sm text-white/60">
                  Note tes symptômes, humeur, énergie
                </p>
              </div>
              <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* LUNA recommendation */}
          {lunaRecommendation && (
            <div className="bg-gradient-to-br from-kaia-moon/10 to-kaia-gold/10 border border-kaia-moon/20 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌙</span>
                <h3 className="text-lg font-cormorant font-semibold text-kaia-moon">
                  Recommandation de LUNA
                </h3>
              </div>
              <p className="text-white/80 leading-relaxed">{lunaRecommendation}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ClientCycleInput() {
  return (
    <CycleInput
      onSaved={() => {
        window.location.reload();
      }}
    />
  );
}
