import { afterEach, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ pathname: "/missing-one" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("react", () => ({ useEffect: (effect: () => void) => effect() }));

import { PlausibleNotFound } from "./plausible-not-found";

afterEach(() => vi.unstubAllGlobals());

it("preserves each missing URL when the tracker loads after navigation", () => {
  const browser: {
    location: { href: string };
    plausible?: ((...args: unknown[]) => void) & { q?: unknown[][] };
  } = { location: { href: "https://agent-demos.hsawana9.com/missing-one" } };
  vi.stubGlobal("window", browser);
  PlausibleNotFound({ enabled: true });
  route.pathname = "/missing-two";
  browser.location.href = "https://agent-demos.hsawana9.com/missing-two";
  PlausibleNotFound({ enabled: true });
  const queued = browser.plausible?.q ?? [];

  browser.location.href = "https://agent-demos.hsawana9.com/";
  const tracker = vi.fn();
  browser.plausible = tracker;
  for (const args of queued) {
    tracker(...args);
  }
  expect(tracker.mock.calls).toEqual([
    ["404", { url: "https://agent-demos.hsawana9.com/missing-one" }],
    ["404", { url: "https://agent-demos.hsawana9.com/missing-two" }],
  ]);
});
