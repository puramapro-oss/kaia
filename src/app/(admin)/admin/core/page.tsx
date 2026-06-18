import { createServiceClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const date = (d: string | null) => (d ? formatDateTime(d) : "—");

export default async function AdminCorePage() {
  const admin = createServiceClient();
  const { data } = await admin
    .from("core_events")
    .select("id, type, title, status, starts_at, auto_created_by_radar, world_radar_score")
    .order("starts_at", { ascending: false })
    .limit(100);
  const list = data ?? [];

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Événements C.O.R.E. ({list.length})</h1>
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/60 border-b border-white/[0.08]">
              <th className="py-2.5 px-4">Titre</th><th className="py-2.5 px-4">Type</th>
              <th className="py-2.5 px-4">Début</th><th className="py-2.5 px-4">Statut</th>
              <th className="py-2.5 px-4">Radar</th>
            </tr>
          </thead>
          <tbody>
            {list.map((e) => (
              <tr key={e.id as string} className="border-b border-white/[0.04]">
                <td className="py-2 px-4">{e.title}</td>
                <td className="py-2 px-4 text-xs">{e.type}</td>
                <td className="py-2 px-4 text-xs text-white/60">{date(e.starts_at as string)}</td>
                <td className="py-2 px-4 text-xs">{e.status}</td>
                <td className="py-2 px-4 text-xs">
                  {e.auto_created_by_radar ? <span className="text-amber-300">{e.world_radar_score ?? "?"}/100</span> : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="text-center py-12 text-white/50">Aucun événement.</p>}
      </div>
    </div>
  );
}
