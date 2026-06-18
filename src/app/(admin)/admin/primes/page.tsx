import { createServiceClient } from "@/lib/supabase/admin";
import { formatPrice, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const eur = (c: number | null) => formatPrice(c ?? 0);
const date = (d: string | null) => (d ? formatDate(d) : "—");

export default async function AdminPrimesPage() {
  const admin = createServiceClient();
  const { data } = await admin
    .from("primes")
    .select("id, user_id, type, amount_cents, paid_at, retraction_deadline_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const list = data ?? [];

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Primes Phase 1 ({list.length})</h1>
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/60 border-b border-white/[0.08]">
              <th className="py-2.5 px-4">User</th><th className="py-2.5 px-4">Type</th>
              <th className="py-2.5 px-4">Montant</th><th className="py-2.5 px-4">Versée</th>
              <th className="py-2.5 px-4">Fin rétractation</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id as string} className="border-b border-white/[0.04]">
                <td className="py-2 px-4 font-mono text-xs">{(p.user_id as string).slice(0, 8)}</td>
                <td className="py-2 px-4 uppercase text-xs text-amber-300">{p.type}</td>
                <td className="py-2 px-4">{eur(p.amount_cents)}</td>
                <td className="py-2 px-4 text-xs">{p.paid_at ? date(p.paid_at as string) : <span className="text-amber-300">en attente</span>}</td>
                <td className="py-2 px-4 text-xs text-white/60">{date(p.retraction_deadline_at as string)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="text-center py-12 text-white/50">Aucune prime.</p>}
      </div>
    </div>
  );
}
