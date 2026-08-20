import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

import {
  consentStorageKey,
  createGoogleConsentDefaultsScript,
  createGoogleConsentUpdate,
  readAnalyticsConsent,
  readBrowserAnalyticsConsent,
  saveAnalyticsConsent,
  saveBrowserAnalyticsConsent,
} from "./consent";

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    values,
  };
}

describe("site analytics consent", () => {
  it("persists one binary choice and rejects malformed state", () => {
    const storage = createStorage();

    expect(readAnalyticsConsent(storage)).toBeNull();
    saveAnalyticsConsent(storage, "granted");
    expect(readAnalyticsConsent(storage)).toBe("granted");
    saveAnalyticsConsent(storage, "denied");
    expect(readAnalyticsConsent(storage)).toBe("denied");

    storage.values.set(consentStorageKey, "maybe");
    expect(readAnalyticsConsent(storage)).toBeNull();
  });

  it("defaults analytics storage to denied before GA loads", () => {
    const script = createGoogleConsentDefaultsScript();

    expect(script).toContain(consentStorageKey);
    expect(script).toContain('analytics_storage: "denied"');
    expect(script).toContain('ad_storage: "denied"');
  });

  it("installs default denied before replaying a persisted grant", () => {
    const dataLayer: IArguments[] = [];
    const localStorage = {
      getItem: () => "granted",
    };
    const window = { dataLayer } as {
      dataLayer: IArguments[];
      gtag?: (...arguments_: unknown[]) => void;
    };

    runInNewContext(createGoogleConsentDefaultsScript(), {
      localStorage,
      window,
    });

    expect(dataLayer.map((entry) => Array.from(entry))).toEqual([
      [
        "consent",
        "default",
        {
          ad_personalization: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          analytics_storage: "denied",
        },
      ],
      [
        "consent",
        "update",
        {
          ad_personalization: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          analytics_storage: "granted",
        },
      ],
    ]);
  });

  it("keeps every advertising consent denied when analytics is granted", () => {
    expect(createGoogleConsentUpdate("granted")).toEqual({
      ad_personalization: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      analytics_storage: "granted",
    });
  });

  it("does not let unavailable browser storage break the product", () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };

    expect(readAnalyticsConsent(storage)).toBeNull();
    expect(() => saveAnalyticsConsent(storage, "denied")).not.toThrow();
  });

  it("isolates access to a blocked localStorage property", () => {
    const blockedWindow = {};

    Object.defineProperty(blockedWindow, "localStorage", {
      get: () => {
        throw new Error("storage blocked");
      },
    });
    vi.stubGlobal("window", blockedWindow);

    expect(readBrowserAnalyticsConsent()).toBeNull();
    expect(() => saveBrowserAnalyticsConsent("granted")).not.toThrow();

    vi.unstubAllGlobals();
  });
});
