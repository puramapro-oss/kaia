import Link from "next/link";
import {
  PRACTICE_CATEGORIES,
  type PracticeCategory,
} from "@/lib/practices/categories";

export interface ContinuePractice {
  id: string;
  slug: string;
  title: string;
  durationSeconds: number;
  category: PracticeCategory;
}

interface ContinueCheminProps {
  practices: ContinuePractice[];
  buildHref?: (practice: ContinuePractice) => string;
}

export function ContinueChemin({ practices, buildHref }: ContinueCheminProps) {
  if (practices.length === 0) return null;

  return (
    <section aria-label="Continue ton chemin VIDA" className="space-y-3">
      <h2 className="font-display text-lg text-white/85 tracking-tight px-0.5">
        Continue ton chemin
      </h2>
      <div
        className="-mx-1 overflow-x-auto snap-x snap-mandatory scroll-pl-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="region"
        aria-label="Sélection de pratiques recommandées"
      >
        <div className="flex gap-3 px-1 pb-2">
          {practices.map((p) => {
            const spec = PRACTICE_CATEGORIES[p.category];
            const href = buildHref?.(p) ?? `/practices/${p.slug}`;
            const minutes = Math.round(p.durationSeconds / 60);
            return (
              <Link
                key={p.id}
                href={href}
                className="snap-start shrink-0 w-[200px] sm:w-[220px] rounded-3xl border border-white/10 p-4 bg-white/[0.025] hover:bg-white/[0.045] wellness-anim"
              >
                <div
                  className="h-10 w-10 rounded-2xl flex items-center justify-center font-display"
                  style={{ background: `${spec.accent}22`, color: spec.accent }}
                  aria-hidden
                >
                  {spec.labelFr.charAt(0)}
                </div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 mt-3">
                  {spec.labelFr}
                </p>
                <p className="font-display text-base text-white/90 mt-1 line-clamp-2 min-h-[2.5em]">
                  {p.title}
                </p>
                <p className="text-xs text-white/45 mt-2">
                  {minutes < 1 ? `${p.durationSeconds}s` : `${minutes} min`}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
