"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { ArrowLeft, Clock, Heart, Key, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { normalizeSiteUsageInviteCode } from "../access-code";
import {
  type SiteUsageLimitPayload,
  siteUsageLimitErrorCode,
} from "../contract";

type DialogView = "access-code" | "limit" | "waitlist" | "waitlist-success";

export function SiteUsageGateProvider({ children }: { children: ReactNode }) {
  const [accessCode, setAccessCode] = useState("");
  const [accessCodeError, setAccessCodeError] = useState<string | null>(null);
  const [isRedeemingCode, setIsRedeemingCode] = useState(false);
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [limitPayload, setLimitPayload] =
    useState<SiteUsageLimitPayload | null>(null);
  const [view, setView] = useState<DialogView>("limit");
  const [waitlistMessage, setWaitlistMessage] = useState("");
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  const openLimitDialog = useCallback((payload: SiteUsageLimitPayload) => {
    setAccessCode("");
    setAccessCodeError(null);
    setLimitPayload(payload);
    setView("limit");
    setWaitlistError(null);
    setWaitlistMessage("");
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const path = getRequestPath(args[0]);

      if (response.status === 429 && shouldHandleSiteUsageLimitPath(path)) {
        void response
          .clone()
          .json()
          .then((body: unknown) => {
            if (isSiteUsageLimitPayload(body)) {
              openLimitDialog(body);
            }
          })
          .catch(() => undefined);
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [openLimitDialog]);

  const resetTime = useMemo(() => {
    if (!limitPayload) {
      return null;
    }

    return formatLocalResetTime(limitPayload.resetAt);
  }, [limitPayload]);

  async function handleRedeemCode(event: { preventDefault(): void }) {
    event.preventDefault();
    setAccessCodeError(null);
    setIsRedeemingCode(true);

    try {
      const response = await fetch("/api/site-usage/access-code", {
        body: JSON.stringify({ code: accessCode }),
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });
      const body = await readJson(response);

      if (!response.ok) {
        setAccessCodeError(getErrorMessage(body) ?? "Invalid code.");
        return;
      }

      setIsOpen(false);
      setAccessCode("");
    } finally {
      setIsRedeemingCode(false);
    }
  }

  async function handleSupportWaitlist(event: { preventDefault(): void }) {
    event.preventDefault();
    setIsSubmittingWaitlist(true);
    setWaitlistError(null);

    try {
      const response = await fetch("/api/site-usage/waitlist", {
        body: JSON.stringify({
          demoSlug: limitPayload?.demoSlug ?? null,
          message: waitlistMessage,
          supportIntent: "willing_to_support",
        }),
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });
      const body = await readJson(response);

      if (!response.ok) {
        setWaitlistError(getErrorMessage(body) ?? "Could not submit this yet.");
        return;
      }

      setView("waitlist-success");
    } finally {
      setIsSubmittingWaitlist(false);
    }
  }

  return (
    <>
      {children}
      <Dialog onOpenChange={setIsOpen} open={isOpen}>
        <DialogContent className="sm:max-w-md">
          {view === "limit" && (
            <>
              <DialogHeader>
                <DialogTitle>Usage limit reached</DialogTitle>
                <DialogDescription>
                  This visitor has used the current demo quota.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-start gap-2 border border-border bg-muted/30 p-3 text-xs">
                <Clock className="mt-0.5 size-3.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Reset time</p>
                  <p className="text-muted-foreground">
                    {resetTime ?? "Calculating from your local timezone..."}
                  </p>
                </div>
              </div>
              <DialogFooter className="sm:justify-between">
                <Button
                  onClick={() => setView("access-code")}
                  type="button"
                  variant="link"
                >
                  <Key />
                  Invite code
                </Button>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button
                    onClick={() => setIsOpen(false)}
                    type="button"
                    variant="outline"
                  >
                    Maybe later
                  </Button>
                  <Button onClick={() => setView("waitlist")} type="button">
                    <Heart />
                    Join waitlist
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}

          {view === "access-code" && (
            <form className="space-y-4" onSubmit={handleRedeemCode}>
              <DialogHeader>
                <div>
                  <Button
                    aria-label="Back"
                    className="mb-2 -ml-1"
                    onClick={() => setView("limit")}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <ArrowLeft />
                  </Button>
                </div>
                <DialogTitle>Invite code</DialogTitle>
                <DialogDescription>
                  Use this code to upgrade your quota to 100 messages every 5
                  hours.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <label className="font-medium text-xs" htmlFor="site-code">
                  Invite code
                </label>
                <Input
                  autoCapitalize="characters"
                  autoComplete="off"
                  autoFocus
                  id="site-code"
                  onChange={(event) =>
                    setAccessCode(
                      normalizeSiteUsageInviteCode(event.target.value)
                    )
                  }
                  placeholder="YOUR-CODE"
                  spellCheck={false}
                  value={accessCode}
                />
                {accessCodeError && (
                  <p className="text-destructive text-xs">{accessCodeError}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  disabled={isRedeemingCode || !accessCode.trim()}
                  type="submit"
                >
                  {isRedeemingCode && <Loader2 className="animate-spin" />}
                  Apply code
                </Button>
              </DialogFooter>
            </form>
          )}

          {view === "waitlist" && (
            <form className="space-y-4" onSubmit={handleSupportWaitlist}>
              <DialogHeader>
                <div>
                  <Button
                    aria-label="Back"
                    className="mb-2 -ml-1"
                    onClick={() => setView("limit")}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <ArrowLeft />
                  </Button>
                </div>
                <DialogTitle>Higher limits waitlist</DialogTitle>
                <DialogDescription>
                  Tell us whether you would actually need a paid plan with
                  higher message limits.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <label
                  className="font-medium text-xs"
                  htmlFor="site-waitlist-message"
                >
                  Message{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <Textarea
                  id="site-waitlist-message"
                  maxLength={2000}
                  onChange={(event) => setWaitlistMessage(event.target.value)}
                  placeholder="What would make paid limits useful?"
                  value={waitlistMessage}
                />
                {waitlistError && (
                  <p className="text-destructive text-xs">{waitlistError}</p>
                )}
              </div>
              <DialogFooter>
                <Button disabled={isSubmittingWaitlist} type="submit">
                  {isSubmittingWaitlist && <Loader2 className="animate-spin" />}
                  Join waitlist
                </Button>
              </DialogFooter>
            </form>
          )}

          {view === "waitlist-success" && (
            <>
              <DialogHeader>
                <DialogTitle>Waitlist saved</DialogTitle>
                <DialogDescription>
                  Thanks. This helps us decide whether higher-limit paid access
                  is worth shipping.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setIsOpen(false)} type="button">
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function shouldHandleSiteUsageLimitPath(path: string | null) {
  return (
    path?.startsWith("/api/demos/") || path === "/api/project-guide-companion"
  );
}

function getRequestPath(input: RequestInfo | URL) {
  try {
    if (typeof input === "string" || input instanceof URL) {
      return new URL(input, window.location.origin).pathname;
    }

    return new URL(input.url).pathname;
  } catch {
    return null;
  }
}

function isSiteUsageLimitPayload(body: unknown): body is SiteUsageLimitPayload {
  if (!body || typeof body !== "object") {
    return false;
  }

  return (
    "code" in body &&
    body.code === siteUsageLimitErrorCode &&
    "resetAt" in body &&
    typeof body.resetAt === "string" &&
    "policy" in body
  );
}

function formatLocalResetTime(resetAt: string) {
  const date = new Date(resetAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getErrorMessage(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }

  if ("error" in body && typeof body.error === "string") {
    return body.error;
  }

  return null;
}
