import { createServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const admin = createServiceClient();
  const query = sp.q?.trim();

  let req = admin
    .from("profiles")
    .select("id, email, full_name, plan, awakening_level, created_at, onboarded_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (query) {
    req = req.ilike("email", `%${query}%`);
  }

  const { data: users } = await req;
  const list = users ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="font-display text-2xl">Utilisateurs ({list.length})</h1>
        <form className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query ?? ""}
            placeholder="Rechercher email…"
            className="rounded-lg bg-black/30 border border-white/10 px-3 py-1.5 text-sm w-64"
          />
          <button className="rounded-lg bg-amber-300 text-black text-sm px-3 py-1.5">
            OK
          </button>
        </form>
      </div>
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/60 border-b border-white/[0.08]">
              <th className="py-2.5 px-4">Email</th>
              <th className="py-2.5 px-4">Nom</th>
              <th className="py-2.5 px-4">Plan</th>
              <th className="py-2.5 px-4">Niveau</th>
              <th className="py-2.5 px-4">Inscrit</th>
              <th className="py-2.5 px-4">Onboardé</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id as string} className="border-b border-white/[0.04]">
                <td className="py-2 px-4 font-mono text-xs">{u.email}</td>
                <td className="py-2 px-4">{(u.full_name as string) ?? "—"}</td>
                <td className="py-2 px-4">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      u.plan === "active"
                        ? "bg-emerald-300/15 text-emerald-200"
                        : "bg-white/[0.06] text-white/60"
                    }`}
                  >
                    {(u.plan as string) ?? "free"}
                  </span>
                </td>
                <td className="py-2 px-4 text-amber-300">{u.awakening_level ?? 1}</td>
                <td className="py-2 px-4 text-xs text-white/60">
                  {new Date(u.created_at as string).toLocaleDateString("fr-FR")}
                </td>
                <td className="py-2 px-4 text-xs text-white/60">
                  {u.onboarded_at
                    ? new Date(u.onboarded_at as string).toLocaleDateString("fr-FR")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <p className="text-center py-12 text-white/50">Aucun utilisateur trouvé.</p>
        )}
      </div>
    </div>
  );
}
