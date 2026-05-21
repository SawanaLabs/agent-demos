import { describe, expect, it } from "vitest";

import {
  assertSupportedNodeRuntime,
  getNodeMajor,
  MINIMUM_NODE_MAJOR,
} from "./runtime";

const nodeErrorPattern = /requires Node\.js >=20/i;

describe("runtime contract", () => {
  it("parses the major version from a standard Node string", () => {
    expect(getNodeMajor("v24.14.0")).toBe(24);
  });

  it("rejects runtimes older than the workspace contract", () => {
    expect(() =>
      assertSupportedNodeRuntime(`v${MINIMUM_NODE_MAJOR - 1}.9.9`)
    ).toThrowError(nodeErrorPattern);
  });
});
