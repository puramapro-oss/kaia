/**
 * KAÏA — onesignal.ts (P10)
 *
 * Client OneSignal pour push notifications iOS (APNs) + Android (FCM).
 * Initialisation lazy + gating : ONESIGNAL_APP_ID requis (sinon no-op).
 *
 * Côté serveur, /api/notifications/push utilise REST API OneSignal pour
 * envoyer une notif à un externalUserId Supabase (= profile.id).
 */

import { isNative } from "./capacitor-detect";

let initialized = false;

/* eslint-disable @typescript-eslint/no-explicit-any */

async function loadOneSignal(): Promise<any | null> {
  // Module présent uniquement dans les builds Capacitor natifs (Cordova plugin).
  const specifier = "onesignal-cordova-plugin";
  const mod = (await import(/* webpackIgnore: true */ specifier as string).catch(() => null)) as any;
  if (!mod) return null;
  return mod.default ?? mod;
}

export async function initOneSignal(externalUserId?: string): Promise<void> {
  if (initialized) return;
  if (!(await isNative())) return;

  const appId = (process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ?? "").trim();
  if (!appId) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[onesignal] NEXT_PUBLIC_ONESIGNAL_APP_ID manquant — push désactivé");
    }
    return;
  }

  try {
    const OneSignal = await loadOneSignal();
    if (!OneSignal) return;
    OneSignal.initialize?.(appId);

    if (externalUserId) {
      OneSignal.login?.(externalUserId);
    }

    OneSignal.Notifications?.requestPermission?.(true);
    initialized = true;
  } catch (err) {
    console.error("[onesignal] init failed", err);
  }
}

export async function loginOneSignal(externalUserId: string): Promise<void> {
  if (!(await isNative())) return;
  try {
    const OneSignal = await loadOneSignal();
    if (!OneSignal) return;
    OneSignal.login?.(externalUserId);
  } catch {
    // ignore
  }
}

export async function logoutOneSignal(): Promise<void> {
  if (!(await isNative())) return;
  try {
    const OneSignal = await loadOneSignal();
    if (!OneSignal) return;
    OneSignal.logout?.();
  } catch {
    // ignore
  }
}

/**
 * Server-side push via REST API OneSignal. Appelé depuis nos crons et
 * triggers côté API routes (jamais depuis le client).
 */
export async function sendPushServer(opts: {
  externalUserIds: string[];
  title: string;
  message: string;
  url?: string;
  data?: Record<string, string>;
}): Promise<{ ok: boolean; recipients?: number; error?: string }> {
  const appId = (process.env.ONESIGNAL_APP_ID ?? "").trim();
  const restKey = (process.env.ONESIGNAL_REST_API_KEY ?? "").trim();

  if (!appId || !restKey) {
    return { ok: false, error: "OneSignal non configuré" };
  }
  if (opts.externalUserIds.length === 0) {
    return { ok: true, recipients: 0 };
  }

  try {
    const res = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${restKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        target_channel: "push",
        include_aliases: { external_id: opts.externalUserIds },
        headings: { en: opts.title },
        contents: { en: opts.message },
        url: opts.url,
        data: opts.data,
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, error: `OneSignal ${res.status} ${txt.slice(0, 120)}` };
    }
    const data = (await res.json()) as { recipients?: number };
    return { ok: true, recipients: data.recipients };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "network error" };
  }
}
