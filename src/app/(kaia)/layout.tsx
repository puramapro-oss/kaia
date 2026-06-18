import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import KaiaShell from "@/components/layout/KaiaShell";
import PageTransition from "@/components/layout/PageTransition";
import { SUPER_ADMIN_EMAIL } from "@/lib/constants";

export default async function KaiaLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <KaiaShell
      isSuperAdmin={user?.email === SUPER_ADMIN_EMAIL}
      userEmail={user?.email}
    >
      <PageTransition>{children}</PageTransition>
    </KaiaShell>
  );
}
