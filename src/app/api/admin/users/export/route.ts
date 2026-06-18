import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { toCsv, type CsvColumn } from "@/lib/admin/csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface UserRow {
  email: string;
  full_name: string | null;
  plan: string | null;
  created_at: string | null;
  onboarded_at: string | null;
  banned_at: string | null;
}

const COLUMNS: CsvColumn<UserRow>[] = [
  { key: "email", header: "Email", value: (r) => r.email },
  { key: "full_name", header: "Nom", value: (r) => r.full_name },
  { key: "plan", header: "Plan", value: (r) => r.plan ?? "free" },
  { key: "created_at", header: "Inscrit le", value: (r) => r.created_at },
  { key: "onboarded_at", header: "Onboardé le", value: (r) => r.onboarded_at },
  { key: "banned_at", header: "Banni le", value: (r) => r.banned_at },
];

/** Export CSV des utilisateurs (admin only, audité). */
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const { admin, userId: adminId, ip } = guard;
  const { data } = await admin
    .from("profiles")
    .select("email, full_name, plan, created_at, onboarded_at, banned_at")
    .order("created_at", { ascending: false })
    .limit(10000);

  const csv = toCsv((data ?? []) as UserRow[], COLUMNS);

  await admin.rpc("log_admin_audit", {
    p_admin_user_id: adminId,
    p_action: "users_exported_csv",
    p_target_table: "profiles",
    p_target_id: null,
    p_before: {},
    p_after: { count: data?.length ?? 0 },
    p_ip: ip,
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kaia-users.csv"`,
    },
  });
}
