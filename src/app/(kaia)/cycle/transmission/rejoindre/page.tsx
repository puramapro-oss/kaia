import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { parseInviteParams, INVITE_TTL_MS } from "@/lib/transmission/invite";
import { formatRelativeTime } from "@/lib/utils";
import JoinClient from "./JoinClient";

export const metadata: Metadata = { title: "Rejoindre une transmission — KAÏA" };
export const dynamic = "force-dynamic";

const ROLE_LABEL = { fille: "Fille", mere: "Mère" } as const;

export default async function RejoindrePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") params.set(k, v);
  const parsed = parseInviteParams(params);

  const shell = (children: React.ReactNode) => (
    <div className="px-5 py-12 max-w-md mx-auto">
      <h1 className="font-display text-2xl font-semibold gradient-kaia-text mb-6 text-center">
        Transmission KAÏA
      </h1>
      {children}
    </div>
  );

  if (!parsed) {
    return shell(
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-sm text-[var(--foreground-muted)]">Ce lien d'invitation est incomplet ou invalide.</p>
      </div>
    );
  }

  // Validation du token côté serveur (service role — RLS by-pass contrôlé).
  const admin = createServiceClient();
  const { data: space } = await admin
    .from("transmission_spaces")
    .select("id, invite_token, guest_allowed, owner_id, guest_id, created_at")
    .eq("id", parsed.spaceId)
    .maybeSingle();

  if (!space || space.invite_token !== parsed.token) {
    return shell(
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-sm text-[var(--foreground-muted)]">Ce lien n'est plus valide.</p>
      </div>
    );
  }

  // TTL d'invitation appliqué à TOUS les accès (auth + invitée web).
  if (Date.now() - new Date(space.created_at).getTime() > INVITE_TTL_MS) {
    return shell(
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-sm text-[var(--foreground-muted)]">Ce lien d'invitation a expiré.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Invitée connectée → on la rattache à l'espace puis redirige.
  if (user) {
    return shell(<JoinClient spaceId={parsed.spaceId} token={parsed.token} />);
  }

  // Invitée ≥ 50 ans sans compte → consultation web seule (lecture seule).
  if (space.guest_allowed) {
    const { data: entries } = await admin
      .from("transmission_entries")
      .select("id, author_role, body, created_at")
      .eq("space_id", space.id)
      .order("created_at", { ascending: false })
      .limit(100);

    return shell(
      <div className="space-y-3">
        <p className="text-xs text-[var(--foreground-muted)] text-center mb-2">
          Tu consultes cet espace partagé. Pour y écrire, crée un compte gratuit.
        </p>
        {(entries ?? []).length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-[var(--foreground-muted)]">
            L'espace est encore vierge. 🌙
          </div>
        ) : (
          (entries ?? []).map((e) => (
            <div key={e.id} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[var(--kaia-moon)]">
                  {ROLE_LABEL[e.author_role as "fille" | "mere"]}
                </span>
                <span className="text-[10px] text-[var(--foreground-muted)]">{formatRelativeTime(e.created_at)}</span>
              </div>
              <p className="text-sm whitespace-pre-line">{e.body}</p>
            </div>
          ))
        )}
        <Link
          href={`/signup?next=${encodeURIComponent(`/cycle/transmission/rejoindre?${params.toString()}`)}`}
          className="block text-center mt-4 px-5 py-3 rounded-full font-medium text-sm gradient-kaia text-[var(--background)]"
        >
          Créer un compte pour participer
        </Link>
      </div>
    );
  }

  // Sinon → connexion requise.
  return shell(
    <div className="glass rounded-2xl p-8 text-center space-y-4">
      <p className="text-sm text-[var(--foreground-muted)]">Connecte-toi pour rejoindre cet espace de transmission.</p>
      <Link
        href={`/login?next=${encodeURIComponent(`/cycle/transmission/rejoindre?${params.toString()}`)}`}
        className="inline-block px-5 py-3 rounded-full font-medium text-sm gradient-kaia text-[var(--background)]"
      >
        Se connecter
      </Link>
    </div>
  );
}
