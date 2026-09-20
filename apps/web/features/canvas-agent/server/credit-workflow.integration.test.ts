import { expect, it, vi } from "vitest";
import { createNode, initialGraph, parseGraph } from "../model/graph";

vi.mock("server-only", () => ({}));

it.skipIf(process.env.SITE_USAGE_DATABASE_INTEGRATION !== "1")(
  "continues a real HTTP conversation after a 3-credit workflow partially completes",
  async () => {
    const { database, siteUsageVisitors } = await import("@workspace/database");
    const { eq } = await import("@workspace/database/drizzle");
    const { createDatabaseSiteUsageGateStore } = await import(
      "@/features/site-usage-gate/server/store"
    );
    const visitorId = `canvas-credit-test-${crypto.randomUUID()}`;
    const store = createDatabaseSiteUsageGateStore();
    const headers = {
      "content-type": "application/json",
      cookie: `site_visitor_id=${visitorId}`,
    };
    const text = {
      ...createNode("text", 0),
      label: "广告创意",
      prompt: "用一句中文描述柚子气泡水夏日广告创意，30字以内。",
    };
    const image = {
      ...createNode("image", 1),
      label: "户外海报",
      prompt: "根据上游创意画一张户外海报。",
    };
    const graph = {
      ...initialGraph(),
      nodes: [text, image],
      edges: [{ source: text.id, target: image.id }],
    };
    async function balance() {
      const response = await fetch(
        "http://localhost:3000/api/site-usage/balance",
        { headers }
      );
      expect(response.status).toBe(200);
      return response.json();
    }
    async function chat(current: typeof graph, prompt: string) {
      const response = await fetch(
        "http://localhost:3000/api/demos/canvas-agent",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            graph: current,
            mode: "execute",
            messages: [
              {
                id: crypto.randomUUID(),
                role: "user",
                parts: [{ type: "text", text: prompt }],
              },
            ],
          }),
        }
      );
      expect(response.status).toBe(200);
      return (await response.text())
        .split("\n")
        .filter((line) => line.startsWith("data: {"))
        .map((line) => JSON.parse(line.slice(6)));
    }
    try {
      const seeded = await store.reserveCredits({
        action: "send_message",
        createdAt: new Date(),
        demoSlug: "canvas-credit-test",
        units: 47,
        visitorId,
      });
      expect(seeded.allowed).toBe(true);
      expect((await balance()).remainingUnits).toBe(3);
      const events = await chat(
        graph,
        "请运行整个工作流，先生成广告创意，再生成户外海报。若工具失败，请说明已完成部分和失败原因，不要重试。"
      );
      expect(events.filter((event) => event.type === "error")).toEqual([]);
      const toolIndex = events.findIndex(
        (event) =>
          event.type === "tool-output-available" &&
          event.output?.failure?.code === "resource_usage_denied"
      );
      expect(toolIndex).toBeGreaterThan(-1);
      expect(events[toolIndex].output).toMatchObject({
        failedNodeId: image.id,
        failure: { requiredUnits: 5, remainingUnits: 2 },
        completedNodes: [{ id: text.id, label: text.label }],
      });
      const reply = events
        .slice(toolIndex + 1)
        .filter((event) => event.type === "text-delta")
        .map((event) => event.delta)
        .join("");
      expect(reply).toMatch(/积分|额度/);
      const latest = parseGraph(
        events.filter((event) => event.type === "data-canvas").at(-1).data.graph
      );
      expect(latest.outputs[text.id]?.text).toBeTruthy();
      expect(latest.outputs[image.id]).toBeUndefined();
      expect((await balance()).remainingUnits).toBe(2);
      const followup = await chat(
        latest,
        "不要生成，只将户外海报节点改名为稍后继续，保留其他内容。然后告诉我已改名。"
      );
      expect(followup.filter((event) => event.type === "error")).toEqual([]);
      const edited = parseGraph(
        followup.filter((event) => event.type === "data-canvas").at(-1).data
          .graph
      );
      expect(edited.nodes.find((node) => node.id === image.id)?.label).toBe(
        "稍后继续"
      );
      expect(edited.outputs[text.id]).toEqual(latest.outputs[text.id]);
      expect((await balance()).remainingUnits).toBe(2);
    } finally {
      await database
        .delete(siteUsageVisitors)
        .where(eq(siteUsageVisitors.id, visitorId));
    }
  }
);
