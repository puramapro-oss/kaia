import { createServiceClient } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";

export default async function AdminContestsPage() {
  const admin = createServiceClient();
  const { data } = await admin
    .from("contests")
    .select("id, title, type, status, start_at, end_at, prize_tokens, max_participants, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  type Contest = {
    id: string;
    title: string;
    type: string;
    status: string;
    start_at: string;
    end_at: string;
    prize_tokens: number;
    max_participants: number | null;
    created_at: string;
  };

  const list = (data ?? []) as unknown as Contest[];
  const fmt = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">Jeux concours</h1>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b border-white/10">
              <th className="pb-2 pr-4">Titre</th>
              <th className="pb-2 pr-4">Type</th>
              <th className="pb-2 pr-4">Statut</th>
              <th className="pb-2 pr-4">Début</th>
              <th className="pb-2 pr-4">Fin</th>
              <th className="pb-2 pr-4">Prix (tokens)</th>
              <th className="pb-2">Participants max</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-white/40">Aucun concours pour l&apos;instant</td>
              </tr>
            )}
            {list.map((c) => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2 pr-4 font-medium">{c.title}</td>
                <td className="py-2 pr-4 text-white/60">{c.type}</td>
                <td className="py-2 pr-4">
                  <span className={
                    c.status === "active" ? "text-green-400" :
                    c.status === "ended" ? "text-white/40" : "text-yellow-400"
                  }>
                    {c.status}
                  </span>
                </td>
                <td className="py-2 pr-4 text-white/60">{fmt(c.start_at)}</td>
                <td className="py-2 pr-4 text-white/60">{fmt(c.end_at)}</td>
                <td className="py-2 pr-4">{c.prize_tokens.toLocaleString("fr-FR")}</td>
                <td className="py-2">{c.max_participants ?? "∞"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
