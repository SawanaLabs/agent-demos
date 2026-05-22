import { describe, expect, it } from "vitest";

import { contentReviewResultSchema } from "./schema";

describe("content review schema", () => {
  it("keeps nested object fields required for strict structured-output providers", () => {
    const findingsItem = contentReviewResultSchema.shape.findings._def.type;
    const evidenceItem = contentReviewResultSchema.shape.evidence._def.type;

    expect(findingsItem.shape.policyLabel.isOptional()).toBe(false);
    expect(evidenceItem.shape.filename.isOptional()).toBe(false);
  });
});
