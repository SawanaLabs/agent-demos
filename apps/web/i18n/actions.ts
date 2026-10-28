"use server";

import { cookies } from "next/headers";
import { localeCookieName, type SiteLocale, supportedLocales } from "./locale";

export async function setLocale(locale: SiteLocale) {
  if (!supportedLocales.includes(locale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  (await cookies()).set(localeCookieName, locale, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
}
