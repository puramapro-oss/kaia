"use client";
import { useState, useTransition } from "react";
import { Users, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface PracticeGroupCard {
  id: string;
  slug: string;
  name: string;
  description: string;
  capacity: number;
  membersCount: number;
  meetUrl: string;
  scheduleHuman: string;
  isMember: boolean;
}

export function GroupCard({ group }: { group: PracticeGroupCard }) {
  const [isMember, setIsMember] = useState(group.isMember);
  const [members, setMembers] = useState(group.membersCount);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [meetUrl, setMeetUrl] = useState<string | null>(
    group.isMember ? group.meetUrl : null,
  );

  const full = members >= group.capacity && !isMember;

  const join = () => {
    if (full || isPending || isMember) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/community/groups/${group.id}/join`, {
          method: "POST",
        });
        if (res.status === 409) {
          setError("Ce groupe est complet.");
          return;
        }
        if (!res.ok) {
          setError("Inscription impossible.");
          return;
        }
        const data = (await res.json()) as { meetUrl: string };
        setIsMember(true);
        setMembers((c) => c + 1);
        setMeetUrl(data.meetUrl);
      } catch {
        setError("Connexion perdue.");
      }
    });
  };

  return (
    <article className="glass rounded-3xl p-6 space-y-4">
      <header className="space-y-1.5">
        <h3 className="font-display text-xl text-white">{group.name}</h3>
        <p className="text-[12px] text-[var(--color-kaia-accent)]/80 tracking-[0.12em] uppercase">
          {group.scheduleHuman}
        </p>
      </header>

      <p className="text-sm text-white/65 leading-relaxed">{group.description}</p>

      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[12px]",
            full ? "text-[var(--color-kaia-terracotta)]" : "text-white/55",
          )}
        >
          <Users className="h-3.5 w-3.5" strokeWidth={1.7} />
          {members} / {group.capacity} {full ? "complet" : "places"}
        </span>

        {isMember && meetUrl ? (
          <a
            href={meetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-white/85 hover:text-[var(--color-kaia-accent)] wellness-anim"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.7} />
            Rejoindre la salle
          </a>
        ) : isMember ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-[var(--color-kaia-green)]">
            <Check className="h-3.5 w-3.5" strokeWidth={2} />
            Inscrit·e
          </span>
        ) : (
          <Button size="sm" variant="outline" onClick={join} disabled={full} loading={isPending}>
            {full ? "Complet" : "Rejoindre"}
          </Button>
        )}
      </div>

      {error ? (
        <p role="alert" className="text-[12px] text-[var(--color-kaia-terracotta)]">
          {error}
        </p>
      ) : null}
    </article>
  );
}
