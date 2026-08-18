import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/script", () => ({
  default: ({
    children,
    id,
    strategy,
  }: {
    readonly children: string;
    readonly id: string;
    readonly strategy: string;
  }) => (
    <script data-strategy={strategy} id={id}>
      {children}
    </script>
  ),
}));

vi.mock("@next/third-parties/google", () => ({
  GoogleAnalytics: ({ gaId }: { readonly gaId: string }) => (
    <div data-ga-id={gaId} data-testid="google-analytics" />
  ),
}));

import { SiteAnalyticsRoot } from "./site-analytics-root";

describe("site analytics root", () => {
  it("renders consent defaults before the GA provider when enabled", () => {
    const markup = renderToStaticMarkup(
      <SiteAnalyticsRoot
        config={{
          enabled: true,
          measurementId: "G-TEST1234",
          mode: "preview",
        }}
      >
        <main>Product</main>
      </SiteAnalyticsRoot>
    );

    const consentIndex = markup.indexOf("google-consent-defaults");
    const providerIndex = markup.indexOf('data-testid="google-analytics"');

    expect(consentIndex).toBeGreaterThanOrEqual(0);
    expect(providerIndex).toBeGreaterThan(consentIndex);
    expect(markup).toContain("beforeInteractive");
    expect(markup).toContain('analytics_storage: "denied"');
  });

  it("renders no analytics script or provider when disabled", () => {
    const markup = renderToStaticMarkup(
      <SiteAnalyticsRoot config={{ enabled: false }}>
        <main>Product</main>
      </SiteAnalyticsRoot>
    );

    expect(markup).toContain("Product");
    expect(markup).not.toContain("google-consent-defaults");
    expect(markup).not.toContain("google-analytics");
  });
});
