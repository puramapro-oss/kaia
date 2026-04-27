import { createServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminDonationsPage() {
  const admin = createServiceClient();
  const { data } = await admin
    .from("donations")
    .select("id, amount_cents, cause, status, donor_email, receipt_sent_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const list = data ?? [];

  const total = list
    .filter((d) => d.status === "succeeded")
    .reduce((a, d) => a + ((d.amount_cents as number) ?? 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Dons</h1>
        <span className="text-sm text-white/60">
          Total succeeded affiché :{" "}
          <span className="text-rose-300 font-mono">{(total / 100).toFixed(2)} €</span>
        </span>
      </div>
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/60 border-b border-white/[0.08]">
              <th className="py-2.5 px-4">Date</th>
              <th className="py-2.5 px-4">Email</th>
              <th className="py-2.5 px-4">Cause</th>
              <th className="py-2.5 px-4">Montant</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Reçu</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.id as string} className="border-b border-white/[0.04]">
                <td className="py-2 px-4 text-xs text-white/60">
                  {new Date(d.created_at as string).toLocaleString("fr-FR")}
                </td>
                <td className="py-2 px-4 font-mono text-xs">{d.donor_email ?? "—"}</td>
                <td className="py-2 px-4">{d.cause as string}</td>
                <td className="py-2 px-4 font-mono text-rose-300">
                  {((d.amount_cents as number) / 100).toFixed(2)} €
                </td>
                <td className="py-2 px-4">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      d.status === "succeeded"
                        ? "bg-emerald-300/15 text-emerald-200"
                        : d.status === "pending"
                          ? "bg-amber-300/15 text-amber-200"
                          : "bg-rose-300/15 text-rose-200"
                    }`}
                  >
                    {d.status as string}
                  </span>
                </td>
                <td className="py-2 px-4 text-xs text-white/60">
                  {d.receipt_sent_at ? "✓ envoyé" : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <p className="text-center py-12 text-white/50">Aucun don.</p>
        )}
      </div>
    </div>
  );
}
