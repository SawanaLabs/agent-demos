"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Coins, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type creditPriceList,
  messageCreditCost,
  resourceCreditCosts,
} from "../pricing";
import type { CreditBalance } from "../server/balance";

type Balance = CreditBalance & { prices: typeof creditPriceList };

export function CreditBalanceButton() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);
  const refresh = useCallback(async () => {
    if (pending.current) {
      return;
    }
    pending.current = true;
    setLoading(true);
    try {
      const response = await fetch("/api/site-usage/balance", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Could not load credits.");
      }
      setBalance((await response.json()) as Balance);
      setError(false);
    } catch {
      setError(true);
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("site-credits-changed", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("site-credits-changed", onFocus);
    };
  }, [refresh]);
  useEffect(() => {
    if (!balance) {
      return;
    }
    const delay = new Date(balance.resetAt).getTime() - Date.now();
    if (delay <= 0) {
      return;
    }
    const timer = window.setTimeout(
      () => {
        void refresh();
      },
      Math.min(delay + 1000, 2_147_483_647)
    );
    return () => window.clearTimeout(timer);
  }, [balance, refresh]);

  const balanceLabel = balance
    ? `${balance.remainingUnits} credits remaining`
    : "Loading credits";
  return (
    <Popover
      onOpenChange={(open) => {
        if (open) {
          void refresh();
        }
      }}
    >
      <PopoverTrigger
        aria-label={error ? "Credits unavailable" : balanceLabel}
        render={<Button size="sm" variant="outline" />}
      >
        <Coins aria-hidden="true" className="size-4 text-foreground" />
        <span aria-live="polite" className="min-w-5 tabular-nums">
          {error ? "!" : (balance?.remainingUnits ?? "…")}
        </span>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="max-h-[min(32rem,var(--available-height))] w-80 max-w-[calc(100vw-2rem)] gap-4 overflow-y-auto p-4"
      >
        <div className="space-y-1">
          <PopoverTitle>Your demo credits</PopoverTitle>
          <PopoverDescription>
            One shared allowance across all demos in this browser.
          </PopoverDescription>
        </div>
        {error && (
          <div className="space-y-2" role="alert">
            <p>Could not load your credit balance.</p>
            <Button
              disabled={loading}
              onClick={() => {
                void refresh();
              }}
              size="sm"
              variant="outline"
            >
              <RefreshCw className="size-3.5" />
              Try again
            </Button>
          </div>
        )}
        {!error && balance && (
          <>
            <div className="space-y-2">
              <p>
                <span className="font-medium text-3xl tabular-nums">
                  {balance.remainingUnits}
                </span>
                <span className="ml-2 text-muted-foreground">
                  of {balance.allowanceUnits} credits left
                </span>
              </p>
              <div className="h-1.5 overflow-hidden bg-muted">
                <div
                  className="h-full bg-foreground transition-[width] motion-reduce:transition-none"
                  style={{
                    width: `${(100 * balance.remainingUnits) / balance.allowanceUnits}%`,
                  }}
                />
              </div>
              <p className="text-muted-foreground text-xs/relaxed">
                {resetDescription(balance)}
              </p>
            </div>
            <div className="border-t pt-3">
              <p className="mb-2 font-medium">How credits are used</p>
              <dl className="space-y-2">
                {balance.prices.map((price, index) => (
                  <div
                    className="flex items-start justify-between gap-3"
                    key={price.label}
                  >
                    <dt className="text-muted-foreground">{price.label}</dt>
                    <dd className="shrink-0 tabular-nums">
                      {index === 0 ? "" : "+"}
                      {price.credits}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <p className="text-muted-foreground text-xs/relaxed">
              A message with one generated image uses{" "}
              {messageCreditCost + resourceCreditCosts.image_generation}{" "}
              credits. Workflows add up the nodes they execute. Reused results
              and regular canvas edits cost no extra credits. Canvas Agent chat
              is free; its generated images cost{" "}
              {resourceCreditCosts.image_generation} credits each.
            </p>
            <p className="text-muted-foreground text-xs/relaxed">
              Generation attempts use credits even if the provider fails.
              Credits refresh automatically; unused credits do not carry over.
            </p>
          </>
        )}
        {!(error || balance) && <p role="status">Loading your credits…</p>}
      </PopoverContent>
    </Popover>
  );
}

function resetDescription(balance: Balance) {
  if (balance.scope === "access_code" && balance.usedUnits === 0) {
    return `${balance.allowanceUnits} credits available in each rolling ${balance.windowSeconds / 3600}-hour window.`;
  }
  const time = new Date(balance.resetAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return balance.scope === "default_daily"
    ? `Daily allowance refreshes ${time}.`
    : `Rolling allowance. Next credits return ${time}.`;
}
