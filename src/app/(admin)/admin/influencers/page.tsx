import { createServiceClient } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";

export default async function AdminInfluencersPage() {
  const admin = createServiceClient();
  const { data } = await admin
    .from("influencer_applications")
    .select(`
      id, user_id, status, platform, followers, created_at,
      profiles:user_id (email, full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: links } = await admin
    .from("influencer_links")
    .select("id, user_id, code, clicks, conversions, first_percent, recurring_percent, is_active")
    .order("conversions", { ascending: false })
    .limit(200);

  type Application = {
    id: string;
    user_id: string;
    status: string;
    platform: string | null;
    followers: number | null;
    created_at: string;
    profiles: { email: string; full_name: string | null } | null;
  };

  type Link = {
    id: string;
    user_id: string;
    code: string;
    clicks: number;
    conversions: number;
    first_percent: number;
    recurring_percent: number;
    is_active: boolean;
  };

  const apps = (data ?? []) as unknown as Application[];
  const linkList = (links ?? []) as unknown as Link[];

  return (
    <div className="space-y-10">
      <h1 className="font-display text-2xl">Influenceurs</h1>

      <section>
        <h2 className="text-lg font-semibold mb-4">Candidatures</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-white/10">
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Plateforme</th>
                <th className="pb-2 pr-4">Followers</th>
                <th className="pb-2 pr-4">Statut</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 pr-4">{a.profiles?.email ?? a.user_id}</td>
                  <td className="py-2 pr-4">{a.platform ?? "—"}</td>
                  <td className="py-2 pr-4">{a.followers?.toLocaleString("fr-FR") ?? "—"}</td>
                  <td className="py-2 pr-4">
                    <span className={
                      a.status === "approved" ? "text-green-400" :
                      a.status === "rejected" ? "text-red-400" : "text-yellow-400"
                    }>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-2 text-white/50">{new Date(a.created_at).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Liens actifs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-white/10">
                <th className="pb-2 pr-4">Code</th>
                <th className="pb-2 pr-4">Clics</th>
                <th className="pb-2 pr-4">Conversions</th>
                <th className="pb-2 pr-4">1er paiement</th>
                <th className="pb-2">Récurrent</th>
              </tr>
            </thead>
            <tbody>
              {linkList.map((l) => (
                <tr key={l.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 pr-4 font-mono">{l.code}</td>
                  <td className="py-2 pr-4">{l.clicks}</td>
                  <td className="py-2 pr-4">{l.conversions}</td>
                  <td className="py-2 pr-4">{l.first_percent}%</td>
                  <td className="py-2">{l.recurring_percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
