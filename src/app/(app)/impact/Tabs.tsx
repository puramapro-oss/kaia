"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "personal", label: "Personnel" },
  { id: "collective", label: "Collectif" },
  { id: "map", label: "Carte" },
] as const;

export type ImpactTab = (typeof TABS)[number]["id"];

export function ImpactTabs({ active }: { active: ImpactTab }) {
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <nav
      role="tablist"
      aria-label="Onglets impact"
      className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.025] p-1"
    >
      {TABS.map((t) => {
        const isActive = active === t.id;
        const newParams = new URLSearchParams(params.toString());
        newParams.set("tab", t.id);
        return (
          <Link
            key={t.id}
            href={`${pathname}?${newParams.toString()}`}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "px-4 h-9 rounded-xl text-sm wellness-anim flex items-center",
              isActive
                ? "bg-white/10 text-white border border-white/15"
                : "text-white/55 hover:text-white border border-transparent",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
