import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { ADMIN_SESSION_COOKIE, isAdminEmail } from "@/lib/admin/auth";
import { findAdminSession } from "@/lib/admin/session";
import { AdminSignOut } from "@/components/admin/AdminSignOut";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/stats", label: "Stats" },
  { href: "/admin/users", label: "Utilisateurs" },
  { href: "/admin/missions", label: "Missions à valider" },
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/admin/donations", label: "Dons" },
  { href: "/admin/content", label: "Contenu" },
  { href: "/admin/flags", label: "Feature flags" },
];

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdminEmail(user.email)) {
    // 403 silencieux
    redirect("/dashboard");
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!sessionToken) {
    redirect("/admin/login");
  }

  const admin = createServiceClient();
  const session = await findAdminSession({ admin, rawToken: sessionToken });
  if (!session || session.user_id !== user.id) {
    redirect("/admin/login?reason=expired");
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <header className="border-b border-white/[0.08] bg-black/40 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-amber-300 font-display text-sm">KAÏA · Admin</span>
            <span className="text-xs text-white/40">{user.email}</span>
          </div>
          <AdminSignOut />
        </div>
      </header>
      <nav className="border-b border-white/[0.06] bg-black/20" aria-label="Admin">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
          <ul className="flex gap-1 py-2">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="px-3 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/[0.06] whitespace-nowrap"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
