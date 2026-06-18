import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] mb-6 hover:text-[var(--foreground)] transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Retour</span>
    </Link>
  );
}
