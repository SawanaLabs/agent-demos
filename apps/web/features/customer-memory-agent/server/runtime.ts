import type { UIMessage } from "ai";

import { getCustomerMemoryProfile } from "../customer-profiles";
import { customerMemoryCompactionThreshold } from "./compaction";
import {
  invalidCustomerIdError,
  invalidMessagesError,
  invalidThreadIdError,
  invalidUiMessagesError,
  malformedJsonError,
  readCustomerMemoryChatRequest,
} from "./contract";
import { streamCustomerMemoryConversation } from "./conversation";
import {
  getCustomerMemoryAgentEnv,
  getCustomerMemoryAgentSetupState,
  type CustomerMemoryAgentEnv,
} from "./env";
import { createCustomerMemoryThreadStore } from "./thread-store";
import {
  type CustomerMemoryViewerContext,
  getReadonlyCustomerMemoryError,
  resolveCustomerMemoryViewerContext,
} from "./viewer-context";

interface CustomerMemoryChatRequestDependencies {
  ensureThreadOwnership?: (input: {
    customerId: string;
    threadId: string;
    visitorId: string;
  }) => Promise<void>;
  streamCustomerMemoryConversation: (
    input: {
      customer: NonNullable<ReturnType<typeof getCustomerMemoryProfile>>;
      messages: UIMessage[];
      threadId: string;
      visitorId: string;
    },
    env: CustomerMemoryAgentEnv
  ) => Promise<Response>;
}

export interface CustomerMemoryRuntimeState {
  chatModel: string;
  compactionThreshold: number;
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

export function getCustomerMemoryRuntimeState(
  env: CustomerMemoryAgentEnv = getCustomerMemoryAgentEnv()
): CustomerMemoryRuntimeState {
  const setup = getCustomerMemoryAgentSetupState(env);

  return {
    chatModel: setup.config.chatModel,
    compactionThreshold: customerMemoryCompactionThreshold,
    isChatAvailable: setup.isReady,
    nodeVersion: setup.nodeVersion,
    setupMessage: setup.issues.length > 0 ? setup.issues.join(" ") : null,
    statusLabel: setup.isReady ? "Ready" : "Setup required",
  };
}

async function ensureCustomerMemoryThreadOwnership(input: {
  customerId: string;
  threadId: string;
  visitorId: string;
}) {
  const snapshot =
    await createCustomerMemoryThreadStore().loadThreadForViewer(input);

  if (!snapshot) {
    throw new Error(
      `No customer-memory thread found for ${input.threadId} under ${input.customerId}.`
    );
  }
}

export async function handleCustomerMemoryChatRequest(
  request: Request,
  viewer: CustomerMemoryViewerContext,
  env: CustomerMemoryAgentEnv = getCustomerMemoryAgentEnv(),
  dependencies: CustomerMemoryChatRequestDependencies = {
    streamCustomerMemoryConversation,
  }
) {
  const runtimeState = getCustomerMemoryRuntimeState(env);

  if (!runtimeState.isChatAvailable) {
    return Response.json(
      {
        error: runtimeState.setupMessage,
      },
      { status: 500 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        error: malformedJsonError,
      },
      { status: 400 }
    );
  }

  try {
    const { customerId, messages, threadId } =
      await readCustomerMemoryChatRequest(body);
    const customer = getCustomerMemoryProfile(customerId);

    if (!customer) {
      throw new Error(invalidCustomerIdError);
    }

    const viewerContext = resolveCustomerMemoryViewerContext({
      customer,
      visitorId: viewer.visitorId,
    });

    if (viewerContext.isReadonly) {
      return Response.json(
        {
          error: getReadonlyCustomerMemoryError(customer),
        },
        { status: 403 }
      );
    }

    const ensureThreadOwnership =
      dependencies.ensureThreadOwnership ?? ensureCustomerMemoryThreadOwnership;

    await ensureThreadOwnership({
      customerId,
      threadId,
      visitorId: viewerContext.visitorId,
    });

    return dependencies.streamCustomerMemoryConversation(
      {
        customer,
        messages,
        threadId,
        visitorId: viewerContext.visitorId,
      },
      env
    );
  } catch (error) {
    if (
      error instanceof Error &&
      [
        invalidCustomerIdError,
        invalidMessagesError,
        invalidThreadIdError,
        invalidUiMessagesError,
      ].includes(error.message)
    ) {
      return Response.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith("No customer-memory thread found")
    ) {
      return Response.json(
        {
          error: error.message,
        },
        { status: 404 }
      );
    }

    throw error;
  }
}
