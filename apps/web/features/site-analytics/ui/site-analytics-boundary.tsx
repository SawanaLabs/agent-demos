"use client";

import { Button } from "@workspace/ui/components/button";
import { type ReactNode, useEffect, useState } from "react";

import { trackDemoAction } from "../client/browser";
import {
  type AnalyticsConsent,
  createGoogleConsentUpdate,
  readBrowserAnalyticsConsent,
  saveBrowserAnalyticsConsent,
} from "../client/consent";
import { createAcceptedDemoActionFetchObserver } from "../client/fetch-observer";
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

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const originalFetch = window.fetch;
    const observedFetch = createAcceptedDemoActionFetchObserver({
      fetchImplementation: originalFetch,
      track: trackDemoAction,
    });
    window.fetch = observedFetch;

    return () => {
      if (window.fetch === observedFetch) {
        window.fetch = originalFetch;
      }
    };
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
