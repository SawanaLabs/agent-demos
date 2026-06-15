import { describe, expect, it } from "vitest";

import { GENERATIVE_UI_PROVIDER_OPTIONS } from "./model";

describe("generative UI model settings", () => {
  it("requests OpenAI reasoning summaries for the visible reasoning panel", () => {
    expect(GENERATIVE_UI_PROVIDER_OPTIONS.openai).toMatchObject({
      forceReasoning: true,
      reasoningSummary: "detailed",
      textVerbosity: "low",
    });
  });
});
