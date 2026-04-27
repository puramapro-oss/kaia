/**
 * Template HTML « Living » — newsletter hebdo KAÏA.
 *
 * Structure :
 *  1. Ouverture chaleureuse (impact collectif chiffré)
 *  2. Action 2 minutes (micro-pratique de la semaine)
 *  3. Idée à méditer (citation ou question)
 *  4. Fermeture (bouton vers /home + lien désabo 1 clic)
 */
export interface LivingNewsletterData {
  recipientName: string;
  recipientEmail: string;
  unsubscribeToken: string;
  campaignSlug: string;
  impactStats: {
    activeUsers: number;
    practicesThisWeek: number;
    treesPlanted: number;
  };
  microPracticeTitle: string;
  microPracticeBody: string;
  meditationQuote: string;
  meditationAuthor?: string;
  appUrl: string;
}

const SUPPORT_EMAIL = "contact@purama.dev";

export function buildLivingNewsletterHtml(d: LivingNewsletterData): string {
  const unsubUrl = `${d.appUrl}/api/newsletter/unsubscribe?token=${encodeURIComponent(
    d.unsubscribeToken
  )}`;
  const trackingPixel = `${d.appUrl}/api/newsletter/track?c=${encodeURIComponent(d.campaignSlug)}&e=${encodeURIComponent(d.recipientEmail)}&t=open`;
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>KAÏA — Living Newsletter</title></head>
<body style="font-family:-apple-system,system-ui,sans-serif;background:#0A0A0F;color:#FFFEF7;padding:32px;margin:0;">
  <div style="max-width:560px;margin:0 auto;">
    <h1 style="font-size:14px;color:#F4C430;letter-spacing:2px;text-transform:uppercase;margin:0 0 24px;">KAÏA · Living</h1>

    <p style="font-size:18px;line-height:1.6;margin:0 0 24px;">
      Bonjour ${escapeHtml(d.recipientName)} 🌿
    </p>

    <div style="background:#15151F;border-radius:16px;padding:20px;margin-bottom:24px;border:1px solid rgba(255,255,255,0.08);">
      <p style="margin:0 0 8px;color:rgba(255,254,247,0.6);font-size:12px;text-transform:uppercase;letter-spacing:1px;">Impact collectif cette semaine</p>
      <ul style="margin:0;padding:0;list-style:none;font-size:15px;line-height:1.8;">
        <li>👥 <strong style="color:#F4C430;">${d.impactStats.activeUsers}</strong> personnes actives</li>
        <li>🧘 <strong style="color:#F4C430;">${d.impactStats.practicesThisWeek}</strong> pratiques terminées</li>
        <li>🌳 <strong style="color:#F4C430;">${d.impactStats.treesPlanted}</strong> arbres plantés cumulés</li>
      </ul>
    </div>

    <h2 style="font-size:18px;color:#F4C430;margin:0 0 8px;">⚡ Action 2 minutes</h2>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px;color:rgba(255,254,247,0.85);">
      <strong>${escapeHtml(d.microPracticeTitle)}</strong><br>
      ${escapeHtml(d.microPracticeBody)}
    </p>

    <h2 style="font-size:18px;color:#F4C430;margin:0 0 8px;">💭 Idée à méditer</h2>
    <blockquote style="font-style:italic;border-left:3px solid #06B6D4;padding-left:16px;margin:0 0 24px;font-size:16px;line-height:1.6;color:rgba(255,254,247,0.85);">
      « ${escapeHtml(d.meditationQuote)} »
      ${d.meditationAuthor ? `<br><span style="font-size:13px;color:rgba(255,254,247,0.5);">— ${escapeHtml(d.meditationAuthor)}</span>` : ""}
    </blockquote>

    <div style="text-align:center;margin:32px 0;">
      <a href="${d.appUrl}/home" style="display:inline-block;background:#F4C430;color:#0A0A0F;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:15px;">
        Continuer ma routine
      </a>
    </div>

    <p style="text-align:center;font-size:11px;color:rgba(255,254,247,0.4);margin:32px 0 8px;">
      Tu reçois cet email parce que tu t&apos;es inscrit·e à KAÏA Living.<br>
      <a href="${unsubUrl}" style="color:rgba(255,254,247,0.4);">Se désabonner en 1 clic</a> ·
      <a href="mailto:${SUPPORT_EMAIL}" style="color:rgba(255,254,247,0.4);">${SUPPORT_EMAIL}</a>
    </p>
    <img src="${trackingPixel}" alt="" width="1" height="1" style="display:block;width:1px;height:1px;border:0;">
  </div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const PRACTICES_OF_WEEK = [
  {
    title: "Cohérence cardiaque · 5 minutes",
    body: "Inspire 5 sec, expire 5 sec, pendant 5 minutes. Trois fois par jour pendant la semaine. Ton système nerveux te dira merci.",
  },
  {
    title: "Une marche silencieuse · 10 minutes",
    body: "Sans téléphone, sans audio. Juste tes pas, ta respiration, ce qui passe autour. Le silence n'est pas vide, il est plein.",
  },
  {
    title: "3 gratitudes au réveil",
    body: "Avant de toucher ton téléphone le matin, nomme 3 choses dont tu es reconnaissant·e. La dopamine du matin change tout.",
  },
  {
    title: "Respiration 4-7-8 avant de dormir",
    body: "Inspire 4 sec, retiens 7 sec, expire 8 sec. Trois cycles. Ton cerveau pense que c'est l'heure de dormir.",
  },
];

const QUOTES = [
  {
    quote:
      "Ce qui se trouve devant nous et ce qui se trouve derrière nous sont peu de chose comparés à ce qui se trouve en nous.",
    author: "Ralph Waldo Emerson",
  },
  {
    quote: "Le bonheur n'est pas une destination, c'est une façon de voyager.",
    author: "Margaret Lee Runbeck",
  },
  { quote: "Là où il y a une volonté, il y a un chemin.", author: "George Bernard Shaw" },
  {
    quote: "Le présent est le seul moment où nous sommes véritablement vivants.",
    author: "Thich Nhat Hanh",
  },
];

export function pickWeeklyContent(weekIso: string): {
  practice: { title: string; body: string };
  quote: { quote: string; author: string };
} {
  // Hash déterministe weekIso → index
  const hash = weekIso.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    practice: PRACTICES_OF_WEEK[hash % PRACTICES_OF_WEEK.length],
    quote: QUOTES[(hash * 7) % QUOTES.length],
  };
}
