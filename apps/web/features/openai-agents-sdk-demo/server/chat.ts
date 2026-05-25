import {
  type AgentInputItem,
  run,
  setDefaultOpenAIClient,
  setOpenAIAPI,
  setOpenAIResponsesTransport,
} from "@openai/agents";
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
  getOpenAiAgentsSdkDemoGuardrailErrorMessage,
  getOpenAiAgentsSdkDemoGuardrailUsageMetadata,
} from "./guardrails";
import type { OpenAiAgentsSdkDemoMessageMetadata } from "../message-metadata";
import {
  getOpenAiAgentsSdkDemoModelProfile,
  isOpenAiAgentsSdkDemoImageGenerationProviderBlocked,
} from "./models";
import { getOpenAiAgentsSdkDemoArtifactChunks } from "./stream-artifacts";
import { getOpenAiAgentsSdkDemoRunUsageMetadata } from "./tools";

type DemoEnv = Record<string, string | undefined>;

function getTextContent(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function createUserInputItem(content: string): AgentInputItem {
  return {
    content,
    role: "user",
  };
}

function createAssistantInputItem(content: string): AgentInputItem {
  return {
    content: [{ text: content, type: "output_text" }],
    role: "assistant",
    status: "completed",
  };
}

function convertToAgentInput(messages: UIMessage[]): AgentInputItem[] {
  const items: AgentInputItem[] = [];

  for (const message of messages) {
    if (message.role !== "assistant" && message.role !== "user") {
      continue;
    }

    const content = getTextContent(message);

    if (!content) {
      continue;
    }

    items.push(
      message.role === "assistant"
        ? createAssistantInputItem(content)
        : createUserInputItem(content)
    );
  }

  return items;
}

function isLikelyImageGenerationPrompt(messages: UIMessage[]) {
  const latestUserText = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  if (!latestUserText) {
    return false;
  }

  const content = getTextContent(latestUserText).toLowerCase();

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
    })
  );
}

function createDemoAgent(env: DemoEnv) {
  const modelProfile = getOpenAiAgentsSdkDemoModelProfile(env);

  return createOpenAiAgentsSdkDemoAgent({
    env,
    modelProfile,
  });
}

interface DemoAgentStream {
  completed: Promise<unknown>;
  rawResponses: Parameters<typeof getOpenAiAgentsSdkDemoArtifactChunks>[0]["rawResponses"];
  newItems: Parameters<typeof getOpenAiAgentsSdkDemoArtifactChunks>[0]["newItems"];
}

function createOpenAiAgentsSdkDemoUiMessageStream(agentStream: DemoAgentStream) {
  const baseStream = createAiSdkUiMessageStream(
    agentStream as Parameters<typeof createAiSdkUiMessageStream>[0]
  );

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
          }
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
  const usedGuideIds = Array.from(
    new Set(metadataEntries.flatMap((item) => item?.usedGuideIds ?? []))
  );
  const usedGuardrailNames = Array.from(
    new Set(metadataEntries.flatMap((item) => item?.usedGuardrailNames ?? []))
  );
  const usedToolNames = Array.from(
    new Set(metadataEntries.flatMap((item) => item?.usedToolNames ?? []))
  );

  if (
    usedGuideIds.length === 0 &&
    usedGuardrailNames.length === 0 &&
    usedToolNames.length === 0
  ) {
    return undefined;
  }

  return {
    ...(usedGuideIds.length > 0 ? { usedGuideIds } : {}),
    ...(usedGuardrailNames.length > 0 ? { usedGuardrailNames } : {}),
    ...(usedToolNames.length > 0 ? { usedToolNames } : {}),
  };
}

export async function streamOpenAiAgentsSdkDemo(
  messages: UIMessage[],
  env: DemoEnv = process.env
) {
  configureOpenAiAgentsSdkDemoGatewayClient(env);
  const modelProfile = getOpenAiAgentsSdkDemoModelProfile(env);
  const agent = createDemoAgent(env);
  const agentStream = await run(agent, convertToAgentInput(messages), {
    stream: true,
  } as const);
  const uiMessageStream = createOpenAiAgentsSdkDemoUiMessageStream(agentStream);

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute({ writer }) {
        writer.merge(uiMessageStream);

        return agentStream.completed.then(() => {
          const metadata = mergeOpenAiAgentsSdkDemoMessageMetadata(
            getOpenAiAgentsSdkDemoRunUsageMetadata(agentStream.newItems),
            getOpenAiAgentsSdkDemoGuardrailUsageMetadata({
              inputGuardrailResults: agentStream.inputGuardrailResults ?? [],
              outputGuardrailResults: agentStream.outputGuardrailResults ?? [],
            })
          );

          if (!metadata) {
            return;
          }

          writer.write({
            messageMetadata: metadata,
            type: "message-metadata",
          });
        });
      },
      onError(error) {
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

        return error instanceof Error
          ? error.message
          : "The agent stream failed.";
      },
    }),
  });
}
