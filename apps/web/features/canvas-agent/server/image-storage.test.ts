import { afterEach, expect, it, vi } from "vitest";

const put = vi.hoisted(() => vi.fn());
vi.mock("@vercel/blob", () => ({ put }));
vi.mock("@/features/shared/vercel-blob/server/env", () => ({
  getVercelBlobToken: () => "test-token",
}));

import { loadCanvasImage, storeCanvasImage } from "./image-storage";

const url =
  "https://test.public.blob.vercel-storage.com/canvas-agent/results/grid.png";
afterEach(() => vi.unstubAllGlobals());

it("stores binary images and resolves their URL only for execution", async () => {
  put.mockResolvedValue({ url });
  expect(await storeCanvasImage("data:image/png;base64,AQID")).toBe(url);
  expect(put.mock.calls[0]?.[1]).toEqual(Buffer.from([1, 2, 3]));
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        headers: { "content-type": "image/png" },
      })
    )
  );
  expect(await loadCanvasImage(url)).toBe("data:image/png;base64,AQID");
});

it("rejects arbitrary image hosts before making a request", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  await expect(
    loadCanvasImage("https://example.com/private.png")
  ).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
});
