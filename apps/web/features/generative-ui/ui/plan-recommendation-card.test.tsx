import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { GenerativeUiToolPart } from "./message-parts";
import { PlanRecommendationCard } from "./plan-recommendation-card";

describe("PlanRecommendationCard", () => {
  it("renders partial recommendation input while the UI tool is streaming", () => {
    const html = renderToStaticMarkup(
      <PlanRecommendationCard
        part={
          {
            input: {
              decision: "Choose a generative UI demo slice",
              recommendedOption: {
                name: "Streaming Generative UI",
              },
            },
            state: "input-streaming",
            toolCallId: "call_plan",
            type: "tool-showPlanRecommendation",
          } as GenerativeUiToolPart
        }
      />
    );

    expect(html).toContain("Choose a generative UI demo slice");
    expect(html).toContain("Streaming Generative UI");
    expect(html).not.toContain("Recommendation output did not match");
  });

  it("renders a user-facing error when recommendation finalization fails", () => {
    const html = renderToStaticMarkup(
      <PlanRecommendationCard
        part={
          {
            input: {
              decision: "Choose a generative UI demo slice",
            },
            state: "output-error",
            toolCallId: "call_plan",
            type: "tool-showPlanRecommendation",
          } as GenerativeUiToolPart
        }
      />
    );

    expect(html).toContain("Recommendation output could not be finalized.");
    expect(html).not.toContain("output-error");
    expect(html).not.toContain("Recommendation generated");
  });
});
