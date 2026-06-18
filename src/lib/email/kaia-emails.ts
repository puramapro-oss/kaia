/**
 * Emails lifecycle KAÏA — Resend, HTML inline (pas de dep React Email).
 * Mêmes conventions que `donation-receipt.ts` :
 *   - `sendX()` renvoie { sent, reason } ; no-op gracieux si RESEND_API_KEY absent.
 *   - JAMAIS de promesse médicale, ton doux et féminin, identité LUNA préservée.
 * Conformité RGPD : header `List-Unsubscribe` + lien de désinscription 1-clic.
 */
import { Resend } from "resend";
import type { CyclePhase } from "@/lib/cycle/phases";
import { getPhaseMantra } from "@/lib/cycle/life-guide";

const FROM = process.env.RESEND_FROM_EMAIL ?? "KAÏA <hello@kaia.purama.dev>";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://kaia.purama.dev").replace(/\/$/, "");
const SUPPORT_EMAIL = "support@kaia.purama.dev";

const MOON = "#C8B9F0";
const GOLD = "#F4C430";

/** Marqueur d'opt-out marketing dans `notification_prefs.opted_out` (source unique). */
export const EMAIL_OPT_OUT_MARKER = "email_marketing";

export type KaiaEmailKind =
  | "welcome"
  | "first_cycle_guide"
  | "aurora_invitation"
  | "prime_j1"
  | "weekly_recap"
  | "reactivation_j14"
  | "reactivation_j30";

interface SendResult {
  sent: boolean;
  reason?: string;
}

/** Lien de désinscription 1-clic conforme RGPD (token = secret côté serveur). */
export function unsubscribeUrl(token: string): string {
  return `${APP_URL}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
}

function shell(title: string, bodyHtml: string, unsubUrl: string): string {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;font-family:-apple-system,system-ui,'Segoe UI',sans-serif;background:#0A0A0F;color:#F5F5FA;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#14141C;border-radius:24px;padding:32px;border:1px solid rgba(255,255,255,0.06);">
    <div style="font-size:13px;letter-spacing:2px;color:${MOON};text-transform:uppercase;margin-bottom:24px;">🌙 KAÏA</div>
    ${bodyHtml}
  </div>
  <p style="max-width:560px;margin:16px auto 0;text-align:center;font-size:11px;line-height:1.6;color:rgba(245,245,250,0.4);">
    Tu reçois cet email parce que tu fais partie de KAÏA.<br>
    <a href="${unsubUrl}" style="color:rgba(245,245,250,0.5);">Me désinscrire</a> ·
    <a href="mailto:${SUPPORT_EMAIL}" style="color:rgba(245,245,250,0.5);">${SUPPORT_EMAIL}</a>
  </p>
</body></html>`;
}

function ctaButton(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:8px;padding:13px 26px;border-radius:9999px;background:linear-gradient(135deg,${MOON} 0%,${GOLD} 100%);color:#0A0A0F;font-weight:600;text-decoration:none;font-size:14px;">${label}</a>`;
}

function h1(text: string): string {
  return `<h1 style="font-size:24px;margin:0 0 14px;color:#F5F5FA;">${text}</h1>`;
}

function p(text: string): string {
  return `<p style="font-size:15px;line-height:1.7;color:rgba(245,245,250,0.78);margin:0 0 16px;">${text}</p>`;
}

interface KaiaEmailContent {
  subject: string;
  html: string;
}

/** Construit sujet + HTML d'un email lifecycle (pur, testable). */
export function buildKaiaEmail(
  kind: KaiaEmailKind,
  opts: {
    firstName?: string;
    unsubToken: string;
    phase?: CyclePhase;
    primeEur?: number;
  }
): KaiaEmailContent {
  const name = opts.firstName?.trim() || "toi";
  const unsub = unsubscribeUrl(opts.unsubToken);

  switch (kind) {
    case "welcome":
      return {
        subject: "Bienvenue dans KAÏA 🌙",
        html: shell(
          "Bienvenue dans KAÏA",
          h1(`Bienvenue, ${name}`) +
            p("Je suis LUNA, l'intelligence de KAÏA. Je t'accompagnerai au fil de ton cycle, à ton rythme, sans jamais te juger.") +
            p("Pour commencer, renseigne ton cycle : je pourrai alors adapter chaque jour mes conseils à ta phase.") +
            ctaButton("Commencer mon cycle", `${APP_URL}/cycle`),
          unsub
        ),
      };

    case "first_cycle_guide":
      return {
        subject: "Ton premier cycle avec KAÏA",
        html: shell(
          "Ton premier cycle avec KAÏA",
          h1("Comprendre tes 4 phases") +
            p(`${name}, ton cycle se vit en quatre saisons intérieures : menstruation, folliculaire, ovulation, lutéale. Chacune a son énergie, ses besoins, ses forces.`) +
            p("Le Guide de Vie Cyclique te montre, jour après jour, comment t'aligner sur la phase que tu traverses.") +
            ctaButton("Ouvrir mon guide", `${APP_URL}/cycle/guide`),
          unsub
        ),
      };

    case "aurora_invitation":
      return {
        subject: "AURORA t'attend — respire avec moi",
        html: shell(
          "AURORA t'attend",
          h1("Une respiration pour te recentrer") +
            p(`${name}, quand le mental s'emballe ou que l'énergie baisse, AURORA t'offre une respiration guidée de quelques minutes.`) +
            p("C'est un rituel doux, à pratiquer dès que tu en ressens le besoin. Sans objectif de performance, juste un retour à toi.") +
            ctaButton("Essayer AURORA", `${APP_URL}/aurora`),
          unsub
        ),
      };

    case "prime_j1": {
      const amount = (opts.primeEur ?? 25).toString();
      return {
        subject: `Ta prime de bienvenue de ${amount}€ est créditée 🎁`,
        html: shell(
          "Ta prime de bienvenue",
          h1(`+${amount}€ dans ton portefeuille`) +
            p(`Merci d'avoir rejoint KAÏA, ${name}. Ta prime de bienvenue de ${amount}€ vient d'être créditée dans ton portefeuille.`) +
            p("Elle devient retirable après 30 jours d'abonnement actif. D'ici là, elle grandit avec toi.") +
            ctaButton("Voir mon portefeuille", `${APP_URL}/moi/wallet`),
          unsub
        ),
      };
    }

    case "weekly_recap": {
      const mantra = opts.phase ? getPhaseMantra(opts.phase) : "Je m'accorde de la douceur cette semaine.";
      return {
        subject: "Ton récap de la semaine 🌗",
        html: shell(
          "Ton récap de la semaine",
          h1("Ta semaine, en douceur") +
            p(`${name}, voici ton intention pour les jours à venir :`) +
            `<p style="font-size:17px;line-height:1.6;color:${MOON};font-style:italic;margin:0 0 18px;">« ${mantra} »</p>` +
            p("Retrouve ton guide du jour et ton journal pour rester à l'écoute de ce qui se vit en toi.") +
            ctaButton("Voir mon cycle", `${APP_URL}/cycle`),
          unsub
        ),
      };
    }

    case "reactivation_j14":
      return {
        subject: "Ton cycle continue, KAÏA aussi 🌱",
        html: shell(
          "Ton cycle continue",
          h1("On reprend en douceur ?") +
            p(`${name}, ça fait quelques jours. Ton corps, lui, ne s'arrête pas : il traverse peut-être déjà une nouvelle phase.`) +
            p("Une minute suffit pour noter ton humeur du jour et recevoir un conseil adapté.") +
            ctaButton("Reprendre mon journal", `${APP_URL}/cycle/journal`),
          unsub
        ),
      };

    case "reactivation_j30":
      return {
        subject: "Ta place t'attend chez KAÏA 💜",
        html: shell(
          "Ta place t'attend",
          h1("Reviens quand tu le sens") +
            p(`${name}, KAÏA reste là, à ton rythme. Pas de pression, juste un espace doux qui t'attend quand tu en as besoin.`) +
            p("Tes données sont intactes et chiffrées. Tu reprends exactement où tu t'étais arrêtée.") +
            ctaButton("Revenir sur KAÏA", `${APP_URL}/cycle`),
          unsub
        ),
      };
  }
}

async function send(to: string, content: KaiaEmailContent, unsubToken: string): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "no_resend_key" };
  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: FROM,
      to: [to],
      subject: content.subject,
      html: content.html,
      headers: { "List-Unsubscribe": `<${unsubscribeUrl(unsubToken)}>` },
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : "unknown_resend_error" };
  }
}

export interface SendKaiaEmailArgs {
  to: string;
  kind: KaiaEmailKind;
  unsubToken: string;
  firstName?: string;
  phase?: CyclePhase;
  primeEur?: number;
}

/** Point d'entrée unique : construit puis envoie un email lifecycle. */
export async function sendKaiaEmail(args: SendKaiaEmailArgs): Promise<SendResult> {
  const content = buildKaiaEmail(args.kind, {
    firstName: args.firstName,
    unsubToken: args.unsubToken,
    phase: args.phase,
    primeEur: args.primeEur,
  });
  return send(args.to, content, args.unsubToken);
}
