import { Geist, JetBrains_Mono } from "next/font/google";

import "@workspace/ui/globals.css";
import { cn } from "@workspace/ui/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { env } from "@/env";
import { ProjectGuideCompanion } from "@/features/project-guide-companion/ui/project-guide-companion";
import { readSiteAnalyticsConfig } from "@/features/site-analytics/server/config";
import { SiteAnalyticsRoot } from "@/features/site-analytics/ui/site-analytics-root";
import { SiteUsageGateProvider } from "@/features/site-usage-gate/ui/site-usage-gate-provider";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <SiteAnalyticsRoot config={analyticsConfig}>
          <ThemeProvider>
            <SiteUsageGateProvider>
              {children}
              <ThemeToggle />
              <ProjectGuideCompanion />
            </SiteUsageGateProvider>
          </ThemeProvider>
        </SiteAnalyticsRoot>
      </body>
    </html>
  );
}
