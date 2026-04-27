/**
 * CRON `/api/cron/weekly-newsletter`
 *  - Schedule (vercel.json) : `0 9 * * 0` (dimanche 09:00 UTC)
 *  - Génère + envoie la Living Newsletter de la semaine ISO courante
 *  - Idempotent par campaign_slug : si déjà envoyé à cet email cette campagne, skip
 *  - Batch de 50 emails / appel pour rester sous maxDuration
 */
import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/contests/cron-helpers";
import {
  buildLivingNewsletterHtml,
  pickWeeklyContent,
} from "@/lib/newsletter/template";
import { isoWeekSlug } from "@/lib/rituals/theme-rotation";

export const runtime = "nodejs";
export const maxDuration = 60;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://kaia.purama.dev";

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY manquante." },
      { status: 503 }
    );
  }

  const admin = createServiceClient();
  const week = isoWeekSlug(new Date());
  const campaignSlug = `weekly-${week}`;

  // Charge stats impact
  const { data: globalImpact } = await admin
    .from("global_impact")
    .select("active_users_30d, total_practices_completed, trees_planted")
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const activeUsers = (globalImpact?.active_users_30d as number) ?? 0;
  const treesPlanted = (globalImpact?.trees_planted as number) ?? 0;

  // Pratiques cette semaine
  const startOfWeek = new Date();
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - 7);
  const { count: practicesCount } = await admin
    .from("practice_sessions")
    .select("id", { count: "exact", head: true })
    .gte("completed_at", startOfWeek.toISOString());

  const { practice, quote } = pickWeeklyContent(week);

  // Récupère les abonnés non encore envoyés cette campagne
  const { data: alreadySent } = await admin
    .from("newsletter_sends")
    .select("email")
    .eq("campaign_slug", campaignSlug);
  const sentEmails = new Set((alreadySent ?? []).map((r) => r.email as string));

  const { data: subscribers } = await admin
    .from("newsletter_subscriptions")
    .select("email, locale, unsubscribe_token, user_id")
    .eq("status", "subscribed")
    .order("subscribed_at", { ascending: true })
    .limit(50);

  const todo = (subscribers ?? []).filter((s) => !sentEmails.has(s.email as string));
  if (todo.length === 0) {
    return NextResponse.json({ ok: true, campaignSlug, sent: 0, message: "no_subscribers_pending" });
  }

  const resend = new Resend(apiKey);
  const from = process.env.KAIA_NEWSLETTER_FROM ?? "KAÏA Living <living@purama.dev>";

  let sent = 0;
  const errors: string[] = [];

  for (const s of todo) {
    try {
      // Récup nom
      let name = "toi";
      if (s.user_id) {
        const { data: profile } = await admin
          .from("profiles")
          .select("full_name")
          .eq("id", s.user_id as string)
          .maybeSingle();
        name = (profile?.full_name as string) ?? name;
      }

      const html = buildLivingNewsletterHtml({
        recipientName: name,
        recipientEmail: s.email as string,
        unsubscribeToken: s.unsubscribe_token as string,
        campaignSlug,
        impactStats: {
          activeUsers,
          practicesThisWeek: practicesCount ?? 0,
          treesPlanted,
        },
        microPracticeTitle: practice.title,
        microPracticeBody: practice.body,
        meditationQuote: quote.quote,
        meditationAuthor: quote.author,
        appUrl: APP_URL,
      });

      const result = await resend.emails.send({
        from,
        to: [s.email as string],
        subject: `Living · ${practice.title}`,
        html,
        headers: {
          "List-Unsubscribe": `<${APP_URL}/api/newsletter/unsubscribe?token=${encodeURIComponent(
            s.unsubscribe_token as string
          )}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });

      await admin.from("newsletter_sends").insert({
        campaign_slug: campaignSlug,
        email: s.email,
        locale: s.locale,
        resend_id: result.data?.id ?? null,
      });
      await admin
        .from("newsletter_subscriptions")
        .update({ last_sent_at: new Date().toISOString() })
        .eq("email", s.email as string);

      sent++;
    } catch (err) {
      errors.push(
        `${s.email}: ${err instanceof Error ? err.message : "unknown_error"}`
      );
    }
  }

  return NextResponse.json({
    ok: true,
    campaignSlug,
    sent,
    pending: Math.max(0, ((subscribers?.length ?? 0) - sent)),
    errors: errors.slice(0, 5),
  });
}
