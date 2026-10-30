import { describe, expect, it } from "vitest";
import { moveCastPhoto, validateCast } from "./cast";

describe("ShipWords cast interaction", () => {
  it("moves a photo to an empty seat and swaps occupied seats", () => {
    expect(moveCastPhoto({ lead: "a" }, "lead", "sax")).toEqual({ sax: "a" });
    expect(moveCastPhoto({ lead: "a", sax: "b" }, "lead", "sax")).toEqual({
      lead: "b",
      sax: "a",
    });
  });

  it("requires a photo and photo permission before starting", () => {
    expect(validateCast({}, true)).toBe("photo-required");
    expect(validateCast({ lead: "a" }, false)).toBe("permission-required");
    expect(validateCast({ lead: "a" }, true)).toBeNull();
  });
});
