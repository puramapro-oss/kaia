import { VITAE_PLANS } from "@/lib/stripe";
export const dynamic = "force-dynamic";

export default function AdminPricingPage() {
  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl">Pricing VITAE</h1>
      <p className="text-white/60 text-sm">
        Pour modifier les prix, relancer <code>/api/setup/stripe</code> après avoir mis à jour les montants dans <code>lib/stripe.ts</code> et déployé.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {VITAE_PLANS.map((plan) => (
          <div
            key={plan.key}
            className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3"
          >
            <div className="text-xs uppercase tracking-widest text-white/40">{plan.key}</div>
            <div className="text-3xl font-bold">{plan.priceLabel}<span className="text-sm font-normal text-white/50">/mois</span></div>
            <div className="text-sm text-white/60">{plan.description}</div>
            <div className="text-xs text-white/40">
              Annuel : {(plan.priceCents * 12 * 0.7 / 100).toFixed(2).replace(".", ",")} €/an (−30%)
            </div>
            <div className="text-xs text-white/40">
              Essai : {plan.trialDays}j gratuits
            </div>
            <div className="text-xs font-mono text-white/30 truncate">
              Price ID: {plan.envPriceId || "non configuré"}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-300">
        Pour activer un nouveau tarif : modifie les prix dans <code>lib/stripe.ts</code> → deploy → appelle <code>POST /api/setup/stripe</code> avec le Bearer token admin pour créer les nouveaux Price IDs Stripe et mettre à jour les env vars.
      </div>
    </div>
  );
}
