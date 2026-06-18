// 2-pass safety filter: local blocklist + haiku classifier

// FR + EN medical prescription terms that LUNA must never output
const MEDICAL_BLOCKLIST_FR = [
  "prescris", "prescrivez", "ordonnance", "médicament recommandé",
  "prends ce médicament", "posologie", "dosage recommandé", "milligrammes par jour",
  "antibiotique", "antidépresseur", "anxiolytique", "contraceptif oral",
  "arrête ton traitement", "stop ta pilule", "remplace ton médecin",
  "diagnostic confirmé", "tu as le SOPK", "tu as l'endométriose", "tu es enceinte",
  "résultats d'analyse", "ta prise de sang", "ton IRM", "résultats médicaux",
  "urgence médicale", "va aux urgences immédiatement",
];

const MEDICAL_BLOCKLIST_EN = [
  "prescribe", "prescription", "take this medication", "dosage",
  "milligrams per day", "antibiotic", "antidepressant", "anxiolytic",
  "stop your treatment", "replace your doctor", "confirmed diagnosis",
  "you have PCOS", "you have endometriosis", "you are pregnant",
  "blood test results", "MRI results", "go to the emergency room immediately",
];

export function passLocalFilter(text: string): boolean {
  const lower = text.toLowerCase();
  for (const term of [...MEDICAL_BLOCKLIST_FR, ...MEDICAL_BLOCKLIST_EN]) {
    if (lower.includes(term.toLowerCase())) {
      return false;
    }
  }
  return true;
}

export function getCrisisResponse(): string {
  return `Je t'entends, et je suis là avec toi. 💙
Ce que tu traverses mérite une vraie présence humaine.
En France, le **3114** (numéro national de prévention du suicide) est disponible 24h/24, 7j/7 — des personnes formées t'attendent.
Si tu es en danger immédiat, compose le **15** (SAMU) ou le **112**.

Je reste avec toi.`;
}

const CRISIS_KEYWORDS = [
  "me tuer", "mourir", "suicid", "en finir", "plus envie de vivre",
  "automutil", "me faire du mal", "kill myself", "want to die", "end my life",
];

export function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

// 2nd pass: haiku classifier (only called when local filter passes but uncertain)
export async function classifyWithHaiku(
  text: string,
  anthropicKey: string
): Promise<{ safe: boolean; reason?: string }> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        system:
          "You are a safety classifier. Reply ONLY with JSON: {\"safe\": true|false, \"reason\": \"string\"}. " +
          "Mark unsafe if the text: prescribes medication, gives a medical diagnosis, encourages stopping medical treatment, " +
          "or makes guarantees about healing outcomes.",
        messages: [{ role: "user", content: `Classify this AI response: "${text.slice(0, 800)}"` }],
      }),
    });
    if (!res.ok) return { safe: true };
    const data = await res.json();
    const content = data.content?.[0]?.text ?? "{}";
    const parsed = JSON.parse(content) as { safe: boolean; reason?: string };
    return parsed;
  } catch {
    return { safe: true };
  }
}

export function getSafetyDisclaimer(): string {
  return "KAÏA n'est pas un outil médical. Les informations partagées ne remplacent pas l'avis d'un professionnel de santé.";
}
