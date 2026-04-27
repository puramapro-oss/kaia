import { redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Boutique — KAÏA",
  description: "Audios, ebooks et programmes VIDA. 5 % cashback en tokens VIDA.",
};

export const dynamic = "force-dynamic";

interface ProductRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price_cents: number;
  kind: "digital" | "physical";
  metadata: { cover_emoji?: string; tags?: string[] } | null;
}

export default async function ShopPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/shop");

  // Liste products via service role (RLS public_read mais robuste si user pas auth direct)
  const admin = createServiceClient();
  const { data: products } = await admin
    .from("products")
    .select("id, slug, title, description, price_cents, kind, metadata")
    .eq("active", true)
    .order("price_cents", { ascending: true });

  const list = (products ?? []) as ProductRow[];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingBag className="h-7 w-7 text-amber-300" />
          <h1 className="font-display text-3xl">Boutique VIDA</h1>
        </div>
        <p className="text-white/70 max-w-2xl">
          Audios, ebooks et programmes pour aller plus loin.{" "}
          <span className="text-amber-300">5 % cashback en tokens</span> à chaque achat,
          + 1 ticket concours / 100 tokens cashback.
        </p>
      </header>

      {list.length === 0 ? (
        <div className="text-center py-16 text-white/60">
          La boutique se prépare. Reviens dans quelques jours ✨
          <p className="mt-2 text-xs text-white/40">
            Admin : lance{" "}
            <code className="font-mono text-white/60">npm run seed:products</code>
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((p) => {
            const cashback = Math.floor((p.price_cents * 5) / 100);
            return (
              <Link
                key={p.id}
                href={`/shop/${p.slug}`}
                className="group rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 hover:border-amber-300/40 transition flex flex-col"
              >
                <div className="text-5xl mb-3" aria-hidden>
                  {p.metadata?.cover_emoji ?? "📦"}
                </div>
                <h2 className="font-display text-lg mb-2 group-hover:text-amber-200">
                  {p.title}
                </h2>
                <p className="text-sm text-white/70 line-clamp-2 mb-4 flex-1">
                  {p.description}
                </p>
                <div className="flex items-end justify-between">
                  <span className="font-display text-2xl text-amber-300">
                    {(p.price_cents / 100).toFixed(2).replace(".", ",")} €
                  </span>
                  <span className="text-xs text-white/60 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-300" />
                    +{cashback} tokens
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
