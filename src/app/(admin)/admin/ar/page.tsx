import { createServiceClient } from "@/lib/supabase/admin";
import { AR_PROTOCOLS } from "@/lib/ar/protocols";

export const dynamic = "force-dynamic";

export default async function AdminArPage() {
  const admin = createServiceClient();
  const { count } = await admin
    .from("ar_sessions")
    .select("id", { count: "exact", head: true });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Miroir Énergétique (AR)</h1>
        <span className="text-xs text-white/50">Sessions enregistrées : {count ?? 0}</span>
      </div>
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/60 border-b border-white/[0.08]">
              <th className="py-2.5 px-4">Protocole</th><th className="py-2.5 px-4">Slug</th>
              <th className="py-2.5 px-4">Cibles</th><th className="py-2.5 px-4">Durée</th>
              <th className="py-2.5 px-4">Crisis-safe</th>
            </tr>
          </thead>
          <tbody>
            {AR_PROTOCOLS.map((p) => (
              <tr key={p.slug} className="border-b border-white/[0.04]">
                <td className="py-2 px-4">{p.emoji} {p.name}</td>
                <td className="py-2 px-4 font-mono text-xs">{p.slug}</td>
                <td className="py-2 px-4 text-xs text-white/60">{p.targetTypes.join(", ")}</td>
                <td className="py-2 px-4 text-xs">{Math.round(p.durationSec / 60)} min</td>
                <td className="py-2 px-4 text-xs text-emerald-300">{p.crisisSafe ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
