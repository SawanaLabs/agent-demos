import { afterEach, expect, it, vi } from "vitest";
import { canvasChatError, canvasChatFetch } from "./chat-error";

afterEach(() => vi.unstubAllGlobals());
it("always shows a failed request, including empty SDK errors", () => {
  expect(canvasChatError(new Error(String()), "error")).toContain("请求未完成");
  expect(canvasChatError(undefined, "error")).toContain("请求未完成");
  expect(canvasChatError(undefined, "ready")).toBeUndefined();
});
it("turns an empty 500 response into a visible error without retrying generation", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
  vi.stubGlobal("fetch", fetch);
  await expect(canvasChatFetch("/api/chat")).rejects.toThrow(
    "服务暂时不可用（500）"
  );
  expect(fetch).toHaveBeenCalledTimes(1);
});
