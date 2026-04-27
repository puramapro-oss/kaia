import { redirect } from "next/navigation";
import { HandHeart, Sparkles, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DONATION_CAUSES } from "@/lib/donations/causes";
import { DonationForm } from "@/components/donations/DonationForm";

export const metadata = {
  title: "Soutenir — KAÏA",
  description:
    "Soutiens l'Association PURAMA et reçois un reçu fiscal (66 % défiscalisation).",
};

export const dynamic = "force-dynamic";

interface SearchParams {
  status?: string;
}

export default async function DonationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/donations");

  const sp = await searchParams;
  const status = sp.status;

  // Historique de mes 5 derniers dons
  const { data: history } = await supabase
    .from("donations")
    .select("id, amount_cents, cause, status, tokens_credited, tickets_credited, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <HandHeart className="h-7 w-7 text-rose-300" />
          <h1 className="font-display text-3xl">Soutenir</h1>
        </div>
        <p className="text-white/70 max-w-2xl">
          Tes dons financent l&apos;Association PURAMA et nos projets d&apos;impact.
          Chaque euro = 10 tokens VIDA + 1 ticket concours par tranche de 10 €.
        </p>
      </header>

      {status === "success" && (
        <div className="mb-6 rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-emerald-200 text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Don validé · ton reçu fiscal arrive par email sous quelques minutes.
        </div>
      )}
      {status === "cancel" && (
        <div className="mb-6 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-amber-100 text-sm">
          Paiement annulé — tu peux réessayer quand tu veux.
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        {DONATION_CAUSES.map((cause) => (
          <article
            key={cause.slug}
            className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="text-3xl">{cause.emoji}</div>
              <div>
                <h2 className="font-display text-xl">{cause.title}</h2>
                <p className="text-sm text-white/70 mt-1">{cause.short}</p>
              </div>
            </div>
            <DonationForm causeSlug={cause.slug} />
            <p className="mt-3 text-xs text-white/50 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              {cause.fiscalNote}
            </p>
          </article>
        ))}
      </div>

      <section>
        <h2 className="font-display text-xl mb-3">Mes derniers dons</h2>
        {(history ?? []).length === 0 ? (
          <p className="text-sm text-white/60">
            Aucun don pour le moment. Ton premier geste compte ✨
          </p>
        ) : (
          <ul className="space-y-2">
            {(history ?? []).map((d) => (
              <li
                key={d.id as string}
                className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2 text-sm"
              >
                <span className="text-white/70">
                  {new Date(d.created_at as string).toLocaleDateString("fr-FR")} ·{" "}
                  {d.cause as string}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-rose-300">
                    {((d.amount_cents as number) / 100).toFixed(2)} €
                  </span>
                  <StatusBadge status={d.status as string} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    succeeded: { label: "validé", cls: "bg-emerald-300/15 text-emerald-200" },
    pending: { label: "en attente", cls: "bg-amber-300/15 text-amber-200" },
    failed: { label: "échec", cls: "bg-rose-300/15 text-rose-200" },
    refunded: { label: "remboursé", cls: "bg-white/10 text-white/60" },
  };
  const meta = map[status] ?? { label: status, cls: "bg-white/10 text-white/60" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${meta.cls}`}>{meta.label}</span>
  );
}
