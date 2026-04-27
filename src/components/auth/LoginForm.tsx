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

const LoginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    const formData = new FormData(event.currentTarget);
    const parsed = LoginSchema.safeParse({
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
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Connexion refusée", {
        description:
          error.message === "Invalid login credentials"
            ? "Email ou mot de passe incorrect."
            : error.message,
      });
      return;
    }

    toast.success("Bon retour parmi nous.");
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
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          required
          error={errors.email}
        />
        <Input
          name="password"
          type="password"
          label="Mot de passe"
          autoComplete="current-password"
          required
          error={errors.password}
        />
        <Button type="submit" loading={submitting} className="w-full">
          Me connecter
        </Button>
      </form>

      <div className="flex items-center justify-between text-xs text-white/50">
        <Link href="/forgot-password" className="hover:text-white wellness-anim">
          Mot de passe oublié ?
        </Link>
        <Link href="/signup" className="hover:text-white wellness-anim">
          Créer un compte
        </Link>
      </div>
    </div>
  );
}
