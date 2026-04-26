import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscribeStarter } from "@/components/subscribe/SubscribeStarter";
import { GlassCard } from "@/components/ui/Card";

export const metadata = { title: "Activer mon abonnement" };

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; user?: string; return?: string; app?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const params = await searchParams;

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/subscribe?${new URLSearchParams(params as Record<string, string>).toString()}`)}`);
  }

  const plan = params.plan === "yearly" ? "yearly" : "monthly";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2.5 mb-10 justify-center" aria-label="KAÏA">
          <span
            aria-hidden
            className="h-9 w-9 rounded-2xl bg-gradient-to-br from-[var(--color-kaia-green)] to-[var(--color-kaia-accent)] grid place-items-center text-white font-display text-base"
          >
            K
          </span>
          <span className="font-display text-xl text-white tracking-tight">KAÏA</span>
        </Link>

        <GlassCard className="space-y-6">
          <header className="space-y-2 text-center">
            <h1 className="font-display text-2xl text-white tracking-tight">
              Activer ton abonnement
            </h1>
            <p className="text-sm text-white/55">
              Tu es à un clic du parcours complet. 14 jours offerts.
            </p>
          </header>
          <Suspense fallback={<div className="h-12 rounded-2xl bg-white/5 animate-pulse" />}>
            <SubscribeStarter plan={plan} returnUrl={params.return} />
          </Suspense>
        </GlassCard>
      </div>
    </main>
  );
}
