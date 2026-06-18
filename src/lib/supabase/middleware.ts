import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "kaia" },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Statut de bannissement (fail-open : toute erreur → non banni, jamais de
  // verrouillage massif sur un hoquet DB).
  let bannedAt: string | null = null;
  if (user) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("banned_at")
        .eq("id", user.id)
        .maybeSingle();
      bannedAt = (data?.banned_at as string | null) ?? null;
    } catch {
      bannedAt = null;
    }
  }

  return { supabaseResponse, user, bannedAt };
}
