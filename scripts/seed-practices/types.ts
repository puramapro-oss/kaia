export type Category = "meditation" | "breathing" | "mantra" | "mudra" | "movement" | "learning" | "reprogramming";

export interface PracticeSeed {
  slug: string;
  category: Category;
  title: string;
  duration_seconds: number;
  intensity: "gentle" | "medium" | "strong";
  goal_tags: string[];
  contraindications: string[];
  steps: Array<{ order: number; text_fr: string; text_en: string; duration_seconds?: number }>;
  i18n: {
    title: { fr: string; en: string };
    description?: { fr: string; en: string };
  };
  premium_only: boolean;
}
