import { Geist, JetBrains_Mono } from "next/font/google";

import "@workspace/ui/globals.css";
import { cn } from "@workspace/ui/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { ProjectGuideCompanion } from "@/features/project-guide-companion/ui/project-guide-companion";
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
        <ThemeProvider>
          <SiteUsageGateProvider>
            {children}
            <ProjectGuideCompanion />
          </SiteUsageGateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
