import { createServiceClient } from "@/lib/supabase/admin";
import { PayoutMarkPaidButton } from "@/components/admin/PayoutMarkPaidButton";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  const admin = createServiceClient();
  const { data } = await admin
    .from("influencer_payouts")
    .select(`
      id, user_id, amount_cents, status, iban, paid_at, created_at,
      profiles:user_id (email, full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  const list = (data ?? []) as unknown as Array<{
    id: string;
    user_id: string;
    amount_cents: number;
    status: string;
    iban: string | null;
    paid_at: string | null;
    created_at: string;
    profiles: { email: string; full_name: string | null } | null;
  }>;

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Payouts influenceurs</h1>
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/60 border-b border-white/[0.08]">
              <th className="py-2.5 px-4">Email</th>
              <th className="py-2.5 px-4">Montant</th>
              <th className="py-2.5 px-4">IBAN</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Demande</th>
              <th className="py-2.5 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-b border-white/[0.04]">
                <td className="py-2 px-4 font-mono text-xs">{p.profiles?.email ?? "—"}</td>
                <td className="py-2 px-4 font-mono text-amber-300">
                  {(p.amount_cents / 100).toFixed(2)} €
                </td>
                <td className="py-2 px-4 font-mono text-xs">{p.iban ?? "—"}</td>
                <td className="py-2 px-4">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      p.status === "paid"
                        ? "bg-emerald-300/15 text-emerald-200"
                        : p.status === "pending"
                          ? "bg-amber-300/15 text-amber-200"
                          : "bg-rose-300/15 text-rose-200"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="py-2 px-4 text-xs text-white/60">
                  {new Date(p.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="py-2 px-4">
                  {p.status === "pending" && <PayoutMarkPaidButton payoutId={p.id} />}
                  {p.status === "paid" && (
                    <span className="text-xs text-white/40">
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString("fr-FR") : "✓"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <p className="text-center py-12 text-white/50">Aucun payout.</p>
        )}
      </div>
    </div>
  );
}
