import { createBrowserClient } from "@supabase/ssr";

export const KAIA_SCHEMA = "kaia";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: KAIA_SCHEMA },
    }
  );
}
