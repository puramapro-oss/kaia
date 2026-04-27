"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GoogleButton } from "./GoogleButton";
import { AppleButton } from "./AppleButton";
import { createClient } from "@/lib/supabase/client";

const SignupSchema = z.object({
  fullName: z.string().min(2, "Indique au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
});

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";

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
        <Button type="submit" loading={submitting} className="w-full">
          Créer mon espace
        </Button>
      </form>

      <p className="text-xs text-white/45 text-center leading-relaxed">
        En continuant, tu acceptes nos{" "}
        <Link href="/legal/cgu" className="text-white/65 underline-offset-4 hover:underline">CGU</Link>{" "}
        et notre{" "}
        <Link href="/legal/privacy" className="text-white/65 underline-offset-4 hover:underline">
          politique de confidentialité
        </Link>
        .
      </p>
    </div>
  );
}
