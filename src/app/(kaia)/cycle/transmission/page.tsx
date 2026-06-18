import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TransmissionSpace, { type TransmissionEntry } from "@/components/transmission/TransmissionSpace";
import { buildInvite, invitePath, type TransmissionRole } from "@/lib/transmission/invite";
import BackButton from "@/components/ui/BackButton";

export const metadata: Metadata = {
  title: "Transmission Mères / Filles — KAÏA",
  description: "Un espace partagé et intergénérationnel pour transmettre, écrire et se relier.",
};

export default async function TransmissionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Espace possédé (rôle fille) prioritaire ; sinon espace rejoint (rôle mère).
  const { data: owned } = await supabase
    .from("transmission_spaces")
    .select("id, invite_token, owner_id, guest_id")
    .eq("owner_id", user.id)
    .maybeSingle();

  const { data: joined } = owned
    ? { data: null }
    : await supabase
        .from("transmission_spaces")
        .select("id, invite_token, owner_id, guest_id")
        .eq("guest_id", user.id)
        .maybeSingle();

  const space = owned ?? joined;
  const role: TransmissionRole = owned ? "fille" : "mere";

  let entries: TransmissionEntry[] = [];
  let initialInvitePath: string | null = null;
  if (space) {
    const { data } = await supabase
      .from("transmission_entries")
      .select("id, author_role, body, created_at")
      .eq("space_id", space.id)
      .order("created_at", { ascending: false })
      .limit(100);
    entries = (data ?? []) as TransmissionEntry[];

    if (owned) {
      const invite = buildInvite({
        spaceId: space.id,
        token: space.invite_token,
        role: "mere",
        issuedAt: Date.now(),
      });
      initialInvitePath = invitePath(invite);
    }
  }

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto pb-28">
      <BackButton href="/cycle" />
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold gradient-kaia-text mb-2">
          Transmission Mères / Filles
        </h1>
        <p className="text-[var(--foreground-muted)] text-sm">
          Un fil sacré entre les générations. Écrivez, transmettez, reliez-vous.
        </p>
      </div>
      <TransmissionSpace
        spaceId={space?.id ?? null}
        role={role}
        initialEntries={entries}
        initialInvitePath={initialInvitePath}
      />
    </div>
  );
}
