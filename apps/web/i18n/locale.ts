export const localeCookieName = "agent-demos-locale";
export const supportedLocales = ["en", "zh-CN"] as const;
export type SiteLocale = (typeof supportedLocales)[number];

export function resolveLocale(value: string | undefined): SiteLocale {
  return value === "zh-CN" ? "zh-CN" : "en";
}

export function pageCopyKey(source: string) {
  return source
    .trim()
    .replace(/\s+/g, " ")
    .replaceAll("%", "%25")
    .replaceAll(".", "%2E");
}
