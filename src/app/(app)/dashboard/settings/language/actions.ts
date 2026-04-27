"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale, LOCALE_COOKIE } from "@/i18n/locales";

const ONE_YEAR = 60 * 60 * 24 * 365;

type Result = { ok: true } | { ok: false; error: string };

export async function setLocaleAction(formData: FormData): Promise<Result> {
  const value = formData.get("locale");
  if (typeof value !== "string" || !isLocale(value)) {
    return { ok: false, error: "Locale invalide" };
  }
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
