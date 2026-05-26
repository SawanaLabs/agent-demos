import { validateUIMessages, type UIMessage } from "ai";

export const invalidCustomerIdError =
  'Expected a non-empty "customerId" string.';
export const invalidMessagesError =
  'Expected a JSON body with a "messages" array.';
export const invalidThreadIdError = 'Expected a non-empty "threadId" string.';
export const invalidUiMessagesError =
  'Expected each "messages" entry to match the UIMessage format.';
export const malformedJsonError = "Expected a valid JSON request body.";

interface CustomerMemoryChatRequestBody {
  customerId?: string;
  messages?: UIMessage[];
  threadId?: string;
}

function readNonEmptyString(value: unknown, errorMessage: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(errorMessage);
  }

  return value.trim();
}

export async function readCustomerMemoryChatRequest(body: unknown): Promise<{
  customerId: string;
  messages: UIMessage[];
  threadId: string;
}> {
  const { customerId, messages, threadId } = (body ??
    {}) as CustomerMemoryChatRequestBody;

  if (!Array.isArray(messages)) {
    throw new Error(invalidMessagesError);
  }

  const normalizedCustomerId = readNonEmptyString(
    customerId,
    invalidCustomerIdError
  );
  const normalizedThreadId = readNonEmptyString(threadId, invalidThreadIdError);

  try {
    return {
      customerId: normalizedCustomerId,
      messages: await validateUIMessages({ messages }),
      threadId: normalizedThreadId,
    };
  } catch {
    throw new Error(invalidUiMessagesError);
  }
}

export function readCustomerMemorySessionQuery(requestUrl: string | URL): {
  customerId: string;
  query: string;
  threadId: string | null;
} {
  const url = requestUrl instanceof URL ? requestUrl : new URL(requestUrl);
  const customerId = readNonEmptyString(
    url.searchParams.get("customerId"),
    invalidCustomerIdError
  );
  const threadId = url.searchParams.get("threadId");

  return {
    customerId,
    query: url.searchParams.get("query")?.trim() ?? "",
    threadId: threadId && threadId.trim().length > 0 ? threadId.trim() : null,
  };
}

export async function readCustomerMemoryThreadCreateRequest(body: unknown) {
  const { customerId } = (body ?? {}) as { customerId?: string };

  return {
    customerId: readNonEmptyString(customerId, invalidCustomerIdError),
  };
}
