import { afterEach, expect, it, vi } from "vitest";

const upload = vi.hoisted(() => vi.fn());
vi.mock("@vercel/blob/client", () => ({ upload }));

import { createNode, parseGraph } from "../model/graph";
import { storeGraphImages } from "./image-upload";

afterEach(() => vi.unstubAllGlobals());
it("migrates a shared legacy image once and leaves no base64 in the graph", async () => {
  const image = "data:image/png;base64,AQID";
  const url =
    "https://test.public.blob.vercel-storage.com/canvas-agent/uploads/user/grid.png";
  upload.mockResolvedValue({ url });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string) =>
      input.startsWith("data:")
        ? new Response(
            new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" })
          )
        : Response.json({ pathname: "canvas-agent/uploads/user/grid" })
    )
  );
  const node = { ...createNode("reference", 0), id: "reference" };
  const graph = parseGraph({
    nodes: [node],
    edges: [],
    assets: { reference: image },
    outputs: { reference: { image } },
    errors: {},
    revision: 0,
  });
  const stored = await storeGraphImages(graph);
  expect(upload).toHaveBeenCalledTimes(1);
  expect(stored.assets.reference).toBe(url);
  expect(stored.outputs.reference?.image).toBe(url);
  expect(JSON.stringify(stored)).not.toContain("base64");
  expect(graph.assets.reference).toBe(image);
});
