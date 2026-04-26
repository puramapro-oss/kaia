import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Bon retour."
      subtitle="Reprends ta routine là où tu l'as laissée."
      footer={
        <p>
          Pas encore de compte ?{" "}
          <Link href="/signup" className="text-white hover:text-[var(--color-kaia-accent)] wellness-anim">
            Crée le tien — c'est gratuit.
          </Link>
        </p>
      }
    >
      <Suspense fallback={<div className="h-48 animate-pulse bg-white/5 rounded-2xl" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
