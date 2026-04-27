import { createServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const admin = createServiceClient();
  const [contests, rituals, posts, flagged] = await Promise.all([
    admin
      .from("contests")
      .select("id, slug, kind, status, starts_at, ends_at, draw_at")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("weekly_rituals")
      .select("id, slug, theme, participants_count, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("community_posts")
      .select("id, content, hidden, flag_count, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("community_posts")
      .select("id, content, flag_count, hidden, created_at, user_id")
      .gte("flag_count", 1)
      .order("flag_count", { ascending: false })
      .limit(20),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Contenu & modération</h1>

      <section className="mb-8">
        <h2 className="font-display text-lg mb-3">Posts signalés ({flagged.data?.length ?? 0})</h2>
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/60 border-b border-white/[0.08]">
                <th className="py-2.5 px-4">Contenu</th>
                <th className="py-2.5 px-4">Flags</th>
                <th className="py-2.5 px-4">Hidden</th>
                <th className="py-2.5 px-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {(flagged.data ?? []).map((p) => (
                <tr key={p.id as string} className="border-b border-white/[0.04]">
                  <td className="py-2 px-4 max-w-md truncate text-white/80">
                    {p.content as string}
                  </td>
                  <td className="py-2 px-4 text-rose-300">{p.flag_count as number}</td>
                  <td className="py-2 px-4">{p.hidden ? "✓" : "—"}</td>
                  <td className="py-2 px-4 text-xs text-white/60">
                    {new Date(p.created_at as string).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(flagged.data ?? []).length === 0 && (
            <p className="text-center py-8 text-white/50 text-sm">Aucun post signalé.</p>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-display text-lg mb-3">Concours actifs / récents</h2>
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/60 border-b border-white/[0.08]">
                <th className="py-2.5 px-4">Slug</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Tirage</th>
              </tr>
            </thead>
            <tbody>
              {(contests.data ?? []).map((c) => (
                <tr key={c.id as string} className="border-b border-white/[0.04]">
                  <td className="py-2 px-4 font-mono text-xs">{c.slug as string}</td>
                  <td className="py-2 px-4">{c.kind as string}</td>
                  <td className="py-2 px-4">{c.status as string}</td>
                  <td className="py-2 px-4 text-xs text-white/60">
                    {new Date(c.draw_at as string).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg mb-3">Rituels hebdo (10 derniers)</h2>
        <ul className="text-sm space-y-1">
          {(rituals.data ?? []).map((r) => (
            <li key={r.id as string} className="rounded bg-black/20 px-3 py-2">
              <code className="font-mono text-xs">{r.slug as string}</code>{" "}
              · {r.theme as string} · {r.participants_count as number} participants
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-6 text-xs text-white/40">
        Édition manuelle des concours/rituels via DB Studio (à intégrer dans l&apos;admin
        complet en V1.1). Posts récents : {posts.data?.length ?? 0}.
      </p>
    </div>
  );
}
