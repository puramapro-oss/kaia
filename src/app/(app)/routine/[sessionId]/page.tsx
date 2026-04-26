import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionPlayer } from "@/components/routine/SessionPlayer";
import {
  isValidCategory,
  type PracticeCategory,
} from "@/lib/practices/categories";

export const metadata = {
  title: "Session — KAÏA",
};

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

interface RawStep {
  order?: unknown;
  text_fr?: unknown;
  text_en?: unknown;
  duration_seconds?: unknown;
}

const LOCALE_TO_BCP47: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
  ar: "ar-SA",
  zh: "zh-CN",
};

export default async function SessionPage({ params }: PageProps) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/routine/${sessionId}`);

  // Charge la session + la pratique associée + le profil pour audio mode.
  const [{ data: session }, { data: profile }] = await Promise.all([
    supabase
      .from("practice_sessions")
      .select("id, user_id, practice_id, routine_id, status")
      .eq("id", sessionId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("multisensorial_binaural, preferred_locale")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (!session || session.user_id !== user.id) {
    redirect("/home?error=session_not_found");
  }

  if (!session.practice_id) {
    redirect("/home?error=no_practice");
  }

  const { data: practice } = await supabase
    .from("practices")
    .select("id, slug, title, category, duration_seconds, steps, i18n")
    .eq("id", session.practice_id)
    .maybeSingle();

  if (!practice) redirect("/home?error=practice_not_found");
  const category: PracticeCategory = isValidCategory(practice.category)
    ? practice.category
    : "meditation";

  const rawSteps = Array.isArray(practice.steps) ? (practice.steps as RawStep[]) : [];
  const steps = rawSteps
    .map((s, i) => ({
      order: typeof s.order === "number" ? s.order : i,
      text_fr: typeof s.text_fr === "string" ? s.text_fr : "",
      text_en: typeof s.text_en === "string" ? s.text_en : undefined,
      duration_seconds: typeof s.duration_seconds === "number" ? s.duration_seconds : undefined,
    }))
    .filter((s) => s.text_fr.length > 0)
    .sort((a, b) => a.order - b.order);

  // Détermine si c'est la dernière pratique de la routine du jour.
  let isLastInRoutine = false;
  if (session.routine_id) {
    const { data: routine } = await supabase
      .from("daily_routines")
      .select("practices")
      .eq("id", session.routine_id)
      .maybeSingle();
    if (routine && Array.isArray(routine.practices)) {
      const list = routine.practices as Array<{ practice_id?: string; slug?: string }>;
      const lastEntry = list[list.length - 1];
      isLastInRoutine =
        Boolean(lastEntry) &&
        (lastEntry.practice_id === practice.id || lastEntry.slug === practice.slug);
    }
  } else {
    isLastInRoutine = true;
  }

  const audioMode: "silence" | "nature" | "binaural" | "voice" = profile?.multisensorial_binaural
    ? "binaural"
    : "voice"; // valeur par défaut tant qu'on n'a pas de col dédiée audio_mode dans profiles
  const speechLocale = LOCALE_TO_BCP47[profile?.preferred_locale ?? "fr"] ?? "fr-FR";

  return (
    <SessionPlayer
      sessionId={session.id}
      practice={{
        slug: practice.slug,
        title: practice.title,
        category,
        durationSeconds: practice.duration_seconds,
        steps,
      }}
      routineId={session.routine_id}
      audioMode={audioMode}
      isLastInRoutine={isLastInRoutine}
      speechLocale={speechLocale}
    />
  );
}
