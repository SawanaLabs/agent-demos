import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { localeCookieName, resolveLocale } from "./locale";

export default getRequestConfig(async () => {
  const locale = resolveLocale((await cookies()).get(localeCookieName)?.value);
  const messages =
    locale === "zh-CN"
      ? (await import("./messages/zh-CN.json")).default
      : (await import("./messages/en.json")).default;

  return { locale, messages, timeZone: "UTC" };
});
