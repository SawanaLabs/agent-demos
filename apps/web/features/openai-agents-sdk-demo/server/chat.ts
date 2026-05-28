import {
  run,
  setDefaultOpenAIClient,
  setOpenAIAPI,
  setOpenAIResponsesTransport,
} from "@openai/agents";
import type { RunStreamEvent, RunToolApprovalItem } from "@openai/agents";
import { createAiSdkUiMessageStream } from "@openai/agents-extensions/ai-sdk-ui";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessageChunk,
  type UIMessage,
} from "ai";
import OpenAI from "openai";

import { createOpenAiAgentsSdkDemoAgent } from "./agents";
import {
  assertOpenAiAgentsSdkDemoNoPendingApproval,
  getOpenAiAgentsSdkDemoApprovalErrorMessage,
  getOpenAiAgentsSdkDemoApprovalResumeState,
  getOpenAiAgentsSdkDemoApprovalUsageMetadata,
} from "./approvals";
import {
  createOpenAiAgentsSdkDemoContext,
  getOpenAiAgentsSdkDemoContextUsageMetadata,
} from "./context";
import { getOpenAiAgentsSdkDemoAiSdkExtensionUsageMetadata } from "./extensions";
import {
  getOpenAiAgentsSdkDemoGuardrailErrorMessage,
  getOpenAiAgentsSdkDemoGuardrailUsageMetadata,
} from "./guardrails";
import { getOpenAiAgentsSdkDemoHandoffUsageMetadata } from "./handoffs";
import type { OpenAiAgentsSdkDemoMessageMetadata } from "../message-metadata";
import {
  connectOpenAiAgentsSdkDemoMcpServers,
  getOpenAiAgentsSdkDemoMcpUsageMetadata,
} from "./mcp";
import {
  getOpenAiAgentsSdkDemoModelProfile,
  getOpenAiAgentsSdkDemoProviderErrorMessage,
  isOpenAiAgentsSdkDemoImageGenerationProviderBlocked,
} from "./models";
import {
  getOpenAiAgentsSdkDemoSandboxRunConfig,
  getOpenAiAgentsSdkDemoSandboxUsageMetadata,
  recordOpenAiAgentsSdkDemoSandboxSessionState,
} from "./sandbox";
import { getOpenAiAgentsSdkDemoArtifactChunks } from "./stream-artifacts";
import {
  getOpenAiAgentsSdkDemoRunRequest,
  getOpenAiAgentsSdkDemoRunProfile,
  getOpenAiAgentsSdkDemoRunningUsageMetadata,
} from "./running";
import { getOpenAiAgentsSdkDemoResultUsageMetadata } from "./results";
import {
  getOpenAiAgentsSdkDemoSession,
  getOpenAiAgentsSdkDemoSessionUsageMetadata,
} from "./sessions";
import {
  createOpenAiAgentsSdkDemoStreamSummaryCollector,
  observeOpenAiAgentsSdkDemoStreamEvents,
} from "./streaming";
import {
  createOpenAiAgentsSdkDemoTraceRunConfig,
  getOpenAiAgentsSdkDemoLatestTraceUsageMetadata,
  getOpenAiAgentsSdkDemoTraceUsageMetadata,
} from "./tracing";
import { getOpenAiAgentsSdkDemoRunUsageMetadata } from "./tools";

type DemoEnv = Record<string, string | undefined>;

function isLikelyImageGenerationPrompt(messages: UIMessage[]) {
  const latestUserText = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  if (!latestUserText) {
    return false;
  }

  const content = latestUserText.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim()
    .toLowerCase();

  if (!content) {
    return false;
  }

  return /生成.*图|图片|image|draw|illustration|artwork|poster/.test(content);
}

function configureOpenAiAgentsSdkDemoGatewayClient(env: DemoEnv) {
  const modelProfile = getOpenAiAgentsSdkDemoModelProfile(env);

  setOpenAIAPI(modelProfile.api);
  setOpenAIResponsesTransport(modelProfile.responsesTransport);
  setDefaultOpenAIClient(
    new OpenAI({
      apiKey: env.AI_GATEWAY_API_KEY,
      baseURL: modelProfile.baseUrl,
    }),
  );
}

async function createDemoAgent(env: DemoEnv, origin: string) {
  const modelProfile = getOpenAiAgentsSdkDemoModelProfile(env);

  const mcpServers = await connectOpenAiAgentsSdkDemoMcpServers({
    origin,
  });

  return {
    agent: createOpenAiAgentsSdkDemoAgent({
      env,
      mcpServers: mcpServers.active,
      modelProfile,
    }),
    mcpServers,
  };
}

interface DemoAgentStream extends AsyncIterable<RunStreamEvent> {
  activeAgent?: {
    name?: string;
  };
  completed: Promise<unknown>;
  inputGuardrailResults?: unknown[];
  finalOutput?: unknown;
  history?: unknown[];
  interruptions?: RunToolApprovalItem[];
  lastAgent?: {
    name?: string;
  };
  lastResponseId?: string;
  output?: unknown[];
  outputGuardrailResults?: unknown[];
  rawResponses?: Parameters<
    typeof getOpenAiAgentsSdkDemoArtifactChunks
  >[0]["rawResponses"];
  newItems?: Parameters<
    typeof getOpenAiAgentsSdkDemoArtifactChunks
  >[0]["newItems"];
  state?: {
    toJSON?: () => unknown;
    usage?: {
      inputTokens?: number;
      outputTokens?: number;
      requests?: number;
      totalTokens?: number;
    };
  };
}

function createOpenAiAgentsSdkDemoUiMessageStream(
  eventSource: Parameters<typeof createAiSdkUiMessageStream>[0],
  agentStream: DemoAgentStream,
) {
  const baseStream = createAiSdkUiMessageStream(eventSource);

  return new ReadableStream<UIMessageChunk>({
    async start(controller) {
      const reader = baseStream.getReader();
      let finishChunk: UIMessageChunk | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          if (value.type === "finish") {
            finishChunk = value;
            continue;
          }

          controller.enqueue(value);
        }

        await agentStream.completed;

        for (const chunk of getOpenAiAgentsSdkDemoArtifactChunks({
          newItems: agentStream.newItems,
          rawResponses: agentStream.rawResponses,
        })) {
          controller.enqueue(chunk);
        }

        controller.enqueue(
          finishChunk ?? {
            finishReason: "stop",
            type: "finish",
          },
        );
        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
    async cancel(reason) {
      await baseStream.cancel(reason);
    },
  });
}

function mergeOpenAiAgentsSdkDemoMessageMetadata(
  ...metadataEntries: Array<OpenAiAgentsSdkDemoMessageMetadata | undefined>
): OpenAiAgentsSdkDemoMessageMetadata | undefined {
  const aiSdkExtensionSummary = metadataEntries
    .map((item) => item?.aiSdkExtensionSummary)
    .find((value) => value);
  const approvalSummary = metadataEntries
    .map((item) => item?.approvalSummary)
    .find((value) => value);
  const contextSummary = metadataEntries
    .map((item) => item?.contextSummary)
    .find((value) => value);
  const handoffSummary = metadataEntries
    .map((item) => item?.handoffSummary)
    .find((value) => value);
  const lastResponseId = metadataEntries
    .map((item) => item?.lastResponseId)
    .filter((value): value is string => Boolean(value))
    .at(-1);
  const mcpSummary = metadataEntries
    .map((item) => item?.mcpSummary)
    .find((value) => value);
  const resultSummary = metadataEntries
    .map((item) => item?.resultSummary)
    .find((value) => value);
  const sandboxSummary = metadataEntries
    .map((item) => item?.sandboxSummary)
    .find((value) => value);
  const sessionSummary = metadataEntries
    .map((item) => item?.sessionSummary)
    .find((value) => value);
  const streamSummary = metadataEntries
    .map((item) => item?.streamSummary)
    .find((value) => value);
  const traceSummary = metadataEntries
    .map((item) => item?.traceSummary)
    .find((value) => value);
  const usedGuideIds = Array.from(
    new Set(metadataEntries.flatMap((item) => item?.usedGuideIds ?? [])),
  );
  const usedGuardrailNames = Array.from(
    new Set(metadataEntries.flatMap((item) => item?.usedGuardrailNames ?? [])),
  );
  const usedToolNames = Array.from(
    new Set(metadataEntries.flatMap((item) => item?.usedToolNames ?? [])),
  );

  if (
    !aiSdkExtensionSummary &&
    !approvalSummary &&
    !contextSummary &&
    !handoffSummary &&
    !lastResponseId &&
    !mcpSummary &&
    !resultSummary &&
    !sandboxSummary &&
    !sessionSummary &&
    !streamSummary &&
    !traceSummary &&
    usedGuideIds.length === 0 &&
    usedGuardrailNames.length === 0 &&
    usedToolNames.length === 0
  ) {
    return undefined;
  }

  return {
    ...(aiSdkExtensionSummary ? { aiSdkExtensionSummary } : {}),
    ...(approvalSummary ? { approvalSummary } : {}),
    ...(contextSummary ? { contextSummary } : {}),
    ...(handoffSummary ? { handoffSummary } : {}),
    ...(lastResponseId ? { lastResponseId } : {}),
    ...(mcpSummary ? { mcpSummary } : {}),
    ...(resultSummary ? { resultSummary } : {}),
    ...(sandboxSummary ? { sandboxSummary } : {}),
    ...(sessionSummary ? { sessionSummary } : {}),
    ...(streamSummary ? { streamSummary } : {}),
    ...(traceSummary ? { traceSummary } : {}),
    ...(usedGuideIds.length > 0 ? { usedGuideIds } : {}),
    ...(usedGuardrailNames.length > 0 ? { usedGuardrailNames } : {}),
    ...(usedToolNames.length > 0 ? { usedToolNames } : {}),
  };
}

export async function streamOpenAiAgentsSdkDemo(
  messages: UIMessage[],
  env: DemoEnv = process.env,
  options?: {
    origin?: string;
    signal?: AbortSignal;
  },
) {
  configureOpenAiAgentsSdkDemoGatewayClient(env);
  const modelProfile = getOpenAiAgentsSdkDemoModelProfile(env);
  const { agent, mcpServers } = await createDemoAgent(
    env,
    options?.origin ?? "http://localhost:3000",
  );
  let shouldCloseMcpServersImmediately = true;
  const runProfile = getOpenAiAgentsSdkDemoRunProfile(env);
  const session = await getOpenAiAgentsSdkDemoSession(messages);
  const demoContext = await createOpenAiAgentsSdkDemoContext({
    messages,
    session,
  });
  const traceRunConfig = createOpenAiAgentsSdkDemoTraceRunConfig({
    env,
    sessionId: demoContext.sessionId,
    workflowName: runProfile.workflowName,
  });
  const sandboxRunConfig = getOpenAiAgentsSdkDemoSandboxRunConfig({
    sessionId: demoContext.sessionId,
  });
  const approvalResume = await getOpenAiAgentsSdkDemoApprovalResumeState(
    messages,
    agent,
  );

  assertOpenAiAgentsSdkDemoNoPendingApproval(messages);

  let agentStream: DemoAgentStream;

  if (approvalResume) {
    agentStream = (await run(agent, approvalResume.state, {
      ...(options?.signal ? { signal: options.signal } : {}),
      maxTurns: runProfile.maxTurns,
      ...sandboxRunConfig,
      session,
      stream: true as const,
    })) as DemoAgentStream;
  } else {
    const runRequest = getOpenAiAgentsSdkDemoRunRequest(
      {
        messages,
        signal: options?.signal,
      },
      env,
    );

    agentStream = (await run(agent, runRequest.input, {
      context: demoContext,
      ...runRequest.options,
      ...sandboxRunConfig,
      session,
      ...traceRunConfig.options,
    })) as DemoAgentStream;
  }
  const streamSummaryCollector =
    createOpenAiAgentsSdkDemoStreamSummaryCollector();
  const observedEventStream = observeOpenAiAgentsSdkDemoStreamEvents(
    agentStream,
    (event) => {
      streamSummaryCollector.observe(event);
    },
  );
  const uiMessageStream = createOpenAiAgentsSdkDemoUiMessageStream(
    observedEventStream,
    agentStream,
  );

  try {
    const response = createUIMessageStreamResponse({
      stream: createUIMessageStream({
        execute({ writer }) {
          writer.merge(uiMessageStream);

          return agentStream.completed
            .then(() => {
              const sessionMetadataPromise =
                getOpenAiAgentsSdkDemoSessionUsageMetadata(session);

              return sessionMetadataPromise.then((sessionMetadata) => {
                recordOpenAiAgentsSdkDemoSandboxSessionState({
                  sessionId: demoContext.sessionId,
                  state: agentStream.state,
                });

                const metadata = mergeOpenAiAgentsSdkDemoMessageMetadata(
                  getOpenAiAgentsSdkDemoRunningUsageMetadata(
                    agentStream.lastResponseId,
                  ),
                  getOpenAiAgentsSdkDemoApprovalUsageMetadata({
                    interruptions: agentStream.interruptions ?? [],
                    responses: approvalResume?.responses,
                    state: agentStream.state,
                  }),
                  streamSummaryCollector.toMetadata(),
                  getOpenAiAgentsSdkDemoHandoffUsageMetadata({
                    activeAgentName: agentStream.lastAgent?.name,
                    newItems: agentStream.newItems ?? [],
                  }),
                  getOpenAiAgentsSdkDemoResultUsageMetadata({
                    activeAgentName: agentStream.activeAgent?.name,
                    finalOutput: agentStream.finalOutput,
                    hasResumableState: Boolean(agentStream.state),
                    historyLength: agentStream.history?.length ?? 0,
                    interruptionCount: agentStream.interruptions?.length ?? 0,
                    lastAgentName: agentStream.lastAgent?.name,
                    newItemsCount: agentStream.newItems?.length ?? 0,
                    outputCount: agentStream.output?.length ?? 0,
                    rawResponseCount: agentStream.rawResponses?.length ?? 0,
                    usage: agentStream.state?.usage,
                  }),
                  getOpenAiAgentsSdkDemoContextUsageMetadata(demoContext),
                  getOpenAiAgentsSdkDemoMcpUsageMetadata({
                    mcpServers,
                    newItems: agentStream.newItems ?? [],
                  }),
                  getOpenAiAgentsSdkDemoSandboxUsageMetadata({
                    newItems: agentStream.newItems ?? [],
                    sessionId: demoContext.sessionId,
                    state: agentStream.state,
                  }),
                  getOpenAiAgentsSdkDemoAiSdkExtensionUsageMetadata(),
                  sessionMetadata,
                  approvalResume
                    ? getOpenAiAgentsSdkDemoLatestTraceUsageMetadata(messages)
                    : getOpenAiAgentsSdkDemoTraceUsageMetadata(
                        traceRunConfig.summary,
                      ),
                  getOpenAiAgentsSdkDemoRunUsageMetadata(
                    agentStream.newItems ?? [],
                  ),
                  getOpenAiAgentsSdkDemoGuardrailUsageMetadata({
                    inputGuardrailResults: (agentStream.inputGuardrailResults ??
                      []) as Parameters<
                      typeof getOpenAiAgentsSdkDemoGuardrailUsageMetadata
                    >[0]["inputGuardrailResults"],
                    outputGuardrailResults:
                      (agentStream.outputGuardrailResults ?? []) as Parameters<
                        typeof getOpenAiAgentsSdkDemoGuardrailUsageMetadata
                      >[0]["outputGuardrailResults"],
                  }),
                );

                if (!metadata) {
                  return;
                }

                writer.write({
                  messageMetadata: metadata,
                  type: "message-metadata",
                });
              });
            })
            .finally(() => mcpServers.close());
        },
        onError(error) {
          const approvalMessage =
            getOpenAiAgentsSdkDemoApprovalErrorMessage(error);

          if (approvalMessage) {
            return approvalMessage;
          }

          const guardrailMessage =
            getOpenAiAgentsSdkDemoGuardrailErrorMessage(error);

          if (guardrailMessage) {
            return guardrailMessage;
          }

          if (
            error instanceof Error &&
            error.message === "terminated" &&
            isOpenAiAgentsSdkDemoImageGenerationProviderBlocked(modelProfile) &&
            isLikelyImageGenerationPrompt(messages)
          ) {
            return "The current AI Gateway Responses path registered imageGenerationTool(), but the upstream stream terminated before this demo received a renderable image artifact. In this provider configuration, image generation is blocked.";
          }

          const providerErrorMessage =
            getOpenAiAgentsSdkDemoProviderErrorMessage(error);

          if (providerErrorMessage) {
            return providerErrorMessage;
          }

          return error instanceof Error
            ? error.message
            : "The agent stream failed.";
        },
      }),
    });

    shouldCloseMcpServersImmediately = false;
    return response;
  } finally {
    if (shouldCloseMcpServersImmediately) {
      await mcpServers.close();
    }
  }
}
