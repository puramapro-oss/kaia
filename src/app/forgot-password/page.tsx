import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="On reprend en douceur."
      subtitle="Tu reçois un lien pour définir un nouveau mot de passe."
      footer={
        <p>
          Tu te souviens finalement ?{" "}
          <Link
            href="/login"
            className="text-white hover:text-[var(--color-kaia-accent)] wellness-anim"
          >
            Reviens à la connexion.
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
