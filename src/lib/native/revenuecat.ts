/**
 * KAÏA — revenuecat.ts (P10)
 *
 * Client RevenueCat IAP. Entitlement `kaia_active` = abonnement Premium
 * actif (équivalent profile.plan = 'active' côté Stripe web).
 *
 * Synchronisation : RevenueCat envoie un webhook HTTP vers
 * /api/revenuecat/webhook avec un secret partagé (REVENUECAT_WEBHOOK_AUTH).
 * On met à jour profile.plan + profile.subscription_started_at.
 *
 * Utilisation client :
 *   - configureRevenueCat(userId)  // au signup / login
 *   - presentPurchaseFlow()         // bouton "Continuer" iOS App Store §3.1.1
 *   - isPremiumActive()             // vérifie kaia_active sans faire d'achat
 */

import { getPlatform, isNative } from "./capacitor-detect";

const ENTITLEMENT_ID = "kaia_active";

let configured = false;

/* eslint-disable @typescript-eslint/no-explicit-any */
type RcModule = { Purchases?: any; default?: { Purchases?: any } };

async function loadRevenueCat(): Promise<any | null> {
  // Dynamic import : module présent uniquement dans les builds Capacitor natifs.
  // On stringify le specifier pour éviter que TS et bundlers résolvent le type.
  const specifier = "@revenuecat/purchases-capacitor";
  const mod = await import(/* webpackIgnore: true */ specifier as string).catch(() => null) as RcModule | null;
  if (!mod) return null;
  return mod.Purchases ?? mod.default?.Purchases ?? null;
}

function pickKey(): string | null {
  const ios = (process.env.NEXT_PUBLIC_REVENUECAT_PUBLIC_KEY_IOS ?? "").trim();
  const android = (process.env.NEXT_PUBLIC_REVENUECAT_PUBLIC_KEY_ANDROID ?? "").trim();
  if (ios && typeof window !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent)) return ios;
  if (android) return android;
  if (ios) return ios;
  return null;
}

export async function configureRevenueCat(userId: string): Promise<{ ok: boolean; reason?: string }> {
  if (configured) return { ok: true };
  if (!(await isNative())) return { ok: false, reason: "not-native" };

  const apiKey = pickKey();
  if (!apiKey) return { ok: false, reason: "missing-key" };

  try {
    const Purchases = await loadRevenueCat();
    if (!Purchases) return { ok: false, reason: "module-missing" };
    await Purchases.configure({ apiKey, appUserID: userId });
    configured = true;
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "configure-failed" };
  }
}

export async function isPremiumActive(): Promise<boolean> {
  if (!(await isNative())) return false;
  try {
    const Purchases = await loadRevenueCat();
    if (!Purchases) return false;
    const result = await Purchases.getCustomerInfo();
    const entitlements = result?.customerInfo?.entitlements?.active ?? {};
    return Boolean(entitlements[ENTITLEMENT_ID]?.isActive);
  } catch {
    return false;
  }
}

/**
 * iOS App Store §3.1.1 : bouton "Continuer" neutre. Sur natif → ouvre
 * paywall RevenueCat (StoreKit). Sur web → redirige vers /pricing.
 */
export async function presentPurchaseFlow(): Promise<{ ok: boolean; reason?: string }> {
  const platform = await getPlatform();
  if (platform === "web") {
    if (typeof window !== "undefined") {
      window.location.href = "/pricing";
    }
    return { ok: true };
  }

  try {
    const Purchases = await loadRevenueCat();
    if (!Purchases) return { ok: false, reason: "module-missing" };

    const offerings = await Purchases.getOfferings();
    const current = offerings?.current;
    const monthly = current?.monthly ?? current?.availablePackages?.[0];
    if (!monthly) return { ok: false, reason: "no-package" };

    const result = await Purchases.purchasePackage({ aPackage: monthly });
    const entitlements = result?.customerInfo?.entitlements?.active ?? {};
    return { ok: Boolean(entitlements[ENTITLEMENT_ID]?.isActive) };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "purchase-failed" };
  }
}

export async function restorePurchases(): Promise<{ ok: boolean; isActive: boolean }> {
  if (!(await isNative())) return { ok: false, isActive: false };
  try {
    const Purchases = await loadRevenueCat();
    if (!Purchases) return { ok: false, isActive: false };
    const result = await Purchases.restorePurchases();
    const active = Boolean(result?.customerInfo?.entitlements?.active?.[ENTITLEMENT_ID]?.isActive);
    return { ok: true, isActive: active };
  } catch {
    return { ok: false, isActive: false };
  }
}
