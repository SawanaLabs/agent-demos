import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";
import type { ReactNode } from "react";

import { createGoogleConsentDefaultsScript } from "../client/consent";
import type { SiteAnalyticsConfig } from "../server/config";
import { SiteAnalyticsBoundary } from "./site-analytics-boundary";

export function SiteAnalyticsRoot({
  children,
  config,
}: {
  readonly children: ReactNode;
  readonly config: SiteAnalyticsConfig;
}) {
  return (
    <>
      {config.enabled ? (
        <>
          <Script id="google-consent-defaults" strategy="beforeInteractive">
            {createGoogleConsentDefaultsScript()}
          </Script>
          <GoogleAnalytics gaId={config.measurementId} />
        </>
      ) : null}
      {config.enabled &&
      config.mode === "production" &&
      config.plausibleScriptUrl ? (
        <>
          <Script id="plausible-init" strategy="afterInteractive">
            {`window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) };
window.plausible.init = window.plausible.init || function(options) { window.plausible.o = options || {} };
window.plausible.init();`}
          </Script>
          <Script
            async
            src={config.plausibleScriptUrl}
            strategy="afterInteractive"
          />
        </>
      ) : null}
      <SiteAnalyticsBoundary enabled={config.enabled}>
        {children}
      </SiteAnalyticsBoundary>
    </>
  );
}
