export const consentStorageKey = "agent-demos.site-analytics-consent-v1";

export type AnalyticsConsent = "denied" | "granted";

interface AnalyticsConsentStorage {
  readonly getItem: (key: string) => string | null;
  readonly setItem: (key: string, value: string) => unknown;
}

export function readAnalyticsConsent(
  storage: AnalyticsConsentStorage
): AnalyticsConsent | null {
  try {
    const value = storage.getItem(consentStorageKey);

    return value === "denied" || value === "granted" ? value : null;
  } catch {
    return null;
  }
}

export function saveAnalyticsConsent(
  storage: AnalyticsConsentStorage,
  choice: AnalyticsConsent
): void {
  try {
    storage.setItem(consentStorageKey, choice);
  } catch {
    // Browser storage restrictions must not make the product unusable.
  }
}

export function readBrowserAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return readAnalyticsConsent(window.localStorage);
  } catch {
    return null;
  }
}

export function saveBrowserAnalyticsConsent(choice: AnalyticsConsent): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    saveAnalyticsConsent(window.localStorage, choice);
  } catch {
    // Accessing localStorage itself can throw in privacy-restricted browsers.
  }
}

export function createGoogleConsentUpdate(choice: AnalyticsConsent) {
  return {
    ad_personalization: "denied" as const,
    ad_storage: "denied" as const,
    ad_user_data: "denied" as const,
    analytics_storage: choice,
  };
}

export function createGoogleConsentDefaultsScript(): string {
  return `
    (function () {
      var storedChoice = "denied";
      try {
        storedChoice = localStorage.getItem(${JSON.stringify(
          consentStorageKey
        )}) === "granted" ? "granted" : "denied";
      } catch (_) {}
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag("consent", "default", {
        ad_personalization: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        analytics_storage: "denied"
      });
      if (storedChoice === "granted") {
        window.gtag("consent", "update", {
          ad_personalization: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          analytics_storage: "granted"
        });
      }
    })();
  `;
}
