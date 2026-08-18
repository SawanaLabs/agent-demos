"use client";

import { Button } from "@workspace/ui/components/button";
import { type ReactNode, useEffect, useState } from "react";

import {
  type AnalyticsConsent,
  createGoogleConsentUpdate,
  readBrowserAnalyticsConsent,
  saveBrowserAnalyticsConsent,
} from "../client/consent";
import { PrivacyChoices } from "./privacy-choices";

declare global {
  interface Window {
    gtag?: (...arguments_: unknown[]) => void;
  }
}

function updateGoogleConsent(choice: AnalyticsConsent): void {
  try {
    window.gtag?.("consent", "update", createGoogleConsentUpdate(choice));
  } catch {
    // The analytics provider never owns the product workflow.
  }
}

export function SiteAnalyticsBoundary({
  children,
  enabled,
}: {
  readonly children: ReactNode;
  readonly enabled: boolean;
}) {
  const [initialized, setInitialized] = useState(false);
  const [choicesOpen, setChoicesOpen] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const storedChoice = readBrowserAnalyticsConsent();

    if (storedChoice) {
      updateGoogleConsent(storedChoice);
    }

    setChoicesOpen(storedChoice === null);
    setInitialized(true);
  }, [enabled]);

  function choose(nextChoice: AnalyticsConsent): void {
    updateGoogleConsent(nextChoice);
    saveBrowserAnalyticsConsent(nextChoice);
    setChoicesOpen(false);
  }

  let privacyControls: ReactNode = null;

  if (enabled && initialized) {
    if (choicesOpen) {
      privacyControls = <PrivacyChoices onChoose={choose} />;
    } else {
      privacyControls = (
        <Button
          className="fixed bottom-4 left-4 z-40"
          onClick={() => setChoicesOpen(true)}
          size="sm"
          type="button"
          variant="outline"
        >
          Privacy choices
        </Button>
      );
    }
  }

  return (
    <>
      {children}
      {privacyControls}
    </>
  );
}
