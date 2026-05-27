import { describe, expect, it } from "vitest";

import { objectGenerationResultSchema } from "./schema";

describe("content review schema", () => {
  it("keeps nested object fields required for strict structured-output providers", () => {
    const findingsItem = objectGenerationResultSchema.shape.findings.element;
    const evidenceItem = objectGenerationResultSchema.shape.evidence.element;

    expect(findingsItem.shape.policyLabel.isOptional()).toBe(false);
    expect(evidenceItem.shape.filename.isOptional()).toBe(false);
  });
});
