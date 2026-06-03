import { getCustomerMemoryProfile } from "./customer-profiles";
import { getCustomerMemoryAgentEnv, type CustomerMemoryAgentEnv } from "./env";
import {
  invalidCustomerIdError,
  malformedJsonError,
  readCustomerMemorySessionQuery,
  readCustomerMemoryThreadCreateRequest,
} from "./contract";
import {
  createCustomerMemoryThread,
  loadCustomerMemorySession,
} from "./session";
import {
  type CustomerMemoryViewerContext,
  getReadonlyCustomerMemoryError,
  resolveCustomerMemoryViewerContext,
} from "./viewer-context";

interface CustomerMemorySessionRequestDependencies {
  loadCustomerMemorySession?: typeof loadCustomerMemorySession;
}

interface CustomerMemoryThreadCreateRequestDependencies {
  createCustomerMemoryThread?: typeof createCustomerMemoryThread;
  loadCustomerMemorySession?: typeof loadCustomerMemorySession;
}

function getDatabaseSetupError(env: CustomerMemoryAgentEnv) {
  if (env.DATABASE_URL) {
    return null;
  }

  return null;
}

export async function handleCustomerMemorySessionRequest(
  request: Request,
  viewer: CustomerMemoryViewerContext,
  env: CustomerMemoryAgentEnv = getCustomerMemoryAgentEnv(),
  dependencies: CustomerMemorySessionRequestDependencies = {}
) {
  const setupError = getDatabaseSetupError(env);

  if (setupError) {
    return Response.json(
      {
        error: setupError,
      },
      { status: 500 }
    );
  }

  try {
    const query = readCustomerMemorySessionQuery(request.url);
    const session = await (
      dependencies.loadCustomerMemorySession ?? loadCustomerMemorySession
    )({
      ...query,
      visitorId: viewer.visitorId,
    });

    return Response.json(session);
  } catch (error) {
    if (
      error instanceof Error &&
      [invalidCustomerIdError, malformedJsonError].includes(error.message)
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
      (error.message.startsWith("Unknown customer-memory profile") ||
        error.message.startsWith("No customer-memory thread found") ||
        error.message.startsWith(
          "No shared customer-memory demo thread is available"
        ))
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

export async function handleCustomerMemoryThreadCreateRequest(
  request: Request,
  viewer: CustomerMemoryViewerContext,
  env: CustomerMemoryAgentEnv = getCustomerMemoryAgentEnv(),
  dependencies: CustomerMemoryThreadCreateRequestDependencies = {}
) {
  const setupError = getDatabaseSetupError(env);

  if (setupError) {
    return Response.json(
      {
        error: setupError,
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
    const { customerId } = await readCustomerMemoryThreadCreateRequest(body);
    const customer = getCustomerMemoryProfile(customerId);

    if (!customer) {
      throw new Error(`Unknown customer-memory profile: ${customerId}`);
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

    const created = await (
      dependencies.createCustomerMemoryThread ?? createCustomerMemoryThread
    )({
      customerId,
      visitorId: viewerContext.visitorId,
    });
    const session = await (
      dependencies.loadCustomerMemorySession ?? loadCustomerMemorySession
    )({
      customerId: created.customer.id,
      threadId: created.thread.id,
      visitorId: viewerContext.visitorId,
    });

    return Response.json(session, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === invalidCustomerIdError) {
      return Response.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Unknown customer-memory profile")
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
