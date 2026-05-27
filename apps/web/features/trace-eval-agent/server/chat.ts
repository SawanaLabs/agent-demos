import { createOpenAI } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";

import { projectTraceEvalHistoryForModel } from "../model/trace-eval-chat-history";
import { getTraceEvalAgentConfig, type TraceEvalAgentEnv } from "./env";
import {
  resolveTraceEvalAgentChatModel,
  TRACE_EVAL_AGENT_PROVIDER_OPTIONS,
  TRACE_EVAL_SEARCH_TOOL_NAME,
} from "./model";

const traceEvalAgentInstructions = [
  "You are the Trace and Eval research agent demo.",
  "Turn each user request into a concise, source-grounded research answer.",
  "Assume the user wants a best-effort answer immediately.",
  "For non-trivial factual or current-event research, call web_search before finalizing the answer.",
  "Start with one broad web_search call.",
  "Only run a second web_search if the first search leaves a concrete evidence gap.",
  "Do not exceed two web_search calls in a single answer.",
  "Do not stop for clarification on broad research prompts unless a missing constraint would make the answer materially wrong.",
  "If the prompt is still broad, state the assumption briefly, run search, and continue.",
  "Use the search evidence to synthesize findings instead of copying snippets.",
  "Expose uncertainty clearly when the evidence is thin or conflicting.",
  "Whenever the tool returns enough evidence, cite at least two concrete sources in the response.",
  "Keep the final answer compact, useful, and easy to evaluate.",
].join(" ");

const trailingSlashPattern = /\/$/;
const v3AiSuffixPattern = /\/v3\/ai$/;

function resolveOpenAICompatibleBaseURL(baseURL: string) {
  const normalizedBaseURL = baseURL.replace(trailingSlashPattern, "");

  if (normalizedBaseURL.endsWith("/v1")) {
    return normalizedBaseURL;
  }

  if (normalizedBaseURL.endsWith("/v3/ai")) {
    return normalizedBaseURL.replace(v3AiSuffixPattern, "/v1");
  }

  throw new Error(
    `Trace eval agent expects AI_GATEWAY_BASE_URL to end with /v3/ai or /v1. Received: ${baseURL}`
  );
}

export async function streamTraceEvalAgent(
  messages: UIMessage[],
  env: TraceEvalAgentEnv
) {
  const { apiKey, baseURL } = getTraceEvalAgentConfig(env);
  const chatModel = resolveTraceEvalAgentChatModel(env);
  const openai = createOpenAI({
    apiKey,
    baseURL: resolveOpenAICompatibleBaseURL(baseURL),
    name: "gateway-openai",
  });
  const runId = crypto.randomUUID();
  const startedAt = Date.now();
  const messageMetadataBase = {
    model: chatModel,
    runId,
    searchTool: TRACE_EVAL_SEARCH_TOOL_NAME,
    startedAt,
  };
  const replayableMessages = projectTraceEvalHistoryForModel(messages);
  const result = streamText({
    experimental_telemetry: {
      functionId: "trace-eval-agent.run",
      isEnabled: true,
      metadata: {
        demo: "trace-eval-agent",
        runId,
        searchTool: TRACE_EVAL_SEARCH_TOOL_NAME,
      },
      recordInputs: true,
      recordOutputs: true,
    },
    messages: await convertToModelMessages(replayableMessages),
    model: openai(chatModel),
    providerOptions: TRACE_EVAL_AGENT_PROVIDER_OPTIONS,
    stopWhen: stepCountIs(8),
    system: traceEvalAgentInstructions,
    tools: {
      [TRACE_EVAL_SEARCH_TOOL_NAME]: openai.tools.webSearch({
        searchContextSize: "medium",
      }),
    },
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: ({ part }) => {
      if (part.type === "start") {
        return messageMetadataBase;
      }

      if (part.type === "finish") {
        return {
          ...messageMetadataBase,
          finishReason: part.finishReason,
          finishedAt: Date.now(),
          totalUsage: part.totalUsage,
        };
      }

      return;
    },
    originalMessages: messages,
    sendReasoning: true,
    sendSources: true,
  });
}
