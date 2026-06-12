import { type UIMessage, validateUIMessages } from "ai";

import { prepareProjectGuideCompanionContextMessages } from "../message-history";
import {
  getProjectGuideCompanionAllowedModelIds,
  isProjectGuideCompanionModelId,
} from "../model-catalog";
import { streamProjectGuideCompanion } from "./chat";
import {
  getProjectGuideCompanionEnv,
  getProjectGuideCompanionSetupState,
  type ProjectGuideCompanionEnv,
} from "./env";

interface ProjectGuideCompanionRequestBody {
  messages?: UIMessage[];
  selectedChatModel?: unknown;
}

interface ProjectGuideCompanionRequestPayload {
  messages: UIMessage[];
  selectedChatModel?: string;
}

interface ProjectGuideCompanionRuntimeDependencies {
  clock: () => Date;
  streamProjectGuideCompanion: (
    messages: UIMessage[],
    env: ProjectGuideCompanionEnv,
    selectedChatModel?: string
  ) => Promise<Response> | Response;
}

export interface ProjectGuideCompanionRuntimeState {
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

const invalidMessagesError = 'Expected a JSON body with a "messages" array.';
const invalidSelectedChatModelError =
  'Expected "selectedChatModel" to be a supported model id string.';
const invalidUiMessagesError =
  'Expected each "messages" entry to match the UIMessage format.';
const malformedJsonError = "Expected a valid JSON request body.";

function buildUnsupportedSelectedChatModelError(selectedChatModel: string) {
  return `Unsupported selectedChatModel "${selectedChatModel}". Expected one of: ${getProjectGuideCompanionAllowedModelIds().join(", ")}.`;
}

function isRequestValidationError(error: Error) {
  return (
    [
      invalidMessagesError,
      invalidSelectedChatModelError,
      invalidUiMessagesError,
    ].includes(error.message) ||
    error.message.startsWith("Unsupported selectedChatModel")
  );
}

export function getProjectGuideCompanionRuntimeState(
  env: ProjectGuideCompanionEnv = getProjectGuideCompanionEnv()
): ProjectGuideCompanionRuntimeState {
  const setup = getProjectGuideCompanionSetupState(env);

  return {
    chatModel: setup.config.chatModel,
    isChatAvailable: setup.isReady,
    nodeVersion: setup.nodeVersion,
    setupMessage: setup.issues.length > 0 ? setup.issues.join(" ") : null,
    statusLabel: setup.isReady ? "Ready" : "Setup required",
  };
}

async function readProjectGuideCompanionPayload(
  body: unknown
): Promise<ProjectGuideCompanionRequestPayload> {
  const { messages, selectedChatModel } = (body ??
    {}) as ProjectGuideCompanionRequestBody;

  if (!Array.isArray(messages)) {
    throw new Error(invalidMessagesError);
  }

  if (
    selectedChatModel !== undefined &&
    typeof selectedChatModel !== "string"
  ) {
    throw new Error(invalidSelectedChatModelError);
  }

  if (
    typeof selectedChatModel === "string" &&
    !isProjectGuideCompanionModelId(selectedChatModel)
  ) {
    throw new Error(buildUnsupportedSelectedChatModelError(selectedChatModel));
  }

  try {
    return {
      messages: await validateUIMessages({ messages }),
      selectedChatModel,
    };
  } catch {
    throw new Error(invalidUiMessagesError);
  }
}

export async function handleProjectGuideCompanionRequest(
  request: Request,
  env: ProjectGuideCompanionEnv = getProjectGuideCompanionEnv(),
  dependencies: Partial<ProjectGuideCompanionRuntimeDependencies> = {}
) {
  const runtimeState = getProjectGuideCompanionRuntimeState(env);

  if (!runtimeState.isChatAvailable) {
    return Response.json(
      {
        error: runtimeState.setupMessage,
      },
      { status: 500 }
    );
  }

  let payload: ProjectGuideCompanionRequestPayload;

  try {
    payload = await readProjectGuideCompanionPayload(await request.json());
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: malformedJsonError }, { status: 400 });
    }

    if (error instanceof Error && isRequestValidationError(error)) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }

  const stream =
    dependencies.streamProjectGuideCompanion ?? streamProjectGuideCompanion;
  const contextMessages = prepareProjectGuideCompanionContextMessages({
    messages: payload.messages,
    now: dependencies.clock?.() ?? new Date(),
  });

  return stream(contextMessages, env, payload.selectedChatModel);
}
