import { createServiceClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const eur = (c: number) => formatPrice(c);

export default async function AdminConnectPage() {
  const admin = createServiceClient();
  const { data: accounts } = await admin
    .from("profiles")
    .select("id, email, stripe_connect_account_id")
    .not("stripe_connect_account_id", "is", null)
    .limit(200);

  // Parts non versées bornées aux comptes affichés (évite un fetch non borné).
  const accountIds = (accounts ?? []).map((a) => a.id as string);
  const { data: pending } = accountIds.length
    ? await admin
        .from("karma_user_shares")
        .select("user_id, share_amount_cents")
        .is("paid_at", null)
        .in("user_id", accountIds)
    : { data: [] };

  const pendingByUser = (pending ?? []).reduce<Record<string, number>>((acc, s) => {
    acc[s.user_id as string] = (acc[s.user_id as string] ?? 0) + (s.share_amount_cents ?? 0);
    return acc;
  }, {});
  const list = accounts ?? [];
  const totalPending = Object.values(pendingByUser).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Stripe Connect ({list.length})</h1>
        <span className="text-xs text-white/50">Total parts non versées : {eur(totalPending)}</span>
      </div>
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/60 border-b border-white/[0.08]">
              <th className="py-2.5 px-4">Email</th><th className="py-2.5 px-4">Compte Connect</th>
              <th className="py-2.5 px-4">Parts en attente</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id as string} className="border-b border-white/[0.04]">
                <td className="py-2 px-4 font-mono text-xs">{u.email}</td>
                <td className="py-2 px-4 font-mono text-xs text-white/60">{u.stripe_connect_account_id}</td>
                <td className="py-2 px-4">{eur(pendingByUser[u.id as string] ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="text-center py-12 text-white/50">Aucun compte Connect.</p>}
      </div>
    </div>
  );
}
