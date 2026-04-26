import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidCategory, type PracticeCategory } from "@/lib/practices/categories";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ routineId?: string; practiceId?: string }>;
}

interface RoutineEntry {
  practice_id: string | null;
  slug: string;
  title: string;
  category: PracticeCategory;
  duration_seconds: number;
  why?: string;
}

/**
 * Ouvre la session live pour la routine du jour.
 * - `?routineId=` lance la 1ère pratique non encore complétée.
 * - `?practiceId=` (sans routine) lance une pratique en standalone.
 *
 * Insère une `practice_sessions` row puis redirect `/routine/[sessionId]`.
 */
export default async function StartRoutinePage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/home");

  const params = await searchParams;
  const routineId = params.routineId?.trim() || null;
  const practiceIdParam = params.practiceId?.trim() || null;

  let practiceId: string | null = null;
  let validatedRoutineId: string | null = null;

  if (routineId) {
    const { data: routine } = await supabase
      .from("daily_routines")
      .select("id, practices")
      .eq("id", routineId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!routine) redirect("/home?error=routine_not_found");
    validatedRoutineId = routine.id;

    const list = Array.isArray(routine.practices) ? (routine.practices as unknown[]) : [];
    const entries = list
      .map((p): RoutineEntry | null => {
        if (typeof p !== "object" || p === null) return null;
        const obj = p as Record<string, unknown>;
        const cat = obj.category;
        if (typeof cat !== "string" || !isValidCategory(cat)) return null;
        const id = typeof obj.practice_id === "string" ? obj.practice_id : null;
        const slug = typeof obj.slug === "string" ? obj.slug : "";
        const title = typeof obj.title === "string" ? obj.title : "Pratique";
        const dur = typeof obj.duration_seconds === "number" ? obj.duration_seconds : 60;
        if (!slug) return null;
        return {
          practice_id: id,
          slug,
          title,
          category: cat,
          duration_seconds: dur,
        };
      })
      .filter((e): e is RoutineEntry => Boolean(e));

    // Trouver la 1ère pratique sans session completed pour cette routine.
    const { data: doneSessions } = await supabase
      .from("practice_sessions")
      .select("practice_id")
      .eq("routine_id", routine.id)
      .eq("user_id", user.id)
      .eq("status", "completed");
    const doneIds = new Set((doneSessions ?? []).map((s) => s.practice_id).filter(Boolean));

    const next = entries.find((e) => !doneIds.has(e.practice_id ?? ""));
    if (!next) redirect("/home?routine=done");
    practiceId = next.practice_id;
    if (!practiceId) {
      // Pratique IA sans match catalogue : fallback — chercher par slug.
      const { data: matched } = await supabase
        .from("practices")
        .select("id")
        .eq("slug", next.slug)
        .maybeSingle();
      practiceId = matched?.id ?? null;
    }
  } else if (practiceIdParam) {
    practiceId = practiceIdParam;
  }

  if (!practiceId) redirect("/home?error=no_practice");

  // Vérifier la pratique existe + active.
  const { data: practice } = await supabase
    .from("practices")
    .select("id, active, premium_only")
    .eq("id", practiceId)
    .maybeSingle();
  if (!practice || !practice.active) redirect("/home?error=practice_unavailable");

  if (practice.premium_only) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.plan !== "active") redirect("/pricing?reason=premium_practice");
  }

  // Insertion session.
  const { data: session, error } = await supabase
    .from("practice_sessions")
    .insert({
      user_id: user.id,
      practice_id: practice.id,
      routine_id: validatedRoutineId,
      status: "started",
    })
    .select("id")
    .single();

  if (error || !session) redirect("/home?error=session_failed");
  redirect(`/routine/${session.id}`);
}
