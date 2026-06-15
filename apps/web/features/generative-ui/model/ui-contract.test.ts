import { describe, expect, it } from "vitest";

import {
  createFeatureComparison,
  createPlanRecommendation,
} from "./ui-contract";

describe("generative UI contract", () => {
  it("normalizes comparison tool input into a renderable output contract", () => {
    expect(
      createFeatureComparison({
        criteria: [
          {
            label: "Setup speed",
            scores: [
              {
                option: "RAG",
                rating: "mixed",
                summary: "Needs indexing before useful answers.",
              },
              {
                option: "Tool calling",
                rating: "strong",
                summary: "Can ship with one route and one tool.",
              },
            ],
          },
          {
            label: "Evidence quality",
            scores: [
              {
                option: "RAG",
                rating: "strong",
                summary: "Answers can cite retrieved documents.",
              },
              {
                option: "Tool calling",
                rating: "mixed",
                summary: "Depends on the tool outputs available.",
              },
            ],
          },
        ],
        options: [
          {
            name: "RAG",
            summary: "Ground answers in indexed documents.",
          },
          {
            name: "Tool calling",
            summary: "Let the model call capability-specific functions.",
          },
        ],
        subject: "Support chatbot architecture",
        summary: "Tool calling ships faster; RAG carries stronger evidence.",
      })
    ).toEqual({
      criteria: [
        {
          label: "Setup speed",
          scores: [
            {
              option: "RAG",
              rating: "mixed",
              summary: "Needs indexing before useful answers.",
            },
            {
              option: "Tool calling",
              rating: "strong",
              summary: "Can ship with one route and one tool.",
            },
          ],
        },
        {
          label: "Evidence quality",
          scores: [
            {
              option: "RAG",
              rating: "strong",
              summary: "Answers can cite retrieved documents.",
            },
            {
              option: "Tool calling",
              rating: "mixed",
              summary: "Depends on the tool outputs available.",
            },
          ],
        },
      ],
      kind: "feature-comparison",
      options: [
        {
          name: "RAG",
          summary: "Ground answers in indexed documents.",
        },
        {
          name: "Tool calling",
          summary: "Let the model call capability-specific functions.",
        },
      ],
      subject: "Support chatbot architecture",
      summary: "Tool calling ships faster; RAG carries stronger evidence.",
    });
  });

  it("keeps comparison output renderable when generated score labels drift from option names", () => {
    const output = createFeatureComparison({
      criteria: [
        {
          label: "Fit",
          scores: [
            {
              option: "Unknown",
              rating: "weak",
              summary: "No known option.",
            },
          ],
        },
        {
          label: "Risk",
          scores: [
            {
              option: "Known",
              rating: "mixed",
              summary: "Known option has manageable risk.",
            },
          ],
        },
      ],
      options: [
        {
          name: "Known",
          summary: "Known option.",
        },
        {
          name: "Also known",
          summary: "Second known option.",
        },
      ],
      subject: "Invalid comparison",
      summary: "This should fail.",
    });

    expect(output.kind).toBe("feature-comparison");
    expect(output.subject).toBe("Invalid comparison");
    expect(output.criteria[0]?.scores[0]?.option).toBe("Unknown");
  });

  it("normalizes recommendation tool input into a renderable output contract", () => {
    expect(
      createPlanRecommendation({
        alternatives: [
          {
            name: "RAG",
            tradeoff: "Stronger evidence, more setup.",
          },
        ],
        decision: "Pick an agent pattern for a thirty minute demo",
        nextSteps: ["Use a single API route.", "Render one tool result."],
        rationale: [
          {
            detail: "The pattern is visible immediately in the message stream.",
            label: "Demo clarity",
          },
        ],
        recommendedOption: {
          name: "Generative UI",
          summary: "Model-selected components create the most visible demo.",
        },
        risks: [
          {
            mitigation: "Keep the schema narrow.",
            risk: "The component contract can become too generic.",
          },
        ],
      })
    ).toMatchObject({
      decision: "Pick an agent pattern for a thirty minute demo",
      kind: "plan-recommendation",
      recommendedOption: {
        name: "Generative UI",
      },
    });
  });
});
