import { createClient } from "@/lib/supabase/server";
import MaMemoirePage from "@/lib/legal/components/MaMemoirePage";

export const metadata = { title: "Mes données" };

export default async function DataPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: acceptancesRaw }, { data: deletionRequest }] = user
    ? await Promise.all([
        supabase
          .from("legal_acceptances")
          .select("doc_type, version, accepted_at")
          .eq("user_id", user.id),
        supabase
          .from("account_deletion_requests")
          .select("scheduled_for")
          .eq("user_id", user.id)
          .eq("status", "scheduled")
          .maybeSingle(),
      ])
    : [{ data: null }, { data: null }];

  const acceptations = (acceptancesRaw ?? []).map((a) => ({
    docType: a.doc_type,
    version: a.version,
    acceptedAt: a.accepted_at,
  }));

  return (
    <MaMemoirePage
      appName="KAÏA"
      acceptations={acceptations}
      deletionScheduledFor={deletionRequest?.scheduled_for ?? null}
      exportEndpoint="/api/rgpd/export"
      deleteEndpoint="/api/account/delete"
      cancelDeleteEndpoint="/api/account/delete"
    />
  );
}
