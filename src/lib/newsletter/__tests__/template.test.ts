import { describe, it, expect } from "vitest";
import { buildLivingNewsletterHtml, pickWeeklyContent } from "../template";

describe("buildLivingNewsletterHtml", () => {
  it("génère du HTML avec impact stats + practice + quote", () => {
    const html = buildLivingNewsletterHtml({
      recipientName: "Tissma",
      recipientEmail: "test@example.com",
      unsubscribeToken: "TOKEN",
      campaignSlug: "weekly-2026-W18",
      impactStats: { activeUsers: 100, practicesThisWeek: 250, treesPlanted: 42 },
      microPracticeTitle: "Pratique test",
      microPracticeBody: "Body test",
      meditationQuote: "Citation test",
      meditationAuthor: "Auteur",
      appUrl: "https://kaia.purama.dev",
    });
    expect(html).toContain("Tissma");
    expect(html).toContain("100");
    expect(html).toContain("Pratique test");
    expect(html).toContain("Citation test");
    expect(html).toContain("/api/newsletter/unsubscribe?token=TOKEN");
  });

  it("escape HTML dans le nom destinataire", () => {
    const html = buildLivingNewsletterHtml({
      recipientName: "<script>",
      recipientEmail: "x@x.io",
      unsubscribeToken: "T",
      campaignSlug: "c",
      impactStats: { activeUsers: 0, practicesThisWeek: 0, treesPlanted: 0 },
      microPracticeTitle: "T",
      microPracticeBody: "B",
      meditationQuote: "Q",
      appUrl: "https://kaia.purama.dev",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("pickWeeklyContent", () => {
  it("déterministe (même semaine → même contenu)", () => {
    const a = pickWeeklyContent("2026-W18");
    const b = pickWeeklyContent("2026-W18");
    expect(a.practice.title).toBe(b.practice.title);
    expect(a.quote.quote).toBe(b.quote.quote);
  });

  it("change de contenu d'une semaine à l'autre (pas garanti mais probable)", () => {
    const a = pickWeeklyContent("2026-W01");
    const b = pickWeeklyContent("2026-W02");
    // soit la pratique soit la quote diffère
    const same = a.practice.title === b.practice.title && a.quote.quote === b.quote.quote;
    expect(same).toBe(false);
  });
});
