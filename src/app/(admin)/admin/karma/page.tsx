import { createServiceClient } from "@/lib/supabase/admin";
import { JACKPOT_TERRE_CAP_EUR } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const eur = (c: number | null) => formatPrice(c ?? 0);

export default async function AdminKarmaPage() {
  const admin = createServiceClient();
  const { data } = await admin
    .from("karma_distributions")
    .select("period_month, total_revenue_cents, users_pool_cents, asso_pool_cents, sasu_pool_cents, status, opentimestamps_receipt")
    .order("period_month", { ascending: false })
    .limit(36);
  const list = data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Distributions KARMA ({list.length})</h1>
        <span className="text-xs text-white/50">Jackpot Terre cap : {JACKPOT_TERRE_CAP_EUR.toLocaleString("fr-FR")}€</span>
      </div>
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/60 border-b border-white/[0.08]">
              <th className="py-2.5 px-4">Mois</th><th className="py-2.5 px-4">Revenu</th>
              <th className="py-2.5 px-4">Users 50%</th><th className="py-2.5 px-4">Asso 10%</th>
              <th className="py-2.5 px-4">SASU 40%</th><th className="py-2.5 px-4">Statut</th><th className="py-2.5 px-4">OTS</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.period_month as string} className="border-b border-white/[0.04]">
                <td className="py-2 px-4 font-mono text-xs">{d.period_month}</td>
                <td className="py-2 px-4">{eur(d.total_revenue_cents)}</td>
                <td className="py-2 px-4">{eur(d.users_pool_cents)}</td>
                <td className="py-2 px-4">{eur(d.asso_pool_cents)}</td>
                <td className="py-2 px-4">{eur(d.sasu_pool_cents)}</td>
                <td className="py-2 px-4 text-xs">{d.status}</td>
                <td className="py-2 px-4 text-xs">{d.opentimestamps_receipt ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="text-center py-12 text-white/50">Aucune distribution.</p>}
      </div>
    </div>
  );
}
