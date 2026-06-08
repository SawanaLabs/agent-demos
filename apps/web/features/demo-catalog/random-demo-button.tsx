"use client";

import { ArrowSquareOutIcon, DiceFiveIcon } from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

const spinDurationMs = 1600;

export interface RandomDemoDestination {
  href: `/demos/${string}`;
  patternLabel: string;
  slug: string;
  source: string;
  summary: string;
  title: string;
}

export function pickRandomDemoDestination(
  destinations: RandomDemoDestination[],
  random = Math.random,
  excludedHref?: RandomDemoDestination["href"]
) {
  if (destinations.length === 0) {
    throw new Error("Random demo button requires at least one ready demo.");
  }

  const candidates =
    excludedHref && destinations.length > 1
      ? destinations.filter((destination) => destination.href !== excludedHref)
      : destinations;

  if (candidates.length === 0) {
    throw new Error("Random demo button could not find an eligible demo.");
  }

  const index = Math.min(
    candidates.length - 1,
    Math.floor(random() * candidates.length)
  );
  const destination = candidates[index];

  if (!destination) {
    throw new Error(`Random demo destination index is invalid: ${index}.`);
  }

  return destination;
}

interface RandomDemoButtonProps {
  destinations: RandomDemoDestination[];
}

function buildSlotReelItems(destinations: RandomDemoDestination[]) {
  if (destinations.length === 0) {
    return [];
  }

  return Array.from(
    { length: Math.max(12, destinations.length * 2) },
    (_, index) => {
      const destination = destinations[index % destinations.length];

      if (!destination) {
        throw new Error(`Slot reel destination index is invalid: ${index}.`);
      }

      return destination;
    }
  );
}

function SlotReel({
  distance,
  durationMs,
  items,
  offset,
}: {
  distance: string;
  durationMs: number;
  items: RandomDemoDestination[];
  offset: number;
}) {
  if (items.length === 0) {
    throw new Error("Slot reel requires at least one destination.");
  }

  const reelItems = items.map((_, index) => {
    const destination = items[(index + offset) % items.length];

    if (!destination) {
      throw new Error(`Slot reel item index is invalid: ${index}.`);
    }

    return destination;
  });

  return (
    <div className="min-w-0 overflow-hidden border border-foreground/10 bg-muted/40">
      <div
        className="random-demo-reel-track grid"
        style={
          {
            "--random-demo-reel-distance": distance,
            "--random-demo-reel-duration": `${durationMs}ms`,
          } as CSSProperties
        }
      >
        {[...reelItems, ...reelItems].map((destination, index) => (
          <div
            className="mx-1 flex h-7 items-center truncate border border-foreground/10 bg-background px-2 font-mono text-[11px] text-muted-foreground leading-none"
            key={`${destination.href}-${offset}-${index}`}
          >
            {destination.title}
          </div>
        ))}
      </div>
    </div>
  );
}

function SlotMachine({
  destinations,
  selected,
}: {
  destinations: RandomDemoDestination[];
  selected: RandomDemoDestination;
}) {
  const orderedDestinations = useMemo(
    () => [
      selected,
      ...destinations.filter(
        (destination) => destination.href !== selected.href
      ),
    ],
    [destinations, selected]
  );
  const reelItems = useMemo(
    () => buildSlotReelItems(orderedDestinations),
    [orderedDestinations]
  );

  return (
    <div className="space-y-3" data-testid="random-demo-slot-machine">
      <style>
        {`
          @keyframes random-demo-slot-reel {
            from { transform: translateY(0); }
            to { transform: translateY(var(--random-demo-reel-distance, -26rem)); }
          }

          .random-demo-reel-track {
            --random-demo-reel-gap: 0.25rem;
            --random-demo-reel-item-height: 1.75rem;
            animation: random-demo-slot-reel var(--random-demo-reel-duration, 1600ms) cubic-bezier(0.16, 1, 0.3, 1) forwards;
            gap: var(--random-demo-reel-gap);
            padding-block: calc((8rem - var(--random-demo-reel-item-height)) / 2);
            will-change: transform;
          }

          @media (prefers-reduced-motion: reduce) {
            .random-demo-reel-track {
              animation: none;
              will-change: auto;
            }
          }
        `}
      </style>
      <div
        aria-hidden="true"
        className="grid h-32 grid-cols-3 gap-2 overflow-hidden"
      >
        <SlotReel
          distance="-22rem"
          durationMs={spinDurationMs - 120}
          items={reelItems}
          offset={0}
        />
        <SlotReel
          distance="-26rem"
          durationMs={spinDurationMs - 60}
          items={reelItems}
          offset={4}
        />
        <SlotReel
          distance="-30rem"
          durationMs={spinDurationMs}
          items={reelItems}
          offset={8}
        />
      </div>
      <p className="sr-only">Choosing a random ready Agent Demo.</p>
    </div>
  );
}

function SelectedDemoCard({
  destination,
}: {
  destination: RandomDemoDestination;
}) {
  return (
    <Link
      aria-label={`Open ${destination.title} demo`}
      className="block outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
      href={destination.href}
      prefetch={false}
    >
      <Card
        className="cursor-pointer border border-foreground/10 bg-background transition-colors hover:border-foreground/30"
        data-testid="random-demo-selection-card"
        size="sm"
      >
        <CardHeader>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="border border-foreground/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.16em]">
              Ready
            </span>
            <span className="border border-foreground/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.16em]">
              {destination.patternLabel}
            </span>
          </div>
          <CardTitle>{destination.title}</CardTitle>
          <CardDescription>{destination.summary}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 border border-foreground/10 bg-muted/40 p-3">
            <p className="break-words text-muted-foreground text-xs/relaxed">
              Source: {destination.source}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
              {destination.slug}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function RandomDemoButton({ destinations }: RandomDemoButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] =
    useState<RandomDemoDestination | null>(null);
  const [status, setStatus] = useState<"spinning" | "selected">("selected");

  const startSpin = useCallback(
    (excludedHref?: RandomDemoDestination["href"]) => {
      setSelectedDestination(
        pickRandomDemoDestination(destinations, Math.random, excludedHref)
      );
      setStatus("spinning");
      setIsOpen(true);
    },
    [destinations]
  );

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);

    if (!open) {
      setStatus("selected");
    }
  }, []);

  useEffect(() => {
    if (!(isOpen && status === "spinning")) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setStatus("selected");
    }, spinDurationMs);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isOpen, status]);

  const openSelectedDemo = () => {
    if (!selectedDestination) {
      throw new Error("Random demo selection is missing.");
    }

    router.push(selectedDestination.href);
  };

  return (
    <>
      <Button
        aria-label="Open a random ready Agent Demo"
        onClick={() => {
          startSpin(selectedDestination?.href);
        }}
        size="sm"
        type="button"
      >
        <DiceFiveIcon className="size-3.5" />
        Random demo
      </Button>
      <Dialog onOpenChange={handleOpenChange} open={isOpen}>
        <DialogContent className="max-h-[calc(100svh-1rem)] max-w-[calc(100%-1rem)] gap-4 overflow-y-auto p-4 sm:max-w-lg">
          <DialogHeader className="pr-8">
            <DialogTitle>Random demo</DialogTitle>
            <DialogDescription>
              Spin through ready Agent Demos, then open the selected one or roll
              again.
            </DialogDescription>
          </DialogHeader>

          <div aria-live="polite" className="min-h-44">
            {selectedDestination && status === "spinning" ? (
              <SlotMachine
                destinations={destinations}
                selected={selectedDestination}
              />
            ) : null}
            {selectedDestination && status === "selected" ? (
              <SelectedDemoCard destination={selectedDestination} />
            ) : null}
          </div>

          <DialogFooter className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:justify-normal">
            <Button
              className="w-full"
              disabled={status === "spinning" || !selectedDestination}
              onClick={() => {
                startSpin(selectedDestination?.href);
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              <DiceFiveIcon className="size-3.5" />
              Spin again
            </Button>
            <Button
              className="w-full"
              disabled={status === "spinning" || !selectedDestination}
              onClick={openSelectedDemo}
              size="sm"
              type="button"
            >
              This one
              <ArrowSquareOutIcon className="size-3.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
