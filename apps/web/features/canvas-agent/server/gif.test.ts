import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { assembleGif } from "./gif";

describe("grid to GIF", () => {
  it("cuts a grid in row-major order and encodes looping frames with the requested timing", async () => {
    const colors = ["red", "lime", "blue", "yellow"];
    const tiles = await Promise.all(
      colors.map((background) =>
        sharp({ create: { width: 20, height: 30, channels: 3, background } })
          .png()
          .toBuffer()
      )
    );
    const grid = await sharp({
      create: { width: 40, height: 60, channels: 3, background: "white" },
    })
      .composite(
        tiles.map((input, index) => ({
          input,
          left: (index % 2) * 20,
          top: Math.floor(index / 2) * 30,
        }))
      )
      .png()
      .toBuffer();
    const image = `data:image/png;base64,${grid.toString("base64")}`;
    const output = await assembleGif(image, { rows: 2, columns: 2, fps: 4 });
    const gif = Buffer.from(output.split(",")[1] ?? "", "base64");
    const meta = await sharp(gif, { animated: true }).metadata();
    expect(meta).toMatchObject({
      format: "gif",
      width: 20,
      pageHeight: 30,
      pages: 4,
      loop: 0,
      delay: [250, 250, 250, 250],
    });
    const { data, info } = await sharp(gif, { animated: true })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(
      [0, 1, 2, 3].map((frame) => [
        ...data.subarray(
          frame * 20 * 30 * info.channels,
          frame * 20 * 30 * info.channels + 3
        ),
      ])
    ).toEqual([
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
      [255, 255, 0],
    ]);
  });
});

it("runs GIF processing without AI and keeps the upstream image when settings change", async () => {
  const { createNode, editGraph, parseGraph, removeNodes } = await import(
    "../model/graph"
  );
  const { runGraph, generateNode } = await import("./runner");
  const png = await sharp({
    create: { width: 32, height: 32, channels: 3, background: "red" },
  })
    .png()
    .toBuffer();
  const source = { ...createNode("image", 0), id: "source", prompt: "a grid" };
  const gif = { ...createNode("gif", 1), id: "gif" };
  const graph = parseGraph({
    nodes: [source, gif],
    edges: [{ source: "source", target: "gif" }],
    outputs: {
      source: { image: `data:image/png;base64,${png.toString("base64")}` },
    },
    assets: {},
    errors: {},
    revision: 0,
  });
  const result = await runGraph(graph, "gif", generateNode);
  expect(result.outputs.source).toEqual(graph.outputs.source);
  expect(result.outputs.gif?.image).toMatch(/^data:image\/gif;base64,/);
  const unfinished = { ...createNode("image", 2), id: "unfinished" };
  const withUnfinished = editGraph(result, {
    nodes: [...result.nodes, unfinished],
    edges: [...result.edges, { source: source.id, target: unfinished.id }],
  });
  const cleaned = removeNodes(withUnfinished, [unfinished.id]);
  expect(cleaned.nodes).toEqual(result.nodes);
  expect(cleaned.edges).toEqual(result.edges);
  expect(cleaned.outputs).toEqual(result.outputs);
  const edited = editGraph(result, {
    nodes: [source, { ...gif, gif: { rows: 2, columns: 2, fps: 8 } }],
    edges: graph.edges,
  });
  expect(edited.outputs.source).toEqual(graph.outputs.source);
  expect(edited.outputs.gif).toBeUndefined();
  expect(parseGraph(JSON.parse(JSON.stringify(result))).outputs.gif).toEqual(
    result.outputs.gif
  );
});
