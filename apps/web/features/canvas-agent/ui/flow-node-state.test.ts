import { applyNodeChanges, type Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { retainNodeState } from "./flow-node-state";

const project = (): Node[] =>
  ["workflow", "result", "display"].map((type) => ({
    id: type,
    type,
    position: { x: 0, y: 0 },
    data: { label: type },
  }));

describe("controlled canvas node state", () => {
  it("retains every node's measurement through drag and content updates", () => {
    const measured = applyNodeChanges(
      project().map(({ id }) => ({
        id,
        type: "dimensions" as const,
        dimensions: { width: 320, height: 240 },
      })),
      project()
    );
    const dragged = applyNodeChanges(
      [
        {
          id: "workflow",
          type: "position",
          position: { x: 100, y: 80 },
          dragging: true,
        },
        { id: "workflow", type: "select", selected: true },
      ],
      measured
    );
    const projected = project().map((node) => ({
      ...node,
      position: node.id === "workflow" ? { x: 100, y: 80 } : node.position,
      data: { label: "updated" },
    }));
    const next = retainNodeState(projected, dragged);
    expect(
      next.every(
        (node) => node.measured?.width === 320 && node.measured.height === 240
      )
    ).toBe(true);
    expect(next[0]).toMatchObject({
      position: { x: 100, y: 80 },
      selected: true,
      dragging: true,
      data: { label: "updated" },
    });
    const resized = applyNodeChanges(
      [
        {
          id: "result",
          type: "dimensions",
          dimensions: { width: 320, height: 480 },
        },
      ],
      next
    );
    expect(retainNodeState(projected, resized)[1]?.measured?.height).toBe(480);
    expect(retainNodeState([], resized)).toEqual([]);
    expect(
      retainNodeState(
        projected.map((node) => ({ ...node, type: "changed" })),
        resized
      )[0]?.measured
    ).toBeUndefined();
  });
});
