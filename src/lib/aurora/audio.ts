"use client";
// WebAudio tonal breathing cues — anti-pop fade-in/out

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  durationSec: number,
  gainPeak = 0.15,
  type: OscillatorType = "sine"
): void {
  const ctx = getAudioCtx();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = type;
  oscillator.frequency.value = frequency;

  const now = ctx.currentTime;
  const fadeDuration = Math.min(0.05, durationSec * 0.1);

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(gainPeak, now + fadeDuration);
  gainNode.gain.setValueAtTime(gainPeak, now + durationSec - fadeDuration);
  gainNode.gain.linearRampToValueAtTime(0, now + durationSec);

  oscillator.start(now);
  oscillator.stop(now + durationSec);
}

export function playInhaleCue(): void {
  if (typeof window === "undefined") return;
  try { playTone(432, 0.3, 0.12, "sine"); } catch { /* silent */ }
}

export function playExhaleCue(): void {
  if (typeof window === "undefined") return;
  try { playTone(288, 0.5, 0.1, "sine"); } catch { /* silent */ }
}

export function playHoldCue(): void {
  if (typeof window === "undefined") return;
  try { playTone(360, 0.2, 0.08, "sine"); } catch { /* silent */ }
}

export function playPhaseTransitionCue(): void {
  if (typeof window === "undefined") return;
  try {
    playTone(432, 0.15, 0.12);
    setTimeout(() => playTone(528, 0.25, 0.1), 150);
  } catch { /* silent */ }
}

export function playSessionCompleteCue(): void {
  if (typeof window === "undefined") return;
  try {
    [432, 528, 639].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.4, 0.15), i * 300);
    });
  } catch { /* silent */ }
}

export const EPILEPSY_DISCLAIMER =
  "Avertissement : Cette session contient des stimulations visuelles rythmiques. " +
  "Elle est déconseillée aux personnes épileptiques ou sensibles aux flashs lumineux.";
