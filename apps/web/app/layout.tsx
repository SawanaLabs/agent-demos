import { Geist, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";

import "@workspace/ui/globals.css";
import { cn } from "@workspace/ui/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { env } from "@/env";
import { ProjectGuideCompanion } from "@/features/project-guide-companion/ui/project-guide-companion";
import { readSiteAnalyticsConfig } from "@/features/site-analytics/server/config";
import { SiteAnalyticsRoot } from "@/features/site-analytics/ui/site-analytics-root";
import { SiteUsageGateProvider } from "@/features/site-usage-gate/ui/site-usage-gate-provider";
import { LanguageSwitch } from "@/i18n/language-switch";
import { SitePageCopy } from "@/i18n/site-page-copy";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const analyticsConfig = readSiteAnalyticsConfig({
    isVercel: env.VERCEL === "1",
    nodeEnvironment: env.NODE_ENV,
    previewMeasurementId: env.NEXT_PUBLIC_GA_PREVIEW_MEASUREMENT_ID,
    productionMeasurementId: env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    vercelEnvironment: env.VERCEL_ENV,
  });

  return (
    <html
      className={cn(
        "antialiased",
        fontSans.variable,
        "font-mono",
        jetbrainsMono.variable
      )}
      lang={locale}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider>
          <SitePageCopy>
            <SiteAnalyticsRoot config={analyticsConfig}>
              <ThemeProvider>
                <SiteUsageGateProvider>
                  {children}
                  <ThemeToggle />
                  <LanguageSwitch />
                  <ProjectGuideCompanion />
                </SiteUsageGateProvider>
              </ThemeProvider>
            </SiteAnalyticsRoot>
          </SitePageCopy>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
