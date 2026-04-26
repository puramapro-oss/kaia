"use client";

import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

const Schema = z.object({ email: z.string().email("Email invalide") });

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    const formData = new FormData(event.currentTarget);
    const parsed = Schema.safeParse({ email: formData.get("email") });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
    });
    setSubmitting(false);
    if (authError) {
      toast.error("Envoi impossible", { description: authError.message });
      return;
    }
    setSent(true);
    toast.success("Email envoyé.", {
      description: "Vérifie ta boîte mail (et tes spams).",
    });
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-white/75">
          C'est parti. Tu vas recevoir un lien dans quelques instants.
        </p>
        <p className="text-xs text-white/45">
          Si rien n'arrive sous 5 minutes, vérifie tes spams ou réessaie.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Input
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        error={error}
      />
      <Button type="submit" loading={submitting} className="w-full">
        Envoyer le lien
      </Button>
    </form>
  );
}
