"use client";

import { Button } from "@workspace/ui/components/button";

import type { AnalyticsConsent } from "../client/consent";

export function PrivacyChoices({
  onChoose,
}: {
  readonly onChoose: (choice: AnalyticsConsent) => void;
}) {
  return (
    <aside
      aria-label="Privacy choices"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-lg border bg-card p-4 text-card-foreground shadow-lg sm:p-5"
      role="dialog"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-base">Privacy &amp; analytics</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            GA4 helps us understand which Agent Demo features are useful.
            Storage stays denied until you allow it; Google may still receive
            cookieless measurement pings under Advanced Consent Mode.
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2">
          <Button
            onClick={() => onChoose("denied")}
            type="button"
            variant="outline"
          >
            Keep denied
          </Button>
          <Button onClick={() => onChoose("granted")} type="button">
            Allow analytics
          </Button>
        </div>
      </div>
    </aside>
  );
}
