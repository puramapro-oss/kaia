/**
 * Reçu fiscal de don — Asso PURAMA habilitée art. 200 CGI (66 % défiscalisation).
 * Envoi via Resend depuis le webhook Stripe `checkout.session.completed` (mode=payment + metadata.donation_id).
 *
 * Le HTML est inline (pas de React Email pour Phase 1, on évitera la dep) et
 * imprimable directement par le donneur.
 */
import { Resend } from "resend";

interface ReceiptInput {
  donorEmail: string;
  donorName: string;
  amountCents: number;
  causeTitle: string;
  causeSlug: string;
  donationId: string;
  receiptNumber: string;
  paidAt: Date;
}

const ASSO_NAME = "Association PURAMA";
const ASSO_ADDRESS = "8 Rue de la Chapelle, 25560 Frasne, France";
const ASSO_RNA = "W251006120";
const ASSO_FISCAL_NOTE =
  "Conformément à l'art. 200 du CGI, votre don ouvre droit à une réduction d'impôt sur le revenu de 66 % (dans la limite de 20 % du revenu imposable).";
const SUPPORT_EMAIL = "contact@purama.dev";

function eur(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export function buildReceiptHtml(input: ReceiptInput): string {
  const taxCredit = Math.round(input.amountCents * 0.66);
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Reçu fiscal — KAÏA</title></head>
<body style="font-family: -apple-system, system-ui, sans-serif; background:#0A0A0F; color:#FFFEF7; padding:32px;">
  <div style="max-width:600px;margin:0 auto;background:#15151F;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.08);">
    <h1 style="font-size:22px;margin:0 0 8px;color:#F4C430;">Reçu de don n° ${input.receiptNumber}</h1>
    <p style="margin:0 0 20px;color:rgba(255,254,247,0.7);font-size:14px;">
      Émis le ${input.paidAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
    </p>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
      <tr><td style="padding:8px 0;color:rgba(255,254,247,0.6);">Donateur·rice</td><td style="text-align:right;">${input.donorName} (${input.donorEmail})</td></tr>
      <tr><td style="padding:8px 0;color:rgba(255,254,247,0.6);">Montant</td><td style="text-align:right;font-weight:600;color:#F4C430;">${eur(input.amountCents)}</td></tr>
      <tr><td style="padding:8px 0;color:rgba(255,254,247,0.6);">Cause</td><td style="text-align:right;">${input.causeTitle}</td></tr>
      <tr><td style="padding:8px 0;color:rgba(255,254,247,0.6);">Réduction d'impôt estimée</td><td style="text-align:right;">${eur(taxCredit)} (66 %)</td></tr>
      <tr><td style="padding:8px 0;color:rgba(255,254,247,0.6);">Bénéficiaire</td><td style="text-align:right;">${ASSO_NAME}</td></tr>
      <tr><td style="padding:8px 0;color:rgba(255,254,247,0.6);">Adresse</td><td style="text-align:right;">${ASSO_ADDRESS}</td></tr>
      <tr><td style="padding:8px 0;color:rgba(255,254,247,0.6);">RNA</td><td style="text-align:right;font-family:monospace;">${ASSO_RNA}</td></tr>
      <tr><td style="padding:8px 0;color:rgba(255,254,247,0.6);">Référence interne</td><td style="text-align:right;font-family:monospace;font-size:12px;">${input.donationId.slice(0, 8)}…</td></tr>
    </table>

    <p style="font-size:12px;line-height:1.6;color:rgba(255,254,247,0.6);margin:16px 0;">
      ${ASSO_FISCAL_NOTE}
    </p>

    <p style="font-size:12px;color:rgba(255,254,247,0.6);">
      Merci pour ton don 💜<br>
      Une question ? <a href="mailto:${SUPPORT_EMAIL}" style="color:#06B6D4;">${SUPPORT_EMAIL}</a>
    </p>
  </div>
  <p style="text-align:center;font-size:11px;color:rgba(255,254,247,0.4);margin-top:24px;">
    KAÏA · ${ASSO_NAME} · Conserve ce mail pour ta déclaration.
  </p>
</body></html>`;
}

export async function sendDonationReceipt(input: ReceiptInput): Promise<{
  sent: boolean;
  reason?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "no_resend_key" };
  try {
    const resend = new Resend(apiKey);
    const html = buildReceiptHtml(input);
    const from =
      process.env.KAIA_RECEIPT_FROM ?? "KAÏA — Reçu fiscal <recus@purama.dev>";
    await resend.emails.send({
      from,
      to: [input.donorEmail],
      subject: `Reçu fiscal — Don de ${eur(input.amountCents)} (n° ${input.receiptNumber})`,
      html,
    });
    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      reason: err instanceof Error ? err.message : "unknown_resend_error",
    };
  }
}

export function nextReceiptNumber(): string {
  // Format : DK-YYYY-XXXXXX (D=Donation, K=KAÏA, 6 chars hex)
  const year = new Date().getUTCFullYear();
  const rand = Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 16).toString(16).toUpperCase()
  ).join("");
  return `DK-${year}-${rand}`;
}
