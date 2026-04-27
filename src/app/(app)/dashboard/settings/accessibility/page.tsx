import { getTranslations } from "next-intl/server";
import { GlassCard } from "@/components/ui/Card";
import { AccessibilityTogglesClient } from "./AccessibilityTogglesClient";

export const metadata = { title: "Accessibilité" };

export default async function AccessibilityPage() {
  const t = await getTranslations("accessibility");
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
          {t("title")}
        </h1>
        <p className="text-white/60">{t("intro")}</p>
      </header>

      <AccessibilityTogglesClient />

      <GlassCard className="text-sm text-white/55 leading-relaxed">
        <p>
          <strong className="text-white/80">{t("screenReaderTip")}</strong>
        </p>
        <p className="mt-2">
          KAÏA respecte aussi <code className="text-white/70">prefers-reduced-motion</code>,
          <code className="text-white/70 ml-1">prefers-color-scheme</code> et la navigation
          au clavier (touche Tab + Entrée + Esc partout).
        </p>
      </GlassCard>
    </div>
  );
}
