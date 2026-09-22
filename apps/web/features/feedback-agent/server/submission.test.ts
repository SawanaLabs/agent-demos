import { describe, expect, it } from "vitest";
import { parseSubmission } from "./submission";

describe("feedback capture boundary", () => {
  it("keeps annotations while filtering credentials before storage", async () => {
    const form = new FormData();
    form.set("feedback[description]", "Export fails");
    form.set("feedback[page_url]", "https://example.com/report?token=private");
    form.set(
      "feedback[annotations]",
      JSON.stringify([{ targetSelector: "#export", targetText: "Export" }])
    );
    form.set("feedback[target_element]", JSON.stringify({ token: "private" }));
    const result = await parseSubmission(form, "sensitive-data-v1");
    expect(result.context.page_url).toBe("https://example.com/report");
    expect(result.context.target_element).toEqual({ token: "[Filtered]" });
    expect(result.context.annotations).toEqual([
      { targetSelector: "#export", targetText: "Export" },
    ]);
  });

  it("discards binary evidence from older capture policies", async () => {
    const form = new FormData();
    form.set("feedback[description]", "Export fails");
    form.set(
      "feedback[screenshot]",
      new Blob(["unsafe"], { type: "image/png" }),
      "page.png"
    );
    expect((await parseSubmission(form, null)).screenshot).toBeUndefined();
  });

  it("rejects empty reports and malformed structured evidence", async () => {
    await expect(parseSubmission(new FormData(), null)).rejects.toThrow();
    const form = new FormData();
    form.set("feedback[description]", "Export fails");
    form.set("feedback[annotations]", "invalid");
    await expect(parseSubmission(form, null)).rejects.toThrow();
  });
});
