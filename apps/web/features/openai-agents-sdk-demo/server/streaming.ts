import type { RunStreamEvent } from "@openai/agents";

import type { OpenAiAgentsSdkDemoMessageMetadata } from "../message-metadata";

function pushUnique(target: string[], value: string | undefined, limit = 8) {
  if (!value || target.includes(value)) {
    return;
  }

  if (target.length >= limit) {
    return;
  }

  target.push(value);
}

async function* iterateReadableStream<T>(stream: ReadableStream<T>) {
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        return;
      }

      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

function getAsyncIterable(source: AsyncIterable<RunStreamEvent> | ReadableStream<RunStreamEvent>) {
  if (Symbol.asyncIterator in source) {
    return source as AsyncIterable<RunStreamEvent>;
  }

  return iterateReadableStream(source as ReadableStream<RunStreamEvent>);
}

export function createOpenAiAgentsSdkDemoStreamSummaryCollector() {
  const summary = {
    agentNames: [] as string[],
    rawModelEventCount: 0,
    rawModelEventTypes: [] as string[],
    rawModelSources: [] as string[],
    runItemEventCount: 0,
    runItemEventNames: [] as string[],
  };

  return {
    observe(event: RunStreamEvent) {
      if (event.type === "agent_updated_stream_event") {
        pushUnique(summary.agentNames, event.agent.name);
        return;
      }

      if (event.type === "raw_model_stream_event") {
        summary.rawModelEventCount += 1;
        pushUnique(summary.rawModelSources, event.source);
        pushUnique(summary.rawModelEventTypes, event.data.type);
        return;
      }

      if (event.type === "run_item_stream_event") {
        summary.runItemEventCount += 1;
        pushUnique(summary.runItemEventNames, event.name);
      }
    },
    toMetadata(): OpenAiAgentsSdkDemoMessageMetadata | undefined {
      const hasEvents =
        summary.rawModelEventCount > 0 ||
        summary.runItemEventCount > 0 ||
        summary.agentNames.length > 0;

      if (!hasEvents) {
        return undefined;
      }

      return {
        streamSummary: summary,
        usedGuideIds: ["streaming"],
      };
    },
  };
}

export function observeOpenAiAgentsSdkDemoStreamEvents(
  source: AsyncIterable<RunStreamEvent> | ReadableStream<RunStreamEvent>,
  onEvent: (event: RunStreamEvent) => void
): AsyncIterable<RunStreamEvent> {
  const events = getAsyncIterable(source);

  return {
    async *[Symbol.asyncIterator]() {
      for await (const event of events) {
        onEvent(event);
        yield event;
      }
    },
  };
}
