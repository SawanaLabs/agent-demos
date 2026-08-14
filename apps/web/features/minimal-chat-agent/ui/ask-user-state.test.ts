import { describe, expect, it } from "vitest";

import { buildAskUserOutput } from "./ask-user-state";

const input = {
  questions: [
    {
      choices: ["Prototype", "Production", "Learning"],
      question: "What is the primary goal?",
    },
    {
      choices: ["One week", "One month", "No deadline"],
      question: "What is the timeline?",
    },
  ],
};

describe("ask-user answer state", () => {
  it("builds the model-facing question and answer pairs", () => {
    expect(
      buildAskUserOutput(input, {
        0: "Production",
        1: "One month",
      })
    ).toEqual([
      { answer: "Production", question: "What is the primary goal?" },
      { answer: "One month", question: "What is the timeline?" },
    ]);
  });

  it("blocks incomplete or whitespace-only answer sets", () => {
    expect(buildAskUserOutput(input, { 0: "Production" })).toBeNull();
    expect(
      buildAskUserOutput(input, {
        0: "Production",
        1: "   ",
      })
    ).toBeNull();
  });
});
