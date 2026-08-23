"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GoogleButton } from "./GoogleButton";
import { AppleButton } from "./AppleButton";
import { createClient } from "@/lib/supabase/client";
import LegalAcceptanceNotice from "@/lib/legal/components/LegalAcceptanceNotice";

const SignupSchema = z.object({
  fullName: z.string().min(2, "Indique au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
});

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/accueil";

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    const formData = new FormData(event.currentTarget);
    const parsed = SignupSchema.safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0]?.toString();
        if (k) fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setSubmitting(false);

    if (error) {
      toast.error("Inscription impossible", { description: error.message });
      return;
    }

    // Preuve d'acceptation CGU/CGV/politique — best-effort, ne bloque jamais l'inscription.
    // No-op silencieux si la session n'est pas encore active (confirmation email en attente) :
    // LegalReacceptanceGate reste la garde-fou lors de la 1ère connexion effective.
    for (const docType of ["cgu", "cgv", "confidentialite"] as const) {
      fetch("/api/legal/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType }),
      }).catch(() => {});
    }

    toast.success("Bienvenue chez toi.", {
      description: "Vérifie ta boîte mail si demandé. Sinon, on te conduit au dashboard.",
    });
    router.push(next);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2.5">
        <GoogleButton next={next} />
        <AppleButton next={next} />
      </div>
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] uppercase tracking-widest text-white/35">ou par email</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          name="fullName"
          label="Comment veux-tu être appelé·e ?"
          placeholder="Sarah, Mehdi, Léa…"
          autoComplete="name"
          required
          error={errors.fullName}
        />
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="toi@exemple.com"
          autoComplete="email"
          required
          error={errors.email}
        />
        <Input
          name="password"
          type="password"
          label="Mot de passe"
          autoComplete="new-password"
          minLength={8}
          required
          hint="8 caractères minimum"
          error={errors.password}
        />
        <div className="text-center [&_a]:text-white/65">
          <LegalAcceptanceNotice
            actionLabel="Créer mon espace"
            cguHref="/cgu"
            cgvHref="/cgv"
            confidentialiteHref="/politique-confidentialite"
          />
        </div>
        <Button type="submit" loading={submitting} className="w-full">
          Créer mon espace
        </Button>
      </form>
    </div>
  );
}
