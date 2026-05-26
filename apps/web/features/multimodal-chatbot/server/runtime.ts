import {
  convertToModelMessages,
  streamText,
  type UIMessage,
  validateUIMessages,
} from "ai";

import {
  createMultimodalChatbotGateway,
  getMultimodalChatbotConfig,
  getMultimodalChatbotEnv,
  getMultimodalChatbotSetupState,
  type MultimodalChatbotEnv,
} from "./env";

const invalidMessagesError = 'Expected a JSON body with a "messages" array.';
const invalidUiMessagesError =
  'Expected each "messages" entry to match the UIMessage format.';
const malformedJsonError = "Expected a valid JSON request body.";
const unsupportedMediaTypeError =
  "Only image attachments and PDF attachments are supported.";

interface MultimodalChatbotRequestBody {
  messages?: UIMessage[];
}

export interface MultimodalChatbotRuntimeState {
  acceptedMediaTypes: string[];
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

interface MultimodalChatbotRequestDependencies {
  streamMultimodalChatbot: (
    messages: UIMessage[],
    env: MultimodalChatbotEnv
  ) => Promise<Response>;
}

const acceptedMediaTypes = ["application/pdf", "image/*"] as const;

export function getMultimodalChatbotRuntimeState(
  env: MultimodalChatbotEnv = getMultimodalChatbotEnv()
): MultimodalChatbotRuntimeState {
  const setup = getMultimodalChatbotSetupState(env);

  return {
    acceptedMediaTypes: [...acceptedMediaTypes],
    chatModel: setup.config.chatModel,
    isChatAvailable: setup.isReady,
    nodeVersion: setup.nodeVersion,
    setupMessage: setup.issues.length > 0 ? setup.issues.join(" ") : null,
    statusLabel: setup.isReady ? "Ready" : "Setup required",
  };
}

function assertAcceptedMediaTypes(messages: UIMessage[]) {
  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type !== "file") {
        continue;
      }

      const mediaType = part.mediaType ?? "";
      const isAccepted =
        mediaType.startsWith("image/") || mediaType === "application/pdf";

      if (!isAccepted) {
        throw new Error(unsupportedMediaTypeError);
      }
    }
  }
}

async function readMultimodalChatbotMessages(
  body: unknown
): Promise<UIMessage[]> {
  const { messages } = (body ?? {}) as MultimodalChatbotRequestBody;

  if (!Array.isArray(messages)) {
    throw new Error(invalidMessagesError);
  }

  try {
    const validatedMessages = await validateUIMessages({ messages });
    assertAcceptedMediaTypes(validatedMessages);
    return validatedMessages;
  } catch (error) {
    if (error instanceof Error && error.message === unsupportedMediaTypeError) {
      throw error;
    }

    throw new Error(invalidUiMessagesError);
  }
}

export async function streamMultimodalChatbot(
  messages: UIMessage[],
  env: MultimodalChatbotEnv
) {
  const gateway = createMultimodalChatbotGateway(env);
  const { chatModel } = getMultimodalChatbotConfig(env);

  const result = streamText({
    model: gateway(chatModel),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}

export async function handleMultimodalChatbotRequest(
  request: Request,
  env: MultimodalChatbotEnv = getMultimodalChatbotEnv(),
  dependencies: MultimodalChatbotRequestDependencies = {
    streamMultimodalChatbot,
  }
) {
  const runtimeState = getMultimodalChatbotRuntimeState(env);

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
    messages = await readMultimodalChatbotMessages(await request.json());
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
      [
        invalidMessagesError,
        invalidUiMessagesError,
        unsupportedMediaTypeError,
      ].includes(error.message)
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

  return dependencies.streamMultimodalChatbot(messages, env);
}
