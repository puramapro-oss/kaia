import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { computeShopRewards } from "@/lib/shop/cashback";
import { BuyButton } from "@/components/shop/BuyButton";

interface Props {
  params: Promise<{ productId: string }>;
}

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

export default async function ShopDetailPage({ params }: Props) {
  const { productId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/shop/${productId}`);

  const admin = createServiceClient();
  const { data: product } = await admin
    .from("products")
    .select("*")
    .eq("slug", productId)
    .maybeSingle<ProductRow>();
  if (!product) notFound();

  const { cashbackTokens, ticketsEarned } = computeShopRewards(product.price_cents);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/shop" className="text-sm text-white/60 hover:text-white">
        ← Boutique
      </Link>

      <article className="mt-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] p-6 sm:p-8">
        <div className="text-7xl mb-4" aria-hidden>
          {product.metadata?.cover_emoji ?? "📦"}
        </div>
        <h1 className="font-display text-3xl mb-2">{product.title}</h1>
        <p className="text-white/75 mb-6 leading-relaxed whitespace-pre-line">
          {product.description}
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl bg-black/20 px-4 py-3">
            <div className="text-xs text-white/60 mb-1">Prix</div>
            <div className="font-display text-2xl text-amber-300">
              {(product.price_cents / 100).toFixed(2).replace(".", ",")} €
            </div>
          </div>
          <div className="rounded-xl bg-black/20 px-4 py-3">
            <div className="text-xs text-white/60 mb-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-300" />
              Cashback
            </div>
            <div className="font-display text-2xl">
              +{cashbackTokens} tokens
              {ticketsEarned > 0 && (
                <span className="text-sm text-white/60 ml-2">
                  · {ticketsEarned} ticket{ticketsEarned > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        <BuyButton productId={product.id} priceLabel={`${(product.price_cents / 100).toFixed(2).replace(".", ",")} €`} />

        <p className="mt-4 text-xs text-white/50">
          Paiement sécurisé Stripe · Téléchargement immédiat (digital) · Cashback crédité
          dans la minute après confirmation Stripe.
        </p>
      </article>
    </div>
  );
}
