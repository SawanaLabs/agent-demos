import { describe, expect, it } from "vitest";

import { readyDemoCatalogEntries } from "@/features/demo-catalog/registry";
import {
  demoActionCatalog,
  parseAcceptedDemoAction,
  serializeAcceptedDemoAction,
} from "./demo-action-contract";

describe("ready demo action catalog", () => {
  it("classifies every ready Agent Demo with one to three bounded actions", () => {
    const readySlugs = readyDemoCatalogEntries
      .map((entry) => entry.slug)
      .sort();
    const actionSlugs = Object.keys(demoActionCatalog).sort();

    expect(actionSlugs).toEqual(readySlugs);

    for (const actions of Object.values(demoActionCatalog)) {
      expect(actions.length).toBeGreaterThanOrEqual(1);
      expect(actions.length).toBeLessThanOrEqual(3);
      expect(new Set(actions).size).toBe(actions.length);
    }
  });

  it("round-trips only catalog pairs and strips all other fields", () => {
    const value = serializeAcceptedDemoAction({
      action: "edit_message",
      demoSlug: "ultra-chatbot-agent",
    });

    expect(value).toBe("ultra-chatbot-agent:edit_message");
    expect(parseAcceptedDemoAction(value)).toEqual({
      action: "edit_message",
      demo_slug: "ultra-chatbot-agent",
    });
    expect(
      parseAcceptedDemoAction(
        "ultra-chatbot-agent:edit_message:visitor-identifier"
      )
    ).toBeNull();
    expect(
      serializeAcceptedDemoAction({
        action: "clicked_anything",
        demoSlug: "ultra-chatbot-agent",
      })
    ).toBeNull();
  });
});
