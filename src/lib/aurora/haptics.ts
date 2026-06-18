// Haptic feedback for Aurora phase transitions
// Web: Navigator.vibrate | Native: future Capacitor Haptics

export function vibrateInhale(): void {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  navigator.vibrate(60);
}

export function vibrateExhale(): void {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  navigator.vibrate([40, 30, 40]);
}

export function vibratePhaseTransition(): void {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  navigator.vibrate([80, 40, 80, 40, 120]);
}

export function vibrateSessionComplete(): void {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  navigator.vibrate([100, 50, 100, 50, 200]);
}
