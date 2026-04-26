import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = { title: "Créer un compte" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Bienvenue chez toi."
      subtitle="14 jours gratuits, sans carte. Annule en un clic."
      footer={
        <p>
          Déjà un compte ?{" "}
          <Link href="/login" className="text-white hover:text-[var(--color-kaia-accent)] wellness-anim">
            Connecte-toi.
          </Link>
        </p>
      }
    >
      <Suspense fallback={<div className="h-72 animate-pulse bg-white/5 rounded-2xl" />}>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
