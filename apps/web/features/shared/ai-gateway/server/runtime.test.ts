import { describe, expect, it } from "vitest";

import {
  assertSupportedNodeRuntime,
  getNodeMajor,
  MINIMUM_NODE_VERSION,
  parseNodeVersion,
} from "./runtime";

const nodeErrorPattern = /requires Node\.js >=22\.13\.0/i;

describe("runtime contract", () => {
  it("parses the major version from a standard Node string", () => {
    expect(getNodeMajor("v24.14.0")).toBe(24);
  });

  it("parses the full semver triplet from a standard Node string", () => {
    expect(parseNodeVersion("v22.13.4")).toEqual({
      major: 22,
      minor: 13,
      patch: 4,
    });
  });

  it("rejects runtimes older than the workspace contract", () => {
    expect(() => assertSupportedNodeRuntime("v22.12.9")).toThrowError(
      nodeErrorPattern
    );
  });

  it("accepts the minimum supported runtime exactly", () => {
    expect(assertSupportedNodeRuntime(`v${MINIMUM_NODE_VERSION}`)).toBe(22);
  });
});
