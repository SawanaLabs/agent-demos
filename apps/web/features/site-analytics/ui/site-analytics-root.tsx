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
      <SiteAnalyticsBoundary enabled={config.enabled}>
        {children}
      </SiteAnalyticsBoundary>
    </>
  );
}
