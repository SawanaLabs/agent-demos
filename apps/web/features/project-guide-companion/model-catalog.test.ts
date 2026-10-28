import { describe, expect, it } from "vitest";

import {
  getProjectGuideCompanionDefaultModel,
  getProjectGuideCompanionModelCatalog,
  resolveProjectGuideCompanionModelId,
} from "./model-catalog";

describe("project guide companion model catalog", () => {
  it("offers the supported companion models with GPT Luna as the default", () => {
    expect(getProjectGuideCompanionDefaultModel()).toBe("openai/gpt-5.6-luna");
    expect(resolveProjectGuideCompanionModelId(undefined)).toBe(
      "openai/gpt-5.6-luna"
    );
    expect(
      getProjectGuideCompanionModelCatalog().map((model) => model.id)
    ).toEqual([
      "openai/gpt-5.6-luna",
      "zai/glm-5",
      "openai/gpt-4.1-mini",
      "openai/gpt-5-mini",
    ]);
    expect(
      getProjectGuideCompanionModelCatalog().map((model) => model.kind)
    ).toEqual(["reasoning", "chat", "chat", "reasoning"]);
  });
});
