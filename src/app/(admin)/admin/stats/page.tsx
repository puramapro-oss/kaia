import { createServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  const admin = createServiceClient();
  const now = new Date();
  const day = 86400000;

  const [d7, d30, totalUsers, activeUsers, mrrCents, donationsTotal, tokensIssued] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date(now.getTime() - 7 * day).toISOString()),
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date(now.getTime() - 30 * day).toISOString()),
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("plan", "active"),
      admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("plan", "active"),
      admin
        .from("donations")
        .select("amount_cents")
        .eq("status", "succeeded"),
      admin
        .from("user_tokens")
        .select("lifetime_earned"),
    ]);

  const mrr = ((mrrCents.count ?? 0) * 1499) / 100;
  const donationsAmount = (donationsTotal.data ?? []).reduce(
    (a, d) => a + ((d.amount_cents as number) ?? 0),
    0
  );
  const totalTokens = (tokensIssued.data ?? []).reduce(
    (a, t) => a + ((t.lifetime_earned as number) ?? 0),
    0
  );

  const rows: Array<{ k: string; v: string }> = [
    { k: "Total utilisateurs", v: String(totalUsers.count ?? 0) },
    { k: "Inscrits 7j", v: String(d7.count ?? 0) },
    { k: "Inscrits 30j", v: String(d30.count ?? 0) },
    { k: "Abonnés actifs", v: String(activeUsers.count ?? 0) },
    { k: "MRR estimé (mensuel)", v: `${mrr.toFixed(2)} €` },
    { k: "Dons cumulés", v: `${(donationsAmount / 100).toFixed(2)} €` },
    { k: "Tokens lifetime distribués", v: String(totalTokens) },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Statistiques</h1>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.k} className="border-b border-white/[0.06]">
              <td className="py-3 text-white/70">{r.k}</td>
              <td className="py-3 text-right font-mono text-amber-300 tabular-nums">{r.v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6 text-xs text-white/40">
        MRR estimé en multipliant les abonnés actifs par le tarif mensuel KAÏA Premium (14,99 €).
        Vérifie Stripe Sigma pour le chiffre exact.
      </p>
    </div>
  );
}
