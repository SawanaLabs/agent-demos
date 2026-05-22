import { validateUIMessages, type UIMessage } from "ai";

import { getAiGatewaySetupState } from "@/features/shared/ai-gateway/server/env";

import {
  getRagKnowledgeBaseStatus,
  type RagKnowledgeBaseStatus,
} from "./knowledge-base-status";
import { streamRagChatbot } from "./chat";
import { ragChatbotSourceDocument } from "./source-document";

type DemoEnv = Record<string, string | undefined>;

interface RagChatbotRequestBody {
  messages?: UIMessage[];
}

export interface RagChatbotRuntimeState {
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  sourceDocument: typeof ragChatbotSourceDocument;
  setupMessage: string | null;
  statusLabel: "Index required" | "Ready" | "Setup required";
}

export interface RagChatbotRuntimeDependencies {
  getKnowledgeBaseStatus: (env: DemoEnv) => Promise<RagKnowledgeBaseStatus>;
}

interface RagChatbotRequestDependencies extends RagChatbotRuntimeDependencies {
  streamRagChatbot: (messages: UIMessage[], env: DemoEnv) => Promise<Response>;
}

const invalidMessagesError = 'Expected a JSON body with a "messages" array.';
const invalidUiMessagesError =
  'Expected each "messages" entry to match the UIMessage format.';
const malformedJsonError = "Expected a valid JSON request body.";

export async function getRagChatbotRuntimeState(
  env: DemoEnv = process.env,
  dependencies: RagChatbotRuntimeDependencies = {
    getKnowledgeBaseStatus: getRagKnowledgeBaseStatus,
  }
): Promise<RagChatbotRuntimeState> {
  const gatewaySetup = getAiGatewaySetupState(env);

  if (gatewaySetup.issues.length > 0) {
    return {
      chatModel: gatewaySetup.config.chatModel,
      isChatAvailable: false,
      nodeVersion: gatewaySetup.nodeVersion,
      sourceDocument: ragChatbotSourceDocument,
      setupMessage: gatewaySetup.issues.join(" "),
      statusLabel: "Setup required",
    };
  }

  const knowledgeBaseStatus = await dependencies.getKnowledgeBaseStatus(env);

  return {
    chatModel: gatewaySetup.config.chatModel,
    isChatAvailable: knowledgeBaseStatus.isReady,
    nodeVersion: gatewaySetup.nodeVersion,
    sourceDocument: ragChatbotSourceDocument,
    setupMessage: knowledgeBaseStatus.message,
    statusLabel: knowledgeBaseStatus.statusLabel,
  };
}

async function readRagChatbotMessages(body: unknown): Promise<UIMessage[]> {
  const { messages } = (body ?? {}) as RagChatbotRequestBody;

  if (!Array.isArray(messages)) {
    throw new Error(invalidMessagesError);
  }

  try {
    return await validateUIMessages({ messages });
  } catch {
    throw new Error(invalidUiMessagesError);
  }
}

export async function handleRagChatbotRequest(
  request: Request,
  env: DemoEnv = process.env,
  dependencies: RagChatbotRequestDependencies = {
    getKnowledgeBaseStatus: getRagKnowledgeBaseStatus,
    streamRagChatbot,
  }
) {
  const runtimeState = await getRagChatbotRuntimeState(env, dependencies);

  if (!runtimeState.isChatAvailable) {
    return Response.json(
      {
        error: runtimeState.setupMessage,
      },
      { status: 500 }
    );
  }

  let messages: UIMessage[];

  try {
    messages = await readRagChatbotMessages(await request.json());
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        {
          error: malformedJsonError,
        },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      [invalidMessagesError, invalidUiMessagesError].includes(error.message)
    ) {
      return Response.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    throw error;
  }

  return dependencies.streamRagChatbot(messages, env);
}
