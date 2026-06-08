import { type UIMessage, validateUIMessages } from "ai";

import { prepareProjectGuideCompanionContextMessages } from "../message-history";
import { streamProjectGuideCompanion } from "./chat";
import {
  getProjectGuideCompanionEnv,
  getProjectGuideCompanionSetupState,
  type ProjectGuideCompanionEnv,
} from "./env";

interface ProjectGuideCompanionRequestBody {
  messages?: UIMessage[];
}

interface ProjectGuideCompanionRuntimeDependencies {
  clock: () => Date;
  streamProjectGuideCompanion: (
    messages: UIMessage[],
    env: ProjectGuideCompanionEnv
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
const invalidUiMessagesError =
  'Expected each "messages" entry to match the UIMessage format.';
const malformedJsonError = "Expected a valid JSON request body.";

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

async function readProjectGuideCompanionMessages(body: unknown) {
  const { messages } = (body ?? {}) as ProjectGuideCompanionRequestBody;

  if (!Array.isArray(messages)) {
    throw new Error(invalidMessagesError);
  }

  try {
    return await validateUIMessages({ messages });
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

  let messages: UIMessage[];

  try {
    messages = await readProjectGuideCompanionMessages(await request.json());
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: malformedJsonError }, { status: 400 });
    }

    if (
      error instanceof Error &&
      [invalidMessagesError, invalidUiMessagesError].includes(error.message)
    ) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }

  const stream =
    dependencies.streamProjectGuideCompanion ?? streamProjectGuideCompanion;
  const contextMessages = prepareProjectGuideCompanionContextMessages({
    messages,
    now: dependencies.clock?.() ?? new Date(),
  });

  return stream(contextMessages, env);
}
