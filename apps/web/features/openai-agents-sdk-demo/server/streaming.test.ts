import type { RunStreamEvent } from "@openai/agents";
import { describe, expect, it } from "vitest";

import {
  createOpenAiAgentsSdkDemoStreamSummaryCollector,
  observeOpenAiAgentsSdkDemoStreamEvents,
} from "./streaming";

describe("openai agents sdk demo streaming", () => {
  it("collects developer-visible stream metadata from official RunStreamEvent types", async () => {
    const collector = createOpenAiAgentsSdkDemoStreamSummaryCollector();
    const events: RunStreamEvent[] = [
      {
        agent: {
          name: "Research Memo Agent",
        },
        type: "agent_updated_stream_event",
      } as unknown as RunStreamEvent,
      {
        data: {
          type: "response.output_text.delta",
        },
        source: "openai-responses",
        type: "raw_model_stream_event",
      } as unknown as RunStreamEvent,
      {
        item: {
          rawItem: {
            type: "function_call",
          },
        },
        name: "tool_called",
        type: "run_item_stream_event",
      } as unknown as RunStreamEvent,
    ];

    const observedEvents: unknown[] = [];

    for await (const event of observeOpenAiAgentsSdkDemoStreamEvents(
      {
        async *[Symbol.asyncIterator]() {
          yield* events;
        },
      },
      (event) => collector.observe(event)
    )) {
      observedEvents.push(event);
    }

    expect(observedEvents).toEqual(events);
    expect(collector.toMetadata()).toEqual({
      streamSummary: {
        agentNames: ["Research Memo Agent"],
        rawModelEventCount: 1,
        rawModelEventTypes: ["response.output_text.delta"],
        rawModelSources: ["openai-responses"],
        runItemEventCount: 1,
        runItemEventNames: ["tool_called"],
      },
      usedGuideIds: ["streaming"],
    });
  });
});
