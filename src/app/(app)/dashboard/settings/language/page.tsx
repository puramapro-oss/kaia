import { getTranslations } from "next-intl/server";
import { GlassCard } from "@/components/ui/Card";
import { LanguagePickerClient } from "./LanguagePickerClient";
import { getCurrentLocale } from "@/i18n/get-locale";
import { setLocaleAction } from "./actions";

export const metadata = { title: "Langue" };

export default async function LanguagePage() {
  const t = await getTranslations("language");
  const current = await getCurrentLocale();
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-tight">
          {t("title")}
        </h1>
        <p className="text-white/60">{t("intro")}</p>
      </header>

      <LanguagePickerClient
        currentLocale={current}
        action={setLocaleAction}
        labels={{
          search: t("search"),
          current: t("current"),
          saved: t("saved"),
          rtlNote: t("rtlNote"),
        }}
      />

      <GlassCard className="text-sm text-white/55 leading-relaxed">
        <p className="text-white/80 font-medium">L&apos;écriture droite-à-gauche est gérée automatiquement.</p>
        <p className="mt-2">
          Les voix guidées sont disponibles dans 16 langues principales (essai 14 jours).
          Le contenu communautaire (posts, commentaires) reste dans la langue de l&apos;auteur.
        </p>
      </GlassCard>
    </div>
  );
}
