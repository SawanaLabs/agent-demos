"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type Tracker = ((...args: unknown[]) => void) & { q?: unknown[][] };

export function PlausibleNotFound({ enabled }: { readonly enabled: boolean }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!(enabled && pathname)) {
      return;
    }

    const target = window as typeof window & { plausible?: Tracker };
    const queue: Tracker = (...args) => {
      queue.q ??= [];
      queue.q.push(args);
    };
    target.plausible ??= queue;
    target.plausible("404", { url: window.location.href });
  }, [enabled, pathname]);

  return null;
}
