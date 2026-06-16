'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Moon, Heart, Bell, Sparkles, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingAnswers {
  prenom: string;
  locale: string;
  objectif: string;
  cycle_knowledge: string;
  sensibilites: string[];
  notifications_preference: string;
}

const STEPS = [
  { id: 'identite', title: 'Bienvenue', icon: Sparkles },
  { id: 'objectif', title: 'Ton intention', icon: Heart },
  { id: 'cycle', title: 'Ton cycle', icon: Moon },
  { id: 'sensibilites', title: 'Tes sensibilités', icon: Leaf },
  { id: 'notifications', title: 'Tes rappels', icon: Bell },
] as const;

const OBJECTIFS = [
  { key: 'comprendre_cycle', label: 'Comprendre mon cycle', emoji: '🌙' },
  { key: 'bien_etre', label: 'Améliorer mon bien-être', emoji: '🌿' },
  { key: 'gerer_symptomes', label: 'Gérer mes symptômes', emoji: '💜' },
  { key: 'fertilite', label: 'Suivre ma fertilité', emoji: '🌸' },
];

const CYCLE_KNOWLEDGE = [
  { key: 'debutante', label: 'Je commence', desc: 'Je veux tout apprendre' },
  { key: 'curieuse', label: 'Je me documente', desc: "J'ai quelques bases" },
  { key: 'habituee', label: 'Je connais mon cycle', desc: "Je cherche à approfondir" },
];

const SENSIBILITES = [
  { key: 'douleurs', label: 'Douleurs menstruelles' },
  { key: 'humeur', label: "Variations d'humeur" },
  { key: 'sommeil', label: 'Troubles du sommeil' },
  { key: 'digestion', label: 'Digestion' },
  { key: 'peau', label: 'Peau & acné' },
  { key: 'energie', label: "Niveaux d'énergie" },
];

const NOTIF_PREFERENCES = [
  { key: 'matin', label: 'Matin', desc: '8h — Pour bien commencer' },
  { key: 'soir', label: 'Soir', desc: '20h — Pour un bilan de journée' },
  { key: 'aucune', label: 'Sans rappels', desc: 'Je consulte à ma guise' },
];

export default function OnboardingWizardV2({ userId }: { userId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    prenom: '',
    locale: 'fr',
    objectif: '',
    cycle_knowledge: '',
    sensibilites: [],
    notifications_preference: 'soir',
  });

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const canNext = (() => {
    if (step === 0) return answers.prenom.trim().length > 0;
    if (step === 1) return answers.objectif !== '';
    if (step === 2) return answers.cycle_knowledge !== '';
    if (step === 3) return true;
    if (step === 4) return answers.notifications_preference !== '';
    return false;
  })();

  function toggleSensibilite(key: string) {
    setAnswers((a) => ({
      ...a,
      sensibilites: a.sensibilites.includes(key)
        ? a.sensibilites.filter((s) => s !== key)
        : [...a.sensibilites, key],
    }));
  }

  async function handleFinish() {
    setSaving(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...answers, userId }),
      });
      if (!res.ok) throw new Error('Erreur lors de la sauvegarde');
      router.push('/accueil');
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      {/* Progress */}
      <div className="flex gap-1.5 mb-10">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              'h-1 rounded-full transition-all duration-500',
              i <= step ? 'bg-[var(--kaia-moon)] w-8' : 'bg-[rgba(200,185,240,0.2)] w-4'
            )}
          />
        ))}
      </div>

      <div className="w-full max-w-sm">
        {/* Step icon + title */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--kaia-moon)] to-[var(--kaia-rose)] items-center justify-center mb-4 shadow-[0_0_30px_rgba(200,185,240,0.3)]">
            <currentStep.icon className="text-[var(--background)]" size={24} strokeWidth={1.8} />
          </div>
          <h2 className="font-display text-2xl font-semibold text-[var(--foreground)]">
            {currentStep.title}
          </h2>
        </div>

        {/* Step content */}
        <div className="space-y-3">
          {step === 0 && (
            <>
              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-2">
                  Comment tu t'appelles ?
                </label>
                <input
                  type="text"
                  autoFocus
                  value={answers.prenom}
                  onChange={(e) => setAnswers((a) => ({ ...a, prenom: e.target.value }))}
                  placeholder="Ton prénom"
                  className="w-full px-4 py-3.5 glass rounded-xl text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--kaia-moon)] text-base"
                />
              </div>
            </>
          )}

          {step === 1 && (
            <div className="grid gap-2">
              {OBJECTIFS.map((o) => (
                <button
                  key={o.key}
                  onClick={() => setAnswers((a) => ({ ...a, objectif: o.key }))}
                  className={cn(
                    'flex items-center gap-4 px-4 py-4 rounded-xl text-left transition-all duration-200',
                    answers.objectif === o.key
                      ? 'bg-[rgba(200,185,240,0.15)] border border-[var(--kaia-moon)] text-[var(--foreground)]'
                      : 'glass text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  )}
                >
                  <span className="text-2xl">{o.emoji}</span>
                  <span className="font-medium">{o.label}</span>
                  {answers.objectif === o.key && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-[var(--kaia-moon)]" />
                  )}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-2">
              {CYCLE_KNOWLEDGE.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setAnswers((a) => ({ ...a, cycle_knowledge: c.key }))}
                  className={cn(
                    'flex flex-col px-4 py-4 rounded-xl text-left transition-all duration-200',
                    answers.cycle_knowledge === c.key
                      ? 'bg-[rgba(200,185,240,0.15)] border border-[var(--kaia-moon)]'
                      : 'glass'
                  )}
                >
                  <span className="font-medium text-[var(--foreground)]">{c.label}</span>
                  <span className="text-xs text-[var(--foreground-muted)] mt-0.5">{c.desc}</span>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-2 gap-2">
              {SENSIBILITES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => toggleSensibilite(s.key)}
                  className={cn(
                    'px-3 py-3 rounded-xl text-sm text-center transition-all duration-200',
                    answers.sensibilites.includes(s.key)
                      ? 'bg-[rgba(200,185,240,0.15)] border border-[var(--kaia-moon)] text-[var(--foreground)]'
                      : 'glass text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  )}
                >
                  {s.label}
                </button>
              ))}
              <p className="col-span-2 text-xs text-[var(--foreground-muted)] text-center mt-1">
                Sélectionne autant que tu veux (ou aucun)
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-2">
              {NOTIF_PREFERENCES.map((n) => (
                <button
                  key={n.key}
                  onClick={() => setAnswers((a) => ({ ...a, notifications_preference: n.key }))}
                  className={cn(
                    'flex items-center justify-between px-4 py-4 rounded-xl transition-all duration-200',
                    answers.notifications_preference === n.key
                      ? 'bg-[rgba(200,185,240,0.15)] border border-[var(--kaia-moon)]'
                      : 'glass'
                  )}
                >
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{n.label}</p>
                    <p className="text-xs text-[var(--foreground-muted)]">{n.desc}</p>
                  </div>
                  {answers.notifications_preference === n.key && (
                    <span className="w-2 h-2 rounded-full bg-[var(--kaia-moon)]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center justify-center h-14 w-14 glass rounded-2xl text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <button
            onClick={isLast ? handleFinish : () => setStep((s) => s + 1)}
            disabled={!canNext || saving}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl font-semibold text-base transition-all duration-300',
              canNext && !saving
                ? 'bg-gradient-to-r from-[var(--kaia-moon)] to-[var(--kaia-rose)] text-[var(--background)] shadow-[0_0_30px_rgba(200,185,240,0.3)] hover:shadow-[0_0_40px_rgba(200,185,240,0.5)] hover:-translate-y-0.5'
                : 'glass text-[var(--foreground-muted)] cursor-not-allowed opacity-50'
            )}
          >
            {saving ? (
              <span className="h-5 w-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : isLast ? (
              <>Découvrir KAÏA</>
            ) : (
              <>Continuer <ChevronRight size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
