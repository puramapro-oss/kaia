import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BackButton from "@/components/ui/BackButton";
import ARFlowClient from "./ARFlowClient";
import type { ARTargetType } from "@/lib/ar/protocols";

export const metadata: Metadata = { title: "Session AR — KAÏA" };

const TARGETS: ARTargetType[] = ["soi", "personne", "animal", "collectif"];

export default async function ARStylePage({
  params,
  searchParams,
}: {
  params: Promise<{ style: string }>;
  searchParams: Promise<{ protocol?: string; target?: string }>;
}) {
  const { style } = await params;
  const { protocol, target } = await searchParams;

  if (style !== "A" && style !== "B") notFound();
  if (!protocol) notFound();
  const targetType = (TARGETS.includes(target as ARTargetType) ? target : "soi") as ARTargetType;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const enabled = process.env.ENABLE_AR === "true";

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto pb-28">
      <BackButton href="/ar" />
      <ARFlowClient
        userId={user.id}
        style={style}
        protocolSlug={protocol}
        targetType={targetType}
        enabled={enabled}
      />
    </div>
  );
}
