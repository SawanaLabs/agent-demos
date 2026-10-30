import { afterEach, describe, expect, it, vi } from "vitest";
import { generateMockVideo } from "./mock-generation";

afterEach(() => vi.unstubAllGlobals());

describe("ShipWords fixed video test mode", () => {
  it("loads the bundled fixed video without sending cast photos", async () => {
    const video = new Blob(["fixed video"], { type: "video/mp4" });
    const fetchVideo = vi.fn().mockResolvedValue(new Response(video));
    vi.stubGlobal("fetch", fetchVideo);
    const controller = new AbortController();

    const result = await generateMockVideo(controller.signal);

    expect(fetchVideo).toHaveBeenCalledWith(
      "/shipwords-video/mock-result.mp4",
      { signal: controller.signal }
    );
    expect(await result.text()).toBe("fixed video");
    expect(result.type).toBe("video/mp4");
  });

  it("reports a missing sample instead of returning a fake success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 404 }))
    );

    await expect(
      generateMockVideo(new AbortController().signal)
    ).rejects.toThrow("Test video request failed: 404");
  });
});
