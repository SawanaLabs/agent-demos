import { describe, expect, it } from "vitest";

import {
  getProjectGuideCompanionDefaultModel,
  getProjectGuideCompanionModelCatalog,
} from "./model-catalog";

describe("project guide companion model catalog", () => {
  it("offers the supported companion models with GLM-5 as the default", () => {
    expect(getProjectGuideCompanionDefaultModel()).toBe("zai/glm-5");
    expect(
      getProjectGuideCompanionModelCatalog().map((model) => model.id)
    ).toEqual(["zai/glm-5", "openai/gpt-4.1-mini", "openai/gpt-5-mini"]);
  });
});
